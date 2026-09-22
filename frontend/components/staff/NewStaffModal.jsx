import { useToast } from '../../context/ToastContext';
// Compiles email entries, names, and security settings to register staff members.
// Handles staff registrations.


import { useState, useEffect } from 'react';
import { X, Camera, AlertCircle } from 'lucide-react';

function NewStaffModal({ isOpen, onClose, onSave, staffToEdit }) {
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    status: 'Active',
    password: '',
    avatar: ''
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
      if (staffToEdit) {
        setFormData({
          name: staffToEdit.name || staffToEdit.fullName || '',
          email: staffToEdit.email || '',
          phone: staffToEdit.phone || '',
          status: staffToEdit.status || 'Active',
          password: '',
          avatar: staffToEdit.avatar || ''
        });
        setSuspensionReason(staffToEdit.suspensionReason || '');
      } else {
        setFormData({
          name: '',
          email: '',
          phone: '',
          status: 'Active',
          password: '',
          avatar: ''
        });
        setSuspensionReason('');
      }
    }
  }, [isOpen, staffToEdit]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'status' && value === 'Suspended') {
      setPreviousStatus(formData.status);
      setShowSuspensionModal(true);
    }
    if (error) setError('');
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("Please select an image file.", "error");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      showToast("Image file size should be less than 2MB.", "error");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({
        ...prev,
        avatar: reader.result
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email) return;
    
    const payload = {
      fullName: formData.name,
      email: formData.email,
      phone: formData.phone,
      status: formData.status,
      role: "STAFF",
      avatar: formData.avatar || null
    };

    if (formData.password) {
      payload.password = formData.password;
    } else if (!staffToEdit) {
      payload.password = "Staff@123456"; // default password only for new creations
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
        email: '',
        phone: '',
        status: 'Active',
        password: '',
        avatar: ''
      });
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to save staff member.");
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
            {staffToEdit ? 'Edit Staff Details' : 'Add New Staff Member'}
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
          {/* Profile Picture Upload Section */}
          <div className="flex flex-col items-center pb-4 border-b border-slate-100">
            <div className="relative group cursor-pointer" onClick={() => document.getElementById("staff-modal-avatar-input").click()}>
              {formData.avatar ? (
                <img 
                  src={formData.avatar} 
                  alt="Staff avatar" 
                  className="w-16 h-16 rounded-full object-cover border border-slate-200 shadow-sm"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-indigo-600 text-white font-display font-bold text-lg flex items-center justify-center shadow-sm">
                  {formData.name ? formData.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "ST"}
                </div>
              )}
              
              {/* Camera hover icon trigger */}
              <div className="absolute inset-0 bg-slate-900/50 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer">
                <Camera className="w-4 h-4" />
              </div>
              <input 
                type="file" 
                id="staff-modal-avatar-input" 
                accept="image/*" 
                onChange={handleAvatarChange} 
                className="hidden" 
              />
            </div>
            
            <div className="text-center mt-2">
              <button
                type="button"
                onClick={() => document.getElementById("staff-modal-avatar-input").click()}
                className="text-[11px] text-indigo-650 hover:text-indigo-800 font-bold uppercase tracking-wider cursor-pointer"
              >
                Upload Profile Photo
              </button>
              <p className="text-[10px] text-slate-400 mt-1">Max size: 2 MB</p>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
              Staff Full Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="e.g. Sarah Jenkins"
              className="w-full h-9 px-3 text-xs border border-slate-300 rounded-lg outline-none focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/12 transition-all placeholder:text-slate-400"
             aria-label="e.g. Sarah Jenkins"/>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="e.g. sarah@gmail.com"
              className="w-full h-9 px-3 text-xs border border-slate-300 rounded-lg outline-none focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/12 transition-all placeholder:text-slate-400"
             aria-label="e.g. sarah@gmail.com"/>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                Phone Number
              </label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="e.g. +91 99887 76655"
                className="w-full h-9 px-3 text-xs border border-slate-300 rounded-lg outline-none focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/12 transition-all placeholder:text-slate-400"
               aria-label="e.g. +91 99887 76655"/>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full h-9 px-3 text-xs border border-slate-300 rounded-lg outline-none focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/12 transition-all bg-white cursor-pointer"
               aria-label="Select status">
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Suspended">Suspended</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
              {staffToEdit ? 'New Password (leave blank to keep current)' : 'Password (defaults to "staff123")'}
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder={staffToEdit ? "Enter new password if changing" : "Leave blank to default to staff123"}
              className="w-full h-9 px-3 text-xs border border-slate-300 rounded-lg outline-none focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/12 transition-all placeholder:text-slate-400"
             aria-label="Password"/>
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
              className="px-4 h-9 rounded-lg bg-[#4F46E5] hover:bg-[#3730A3] text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
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
                staffToEdit ? 'Save Changes' : 'Add Staff'
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

export default NewStaffModal;
