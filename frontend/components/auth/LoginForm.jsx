import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { login, clearError, logout, verifyOtp, cancel2FA } from "../../slices/authSlice";
import { useNavigate, Link } from "react-router-dom";
import logoImg from "../../assets/logo.webp";
import { useGlobalSettings } from "../../hooks/useGlobalSettings";
import ForgotPasswordModal from "./ForgotPasswordModal";
import ContactAdminModal from "./ContactAdminModal";
import * as authService from "../../services/authService";
import { Eye, EyeOff } from "lucide-react";

/**
 * LoginForm Component
 *
 * Compiles user inputs (email, password) and coordinates Multi-Factor Authentication (MFA)
 * or 2FA checks during user login sessions.
 *
 * Key features:
 * - Integrates with Redux state (`auth` slice) to dispatch authentication requests.
 * - Handles rate-limiting cooldown parsing and exhibits countdown timers for security blockages.
 * - Implements a 60-second OTP resend limit with active visual countdowns.
 * - Supports site-specific custom branding (logos and titles).
 *
 * @component
 * @param {Object} props - Component properties.
 * @param {string} props.role - User role targeted by the login portal (e.g. CLIENT, STAFF, ADMIN).
 * @param {string} props.title - Custom greeting title shown on the login card.
 */
function LoginForm({ role, title }) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [rememberMe, setRememberMe] = useState(false);
  const [localError, setLocalError] = useState("");
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [isContactAdminOpen, setIsContactAdminOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [displayError, setDisplayError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(60);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState("");

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // load site branding (logo, colors)
  const { siteTitle, siteLogo } = useGlobalSettings();

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, isAuthenticated, user, twoFactorRequired, twoFactorEmail } = useSelector((state) => state.auth);

  useEffect(() => {
    if (twoFactorRequired) {
      setResendCooldown(60);
      setResendSuccess("");
    }
  }, [twoFactorRequired]);

  useEffect(() => {
    let activeError = localError || error || "";
    if (activeError === "Access denied. Invalid portal credentials.") {
      activeError = "Access denied. Invalid portal access.";
    }
    setDisplayError(activeError);

    if (!activeError) {
      setCountdown(null);
      return;
    }

    // Try to match seconds
    const secondsMatch = activeError.match(/Please try again in (\d+) seconds/i);
    if (secondsMatch) {
      setCountdown(parseInt(secondsMatch[1], 10));
      return;
    }

    // Try to match minutes
    const minutesMatch = activeError.match(/Please try again in (\d+) minutes/i);
    if (minutesMatch) {
      setCountdown(parseInt(minutesMatch[1], 10) * 60);
      return;
    }

    setCountdown(null);
  }, [error, localError]);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      setDisplayError("");
      dispatch(clearError());
      setLocalError("");
      setCountdown(null);
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          setDisplayError("");
          dispatch(clearError());
          setLocalError("");
          return null;
        }

        const nextValue = prev - 1;
        const activeError = localError || error || "";

        if (activeError.includes("blocked") || activeError.includes("minutes") || activeError.includes("minute")) {
          const mins = Math.floor(nextValue / 60);
          const secs = nextValue % 60;
          let timeStr = "";
          if (mins > 0) {
            timeStr = `${mins} minute${mins > 1 ? "s" : ""}${secs > 0 ? ` and ${secs} second${secs > 1 ? "s" : ""}` : ""}`;
          } else {
            timeStr = `${secs} second${secs > 1 ? "s" : ""}`;
          }
          setDisplayError(activeError.replace(/Please try again in \d+ minutes/i, `Please try again in ${timeStr}`));
        } else {
          setDisplayError(activeError.replace(/Please try again in \d+ seconds/i, `Please try again in ${nextValue} seconds`));
        }

        return nextValue;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown, error, localError, dispatch]);

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === role) {
        switch (user.role) {
          case "ADMIN":
            navigate("/admin/dashboard");
            break;
          case "STAFF":
            navigate("/staff/dashboard");
            break;
          case "CLIENT":
            navigate("/client/dashboard");
            break;
          default:
            setLocalError("Unauthorized portal role detected.");
        }
      } else {
        setLocalError(`Authorized account exists but has role: ${user.role} (Expected: ${role}). Please log in with the correct role credentials.`);
        dispatch(logout());
      }
    }
  }, [isAuthenticated, user, role, navigate, dispatch]);

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  // Load remembered email and check for suspension redirect errors on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem("remembered_email");
    if (savedEmail) {
      setFormData((prev) => ({
        ...prev,
        email: savedEmail,
      }));
      setRememberMe(true);
    }

    const suspensionErrorMsg = localStorage.getItem("suspension_error");
    if (suspensionErrorMsg) {
      setLocalError(suspensionErrorMsg);
      localStorage.removeItem("suspension_error");
    }
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (localError) setLocalError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setLocalError("Please fill out all fields.");
      return;
    }

    if (rememberMe) {
      localStorage.setItem("remembered_email", formData.email);
    } else {
      localStorage.removeItem("remembered_email");
    }

    dispatch(login({ ...formData, role }));
  };

  const [otpCode, setOtpCode] = useState("");
  const handleOtpSubmit = (e) => {
    e.preventDefault();
    if (otpCode.length !== 6) {
      setLocalError("OTP must be 6 digits.");
      return;
    }
    dispatch(verifyOtp({ email: twoFactorEmail, code: otpCode, otp: otpCode }));
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || resendLoading) return;
    setResendLoading(true);
    setResendSuccess("");
    setLocalError("");
    try {
      const res = await authService.resend2FA({ email: twoFactorEmail });
      if (res.data?.success) {
        setResendCooldown(60);
        setResendSuccess("New verification code sent to your email!");
      } else {
        setLocalError(res.data?.message || "Failed to resend code.");
      }
    } catch (err) {
      setLocalError(err.response?.data?.message || "Failed to resend code. Please try again.");
    } finally {
      setResendLoading(false);
    }
  };

  const handleCancelOtp = () => {
    dispatch(cancel2FA());
    setOtpCode("");
    setLocalError("");
    setResendSuccess("");
  };

  return (
    <div className="min-h-screen flex flex-col justify-between font-body" style={{ backgroundColor: "var(--page-bg, #F8FAFC)", color: "var(--page-text, #0F172A)" }}>
      
      {/* 1. Topbar Header */}
      <header className="flex justify-between items-center px-8 h-16 border-b shadow-sm" style={{ backgroundColor: "var(--navbar-bg, #FFFFFF)", color: "var(--navbar-text, #475569)", borderColor: "var(--border-color, rgba(226,232,240,0.8))" }} role="banner">
        <div className="flex items-center gap-3">
          <img
            src={siteLogo || logoImg}
            width="40"
            height="40"
            fetchPriority="high"
            className="w-10 h-10 shrink-0 object-contain rounded-lg bg-white p-1 border border-slate-100/90 shadow-sm"
            alt={siteTitle || "Sai IT Services logo"}
          />
          <span className="font-display font-semibold text-lg text-slate-900 tracking-tight truncate max-w-[280px]" title={siteTitle}>
            {siteTitle}
          </span>
        </div>
        <div className="flex items-center gap-6 text-sm font-medium text-slate-700">
          <Link to="/help-center" className="hover:text-slate-900 transition-colors duration-150">Help</Link>
          <button type="button" className="hover:text-slate-900 transition-colors duration-150 bg-transparent border-none p-0 cursor-pointer font-semibold">Status</button>
        </div>
      </header>

      {/* 2. Main Centered Form Panel */}
      <main className="flex-1 flex items-center justify-center p-6 my-auto">
        <div className="w-full max-w-[460px] rounded-xl border shadow-md px-8 py-10" style={{ backgroundColor: "var(--card-bg, #FFFFFF)", borderColor: "var(--border-color, #E2E8F0)" }}>
          
          {twoFactorRequired ? (
            <>
              {/* Welcome Back Card Header */}
              <div className="text-center mb-8">
                <h1 className="font-display font-bold text-[1.75rem] text-slate-900 tracking-tight leading-none mb-2">
                  Two-Factor Verification
                </h1>
                <p className="text-slate-700 text-sm mb-4 leading-normal font-normal">
                  Enter the 6-digit OTP sent to your registered email address.
                </p>
                <span className="inline-flex items-center px-3 py-1 rounded-sm text-[0.6875rem] font-bold tracking-widest uppercase" style={{ backgroundColor: "rgba(var(--primary-btn-rgb, 79, 70, 229), 0.1)", color: "var(--primary-btn, #4F46E5)" }}>
                  {twoFactorEmail}
                </span>
              </div>

              {/* Success alert for Resend OTP */}
              {resendSuccess && (
                <div role="status" className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg px-4 py-3 text-xs text-center mb-6 font-semibold animate-fade-in">
                  {resendSuccess}
                </div>
              )}

              {/* Errors */}
              {displayError && (
                <div role="alert" className="bg-rose-50 border border-rose-100 text-rose-600 rounded-lg px-4 py-3 text-sm text-center mb-6">
                  {displayError}
                </div>
              )}

              {/* OTP Form */}
              <form onSubmit={handleOtpSubmit} className="space-y-5" aria-label="Two-factor verification">
                <div>
                  <label htmlFor="login-otp" className="block text-slate-600 text-sm font-semibold mb-1.5">
                    Verification Code
                  </label>
                  <input
                    id="login-otp"
                    type="text"
                    name="otp"
                    value={otpCode}
                    onChange={(e) => {
                      setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                      if (localError) setLocalError("");
                    }}
                    required
                    maxLength={6}
                    placeholder="000000"
                    autoComplete="one-time-code"
                    className="w-full h-[3rem] text-center text-2xl font-bold tracking-[8px] bg-white border border-slate-300 text-slate-900 rounded-md outline-none focus:border-primary focus:ring-3 focus:ring-primary/12 placeholder-slate-300 transition-all duration-150"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-[2.75rem] text-sm font-semibold text-white bg-primary rounded-md cursor-pointer hover:bg-primary-dark hover:shadow-primary active:scale-[0.98] transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" role="status" aria-label="Loading">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <span>Verify Code</span>
                  )}
                </button>
              </form>

              <div className="mt-6 flex flex-col items-center gap-2 text-sm text-slate-700 font-medium">
                <div>
                  Did not receive the email?{" "}
                  <button 
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendCooldown > 0 || resendLoading} 
                    className="text-primary font-semibold hover:underline cursor-pointer bg-transparent border-none p-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {resendLoading ? "Sending..." : resendCooldown > 0 ? `Resend Code (${resendCooldown}s)` : "Resend Code"}
                  </button>
                </div>
                <button 
                  type="button"
                  onClick={handleCancelOtp} 
                  className="text-xs text-slate-500 hover:text-slate-800 hover:underline cursor-pointer bg-transparent border-none p-0 mt-1 font-medium"
                >
                  &larr; Back to Login
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Welcome Back Card Header */}
              <div className="text-center mb-8">
                <h1 className="font-display font-bold text-[1.75rem] text-slate-900 tracking-tight leading-none mb-2">
                  Welcome Back
                </h1>
                <p className="text-slate-700 text-sm mb-4 leading-normal font-normal">
                  Sign in to access your projects, team, and deliverables.
                </p>
                {/* Active Portal Indicator Badge */}
                <span className="inline-flex items-center px-3 py-1 rounded-sm text-[0.6875rem] font-bold tracking-widest uppercase" style={{ backgroundColor: "rgba(var(--primary-btn-rgb, 79, 70, 229), 0.1)", color: "var(--primary-btn, #4F46E5)" }}>
                  {title}
                </span>
              </div>

              {/* Errors */}
              {displayError && (
                <div role="alert" className="bg-rose-50 border border-rose-100 text-rose-600 rounded-lg px-4 py-3 text-sm text-center mb-6">
                  {displayError}
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5" aria-label="Sign in">
                <div>
                  <label htmlFor="login-email" className="block text-slate-600 text-sm font-semibold mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400" aria-hidden="true">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.602a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                      </svg>
                    </span>
                    <input
                      id="login-email"
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      placeholder="Enter email"
                      autoComplete="email"
                      className="w-full h-[2.375rem] pl-10 pr-3 text-sm bg-white border border-slate-300 text-slate-900 rounded-md outline-none focus:border-primary focus:ring-3 focus:ring-primary/12 placeholder-slate-400 transition-all duration-150"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label htmlFor="login-password" className="block text-slate-600 text-sm font-semibold">
                      Password
                    </label>
                    <button 
                      type="button"
                      onClick={() => setIsForgotPasswordOpen(true)}
                      className="text-xs font-semibold text-primary hover:underline bg-transparent border-none p-0 cursor-pointer transition-all font-sans"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400" aria-hidden="true">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                      </svg>
                    </span>
                    <input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      placeholder="Enter password"
                      autoComplete="current-password"
                      className="w-full h-[2.375rem] pl-10 pr-10 text-sm bg-white border border-slate-300 text-slate-900 rounded-md outline-none focus:border-primary focus:ring-3 focus:ring-primary/12 placeholder-slate-400 transition-all duration-150"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Remember Me */}
                <div className="flex items-center py-0.5">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4.5 w-4.5 text-primary focus:ring-primary border-slate-300 rounded-sm cursor-pointer"
                  />
                  <label htmlFor="remember-me" className="ml-2.5 block text-sm text-slate-700 font-medium cursor-pointer">
                    Remember me
                  </label>
                </div>

                {/* Submit Button - lg size (h-[2.75rem], text-base) */}
                <button
                  type="submit"
                  disabled={loading || (countdown !== null && countdown > 0)}
                  className="w-full h-[2.75rem] text-sm font-semibold text-white bg-primary rounded-md cursor-pointer hover:bg-primary-dark hover:shadow-primary active:scale-[0.98] transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" role="status" aria-label="Loading">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Signing In...</span>
                    </>
                  ) : (
                    <span className="flex items-center gap-1.5 justify-center">
                      Sign In 
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                      </svg>
                    </span>
                  )}
                </button>
              </form>

              {/* Under Form Footer Links */}
              <div className="mt-8 text-center text-sm text-slate-700 font-medium">
                Don't have access?{" "}
                <button 
                  type="button" 
                  onClick={() => setIsContactAdminOpen(true)}
                  className="text-primary font-semibold hover:underline cursor-pointer bg-transparent border-none p-0"
                >
                  Contact your administrator
                </button>
              </div>
            </>
          )}

        </div>
      </main>

      <ForgotPasswordModal
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
        initialEmail={formData.email}
      />

      <ContactAdminModal
        isOpen={isContactAdminOpen}
        onClose={() => setIsContactAdminOpen(false)}
        initialEmail={formData.email}
      />

      {/* 3. Footer Section */}
      <footer className="w-full flex flex-col md:flex-row justify-between items-center px-8 py-5 border-t text-xs gap-3" style={{ backgroundColor: "var(--card-bg, #FFFFFF)", borderColor: "var(--border-color, #E2E8F0)", color: "var(--text-secondary, #475569)" }} role="contentinfo">
        <span>
          &copy; 2026 Project Management Portal Systems Inc. All rights reserved.
        </span>
        <div className="flex gap-4 font-medium animate-fade-in">
          <Link to="/privacy-policy" className="text-slate-600 hover:text-slate-900 transition-colors duration-150">Privacy Policy</Link>
          <Link to="/terms-of-service" className="text-slate-600 hover:text-slate-900 transition-colors duration-150">Terms of Service</Link>
          <Link to="/cookie-policy" className="text-slate-600 hover:text-slate-900 transition-colors duration-150">Security</Link>
          <button type="button" className="text-slate-600 hover:text-slate-900 transition-colors duration-150 bg-transparent border-none p-0 text-xs font-semibold cursor-pointer">Status</button>
          <Link to="/help-center" className="text-slate-600 hover:text-slate-900 transition-colors duration-150">Help Center</Link>
        </div>
      </footer>

    </div>
  );
}

export default LoginForm;
