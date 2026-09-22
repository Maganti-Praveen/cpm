// Intercepts initial logins to prompt new users to change default passwords.
// Validates credential strength rules to complete onboarding.


import { useState } from "react";
import { Lock, ShieldAlert, ArrowRight } from "lucide-react";

function FirstLoginModal({ isOpen, onSubmit, loading, error }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [validationError, setValidationError] = useState("");

  if (!isOpen) return null;

  // Enforces password security complexity checks before executing the update callback
  const handleSubmit = (e) => {
    e.preventDefault();
    setValidationError("");

    if (!password) {
      setValidationError("Please enter a new password.");
      return;
    }
    if (password.length < 6) {
      setValidationError("Password must be at least 6 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setValidationError("Passwords do not match.");
      return;
    }

    onSubmit(password);
  };

  return (
    <div className="fixed inset-0 bg-[#0f172a]/60 backdrop-blur-md flex items-center justify-center z-[999] p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md max-h-[90vh] overflow-y-auto animate-scale-up">
        {/* Banner header decoration */}

        <div className="p-8">

          {/* Heading */}
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-slate-900 font-display">
              Set Secure Password
            </h3>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed font-normal">
              This is your first time logging in. For your security, please update your account password to continue.
            </p>
          </div>

          {/* Error displays */}
          {(error || validationError) && (
            <div className="flex gap-2.5 items-start p-3.5 mb-5 text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-lg">
              <ShieldAlert size={18} className="shrink-0 mt-0.5 text-rose-500" />
              <p className="font-medium">{validationError || error}</p>
            </div>
          )}

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                New Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Minimum 6 characters"
                className="w-full h-10 px-3.5 text-sm border border-slate-300 rounded-lg outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/12 transition-all placeholder:text-slate-400"
               aria-label="Minimum 6 characters"/>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Re-enter password"
                className="w-full h-10 px-3.5 text-sm border border-slate-300 rounded-lg outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/12 transition-all placeholder:text-slate-400"
               aria-label="Re-enter password"/>
            </div>

            {/* Submit button */}
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
                  <span>Updating Password...</span>
                </>
              ) : (
                <>
                  <span>Save and Continue</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default FirstLoginModal;
