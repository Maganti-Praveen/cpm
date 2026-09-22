// Renders a dialog to initiate account recovery by email.
// Handles code requests and updates verification steps.


import { useState, useEffect, useRef } from "react";
import { Mail, Lock, ShieldAlert, ShieldCheck, ArrowRight, X } from "lucide-react";
import * as authService from "../../services/authService";

function ForgotPasswordModal({ isOpen, onClose, initialEmail }) {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: Password, 4: Success
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const emailInputRef = useRef(null);
  const codeInputRef = useRef(null);
  const passwordInputRef = useRef(null);

  // Sync initial email when modal opens and reset state
  useEffect(() => {
    if (isOpen) {
      setEmail(initialEmail || "");
      setStep(1);
      setCode("");
      setPassword("");
      setConfirmPassword("");
      setError("");
      setSuccessMessage("");
      
      // Auto focus fields
      setTimeout(() => {
        if (initialEmail && codeInputRef.current) {
          // If we have an email, let's keep step 1 but maybe focus email anyway
          emailInputRef.current?.focus();
        } else {
          emailInputRef.current?.focus();
        }
      }, 50);
    }
  }, [isOpen, initialEmail]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    if (resendCooldown > 0) {
      setError(`Please wait ${resendCooldown} seconds before requesting another OTP.`);
      return;
    }
    setError("");
    if (!email) {
      setError("Please enter your email address.");
      return;
    }
    setLoading(true);
    try {
      const response = await authService.forgotPassword({ email });
      if (response.data?.success) {
        setStep(2);
        setResendCooldown(60); // Start 60s cooldown
        setTimeout(() => codeInputRef.current?.focus(), 50);
      } else {
        setError(response.data?.message || "Failed to send code. Please try again.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    if (code.length !== 6) {
      setError("Please enter a valid 6-digit code.");
      return;
    }
    setLoading(true);
    try {
      const response = await authService.verifyOTP({ email, code });
      if (response.data?.success) {
        setStep(3);
        setTimeout(() => passwordInputRef.current?.focus(), 50);
      } else {
        setError(response.data?.message || "Invalid or expired code.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Invalid or expired code.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    if (!password || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const response = await authService.resetPassword({ email, password, confirmPassword });
      if (response.data?.success) {
        setSuccessMessage(response.data?.message || "Password updated successfully!");
        setStep(4);
      } else {
        setError(response.data?.message || "Failed to reset password.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0f172a]/60 backdrop-blur-md flex items-center justify-center z-[999] p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md max-h-[90vh] overflow-y-auto animate-scale-up relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          aria-label="Close modal"
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
        >
          <X size={18} />
        </button>

        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-slate-900 font-display">
              {step === 1 && "Forgot Password"}
              {step === 2 && "Verify Code"}
              {step === 3 && "Reset Password"}
              {step === 4 && "Password Reset Successful"}
            </h3>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed font-normal">
              {step === 1 && "Enter your registered email address to receive a 6-digit verification code."}
              {step === 2 && `We've sent a 6-digit verification code to ${email}.`}
              {step === 3 && "Create a secure new password for your account."}
              {step === 4 && (successMessage || "Your password has been successfully updated. You can now sign in.")}
            </p>
          </div>

          {/* Errors */}
          {error && (
            <div className="flex gap-2.5 items-start p-3.5 mb-5 text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-lg">
              <ShieldAlert size={18} className="shrink-0 mt-0.5 text-rose-500 animate-pulse" />
              <p className="font-medium text-left">{error}</p>
            </div>
          )}

          {/* Step 1: Send OTP */}
          {step === 1 && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label htmlFor="reset-email" className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Mail size={18} />
                  </span>
                  <input
                    id="reset-email"
                    ref={emailInputRef}
                    type="email"
                    required
                    placeholder="Enter email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError("");
                    }}
                    className="w-full h-10 pl-10 pr-3.5 text-sm border border-slate-300 rounded-lg outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/12 transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-primary hover:bg-primary-dark text-white font-semibold rounded-lg shadow-sm hover:shadow-primary/10 transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98] disabled:active:scale-100 mt-6 flex items-center justify-center gap-2 cursor-pointer text-sm"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Sending Code...</span>
                  </>
                ) : (
                  <>
                    <span>Send Code</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Step 2: Verify OTP */}
          {step === 2 && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label htmlFor="reset-otp" className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                  Verification Code
                </label>
                <input
                  id="reset-otp"
                  ref={codeInputRef}
                  type="text"
                  required
                  maxLength={6}
                  placeholder="000000"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                    if (error) setError("");
                  }}
                  className="w-full h-12 text-center text-2xl font-bold tracking-[8px] border border-slate-300 rounded-lg outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/12 transition-all placeholder:text-slate-300"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-primary hover:bg-primary-dark text-white font-semibold rounded-lg shadow-sm hover:shadow-primary/10 transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98] disabled:active:scale-100 mt-6 flex items-center justify-center gap-2 cursor-pointer text-sm"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <span>Verify Code</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>

              <div className="mt-5 text-center text-xs font-semibold text-slate-700">
                Did not receive the email?{" "}
                <button
                  type="button"
                  onClick={() => handleSendOtp()}
                  disabled={loading || resendCooldown > 0}
                  className="text-primary hover:underline cursor-pointer bg-transparent border-none p-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resendCooldown > 0 ? `Resend Code (${resendCooldown}s)` : "Resend Code"}
                </button>
              </div>
            </form>
          )}

          {/* Step 3: Enter New Password */}
          {step === 3 && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label htmlFor="reset-new-password" className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                  New Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Lock size={18} />
                  </span>
                  <input
                    id="reset-new-password"
                    ref={passwordInputRef}
                    type="password"
                    required
                    placeholder="Minimum 6 characters"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError("");
                    }}
                    className="w-full h-10 pl-10 pr-3.5 text-sm border border-slate-300 rounded-lg outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/12 transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="reset-confirm-password" className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                  Confirm Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Lock size={18} />
                  </span>
                  <input
                    id="reset-confirm-password"
                    type="password"
                    required
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (error) setError("");
                    }}
                    className="w-full h-10 pl-10 pr-3.5 text-sm border border-slate-300 rounded-lg outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/12 transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-primary hover:bg-primary-dark text-white font-semibold rounded-lg shadow-sm hover:shadow-primary/10 transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98] disabled:active:scale-100 mt-6 flex items-center justify-center gap-2 cursor-pointer text-sm"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Saving Password...</span>
                  </>
                ) : (
                  <span>Reset Password</span>
                )}
              </button>
            </form>
          )}

          {/* Step 4: Success */}
          {step === 4 && (
            <div className="space-y-6 text-center">
              <button
                type="button"
                onClick={onClose}
                className="w-full h-11 bg-primary hover:bg-primary-dark text-white font-semibold rounded-lg shadow-sm hover:shadow-primary/10 transition-all duration-150 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer text-sm"
              >
                <span>Back to Login</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ForgotPasswordModal;
