// Gathers company names, billing details, and emails to register client profiles.
// Validates entries before sending credentials.


import { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';

function NewClientModal({ isOpen, onClose, onSave, clientToEdit }) {
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    password: '',
    status: 'Active'
  });

  const [showSuspensionModal, setShowSuspensionModal] = useState(false);
  const [suspensionReason, setSuspensionReason] = useState('');
  const [previousStatus, setPreviousStatus] = useState('Active');
  const [suspensionError, setSuspensionError] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSuspensionError('');
      setError('');
      setLoading(false);
      if (clientToEdit) {
        setFormData({
          name: clientToEdit.name || '',
          company: clientToEdit.company || '',
          email: clientToEdit.email || '',
          phone: clientToEdit.phone || '',
          password: '',
          status: clientToEdit.status || 'Active'
        });
        setSuspensionReason(clientToEdit.suspensionReason || '');
      } else {
        setFormData({
          name: '',
          company: '',
          email: '',
          phone: '',
          password: '',
          status: 'Active'
        });
        setSuspensionReason('');
      }
    }
  }, [isOpen, clientToEdit]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      const sanitized = value.replace(/[^0-9+\-\s()]/g, '');
      setFormData(prev => ({ ...prev, [name]: sanitized }));
      return;
    }
    if (name === 'status' && value === 'Suspended') {
      setPreviousStatus(formData.status);
      setShowSuspensionModal(true);
    }
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.company || !formData.email) return;
    
    const payload = {
      fullName: formData.name,
      name: formData.name,
      company: formData.company,
      email: formData.email,
      phone: formData.phone,
      status: formData.status,
    };
    if (formData.password) {
      payload.password = formData.password;
    }
    if (formData.status === 'Suspended') {
      payload.suspensionReason = suspensionReason || 'No reason provided';
    }
    
    setLoading(true);
    setError('');
    try {
      await onSave(payload);
      // Reset form
      setFormData({
        name: '',
        company: '',
        email: '',
        phone: '',
        password: '',
        status: 'Active'
      });
      setSuspensionReason('');
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to save client.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0f172a]/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md max-h-[90vh] overflow-y-auto animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900 font-display">
            {clientToEdit ? 'Edit Client Details' : 'Add New Client'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 font-sans">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs font-semibold text-red-600 flex items-start gap-2">
              <AlertCircle size={14} className="mt-0.5 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
                Client Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="e.g. Praveen"
                className="w-full h-9 px-3 text-xs border border-slate-300 rounded-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/12 transition-all placeholder:text-slate-400"
               aria-label="e.g. Praveen"/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
                Company Name
              </label>
              <input
                type="text"
                name="company"
                value={formData.company}
                onChange={handleChange}
                required
                placeholder="e.g. Wipro"
                className="w-full h-9 px-3 text-xs border border-slate-300 rounded-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/12 transition-all placeholder:text-slate-400"
               aria-label="e.g. Wipro"/>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="e.g. praveen@wipro.com"
              className="w-full h-9 px-3 text-xs border border-slate-300 rounded-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/12 transition-all placeholder:text-slate-400"
             aria-label="e.g. praveen@wipro.com"/>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
              Portal Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="enter password"
              className="w-full h-9 px-3 text-xs border border-slate-300 rounded-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/12 transition-all placeholder:text-slate-400"
             aria-label="enter password"/>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
              Phone Number
            </label>
            <input
              type="tel"
              name="phone"
              pattern="[0-9+\-\s()]{7,20}"
              value={formData.phone}
              onChange={handleChange}
              placeholder="e.g. +91 98765 43210"
              className="w-full h-9 px-3 text-xs border border-slate-300 rounded-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/12 transition-all placeholder:text-slate-400"
             aria-label="e.g. +91 98765 43210"/>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full h-9 px-3 text-xs border border-slate-300 rounded-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/12 transition-all bg-white cursor-pointer"
             aria-label="Select status">
              <option value="Active">Active</option>
              <option value="Pending Review">Pending Review</option>
              <option value="Inactive">Inactive</option>
              <option value="Suspended">Suspended</option>
            </select>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 h-9 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 h-9 rounded-lg bg-primary hover:bg-primary-dark text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Saving...</span>
                </>
              ) : (
                clientToEdit ? 'Save Changes' : 'Add Client'
              )}
            </button>
          </div>
        </form>
      </div>

      {showSuspensionModal && (
        <div className="fixed inset-0 bg-[#0f172a]/55 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-sm p-6 space-y-4 animate-scale-up">
            <div className="flex items-center gap-2.5 text-rose-600">
              <span className="p-2 bg-rose-50 rounded-full shrink-0">
                <svg className="w-5 h-5 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </span>
              <h4 className="text-sm font-bold font-display">Confirm Account Suspension</h4>
            </div>
            
            <p className="text-xs text-slate-500 leading-normal">
              Suspended users will be blocked from logging into the portal. Please provide a reason for this suspension.
            </p>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
                Suspension Reason
              </label>
              <textarea
                value={suspensionReason}
                onChange={(e) => {
                  setSuspensionReason(e.target.value);
                  if (e.target.value.trim()) setSuspensionError('');
                }}
                placeholder="e.g. Violation of platform policies, outstanding payments, etc."
                className={suspensionError ? "w-full min-h-[80px] p-2.5 text-xs border border-rose-500 focus:ring-rose-500/12 rounded-lg outline-none focus:border-rose-500 focus:ring-2 transition-all placeholder:text-slate-400 resize-none font-sans" : "w-full min-h-[80px] p-2.5 text-xs border border-slate-300 focus:ring-rose-500/12 rounded-lg outline-none focus:border-rose-500 focus:ring-2 transition-all placeholder:text-slate-400 resize-none font-sans"}
                required
               aria-label="e.g. Violation of platform policies, outstanding payments, etc."/>
              {suspensionError && (
                <p className="text-[10px] text-rose-600 font-semibold mt-1.5 animate-fade-in">
                  {suspensionError}
                </p>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setFormData(prev => ({ ...prev, status: previousStatus }));
                  setShowSuspensionModal(false);
                }}
                className="px-4 h-9 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!suspensionReason.trim()) {
                    setSuspensionError("Please provide a suspension reason.");
                    return;
                  }
                  setSuspensionError('');
                  setShowSuspensionModal(false);
                }}
                className="px-4 h-9 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Confirm Suspension
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default NewClientModal;
