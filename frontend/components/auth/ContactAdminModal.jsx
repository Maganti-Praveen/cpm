// Displays an inquiries dialog for locked users to message administrators directly.
// Validates form fields and handles login-support requests.


import { useState, useEffect } from "react";
import { User, Mail, MessageSquare, ShieldCheck, ShieldAlert, X } from "lucide-react";
import { createContactSubmission } from "../../services/contactService";

function ContactAdminModal({ isOpen, onClose, initialEmail }) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    subject: "Portal Access / Login Support",
    message: "Hello, I am unable to log in to my account. Please assist me with accessing the portal."
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Synchronizes the email input field and clears error states when the modal is opened
  useEffect(() => {
    if (isOpen) {
      setFormData({
        firstName: "",
        lastName: "",
        email: initialEmail || "",
        subject: "Portal Access / Login Support",
        message: "Hello, I am unable to log in to my account. Please assist me with accessing the portal."
      });
      setError("");
      setSuccess(false);
    }
  }, [isOpen, initialEmail]);

  if (!isOpen) return null;

  // Validates contact fields and dispatches the login support query to the administrator API
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await createContactSubmission(formData);
      if (response.data?.success) {
        setSuccess(true);
      } else {
        setError(response.data?.message || "Failed to submit request. Please try again.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit request. Please try again.");
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
            <h3 className="text-xl font-bold text-slate-900 font-display">Contact Administrator</h3>
            <p className="text-sm text-slate-500 mt-2">Submit a request to the system administrators for login assistance or access requests.</p>
          </div>

          {/* Errors */}
          {error && (
            <div className="flex gap-2.5 items-start p-3.5 mb-5 text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-lg">
              <ShieldAlert size={18} className="shrink-0 mt-0.5 text-rose-500 animate-pulse" />
              <p className="font-medium text-left">{error}</p>
            </div>
          )}

          {success ? (
            <div className="space-y-6 text-center py-4">
              <p className="text-sm text-slate-600 font-medium">Your request has been successfully sent. The administrator will contact you soon.</p>
              <button 
                onClick={onClose} 
                type="button"
                className="w-full h-11 bg-primary hover:bg-primary-dark text-white font-semibold rounded-lg shadow-sm transition-all text-sm cursor-pointer"
              >
                Back to Login
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="contact-firstname" className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">First Name</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                      <User size={16} />
                    </span>
                    <input
                      id="contact-firstname"
                      type="text"
                      required
                      placeholder="First name"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="w-full h-10 pl-9 pr-3.5 text-sm border border-slate-300 rounded-lg outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/12 transition-all placeholder:text-slate-400"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="contact-lastname" className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Last Name</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                      <User size={16} />
                    </span>
                    <input
                      id="contact-lastname"
                      type="text"
                      required
                      placeholder="Last name"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="w-full h-10 pl-9 pr-3.5 text-sm border border-slate-300 rounded-lg outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/12 transition-all placeholder:text-slate-400"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="contact-email" className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Email Address</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Mail size={16} />
                  </span>
                  <input
                    id="contact-email"
                    type="email"
                    required
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full h-10 pl-9 pr-3.5 text-sm border border-slate-300 rounded-lg outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/12 transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="contact-message" className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Message</label>
                <div className="relative">
                  <span className="absolute top-3 left-3 text-slate-400">
                    <MessageSquare size={16} />
                  </span>
                  <textarea
                    id="contact-message"
                    required
                    rows={4}
                    placeholder="Describe your request..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full pl-9 pr-3.5 py-2.5 text-sm border border-slate-300 rounded-lg outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/12 transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-primary hover:bg-primary-dark text-white font-semibold rounded-lg shadow-sm transition-all disabled:opacity-60 text-sm cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Sending Request...</span>
                  </>
                ) : (
                  <span>Send Request</span>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default ContactAdminModal;
