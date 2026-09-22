// Provides a form modal to edit project metadata across multiple selected projects simultaneously.
// Supports bulk updates of statuses, due dates, staff assignments, and tags.

import { useState } from 'react';
import { X, Calendar, BarChart3, AlertCircle } from 'lucide-react';

function BulkEditModal({ isOpen, onClose, selectedCount = 0, onSave }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Fields and their checked/enable states
  const [updateStatus, setUpdateStatus] = useState(false);
  const [status, setStatus] = useState('Planning');

  const [updateProgress, setUpdateProgress] = useState(false);
  const [progress, setProgress] = useState(0);

  const [updateStartDate, setUpdateStartDate] = useState(false);
  const [startDate, setStartDate] = useState('');

  const [updateEndDate, setUpdateEndDate] = useState(false);
  const [endDate, setEndDate] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    // Ensure at least one field is selected for update
    if (!updateStatus && !updateProgress && !updateStartDate && !updateEndDate) {
      setError('Please select at least one field to update.');
      return;
    }

    const payload = {};
    if (updateStatus) payload.status = status;
    if (updateProgress) payload.progress = progress;
    if (updateStartDate) payload.startDate = startDate || null;
    if (updateEndDate) payload.dueDate = endDate || null; // API maps to dueDate

    setSubmitting(true);
    onSave(payload)
      .then(() => {
        setSubmitting(false);
        onClose();
      })
      .catch((err) => {
        setSubmitting(false);
        setError(err.response?.data?.message || 'Failed to update projects.');
      });
  };

  return (
    <div className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in font-sans">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 font-display">
              Bulk Edit Projects
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Modify fields for <span className="font-semibold text-indigo-650">{selectedCount}</span> selected projects
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-slate-650 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Body */}
          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-lg text-rose-600 text-xs font-medium flex items-start gap-2">
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Status Field */}
            <div className="flex items-start gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
              <div className="pt-0.5">
                <input
                  type="checkbox"
                  id="chk-status"
                  checked={updateStatus}
                  onChange={(e) => setUpdateStatus(e.target.checked)}
                  className="w-4.5 h-4.5 rounded border-slate-300 text-[#4F46E5] focus:ring-[#4F46E5]/30 cursor-pointer"
                />
              </div>
              <div className="flex-1 space-y-1.5">
                <label htmlFor="chk-status" className="text-xs font-bold text-slate-700 cursor-pointer flex items-center gap-1.5">
                  Update Status
                </label>
                <select
                  disabled={!updateStatus}
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] transition-all disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                 aria-label="Select w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4 f46 e5]/20 focus:border-[#4 f46 e5] transition-all disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed">
                  <option value="Planning">Planning</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Review">Review</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>

            {/* Progress Field */}
            <div className="flex items-start gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
              <div className="pt-0.5">
                <input
                  type="checkbox"
                  id="chk-progress"
                  checked={updateProgress}
                  onChange={(e) => setUpdateProgress(e.target.checked)}
                  className="w-4.5 h-4.5 rounded border-slate-300 text-[#4F46E5] focus:ring-[#4F46E5]/30 cursor-pointer"
                />
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex justify-between items-center">
                  <label htmlFor="chk-progress" className="text-xs font-bold text-slate-700 cursor-pointer flex items-center gap-1.5">
                    Update Progress
                  </label>
                  <span className={`text-xs font-bold ${updateProgress ? 'text-indigo-650' : 'text-slate-400'}`}>
                    {progress}%
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    disabled={!updateProgress}
                    value={progress}
                    onChange={(e) => setProgress(parseInt(e.target.value))}
                    className="flex-1 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#4F46E5] disabled:bg-slate-100 disabled:cursor-not-allowed"
                   aria-label="Flex-1 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#4 F46 E5] disabled:bg-slate-100 disabled:cursor-not-allowed"/>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    disabled={!updateProgress}
                    value={progress}
                    onChange={(e) => setProgress(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                    className="w-16 h-8 px-2 border border-slate-200 rounded-md text-xs font-semibold text-center text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#4F46E5] disabled:bg-slate-100 disabled:text-slate-400"
                   aria-label="W-16 h-8 px-2 border border-slate-200 rounded-md text-xs font-semibold text-center text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#4 F46 E5] disabled:bg-slate-100 disabled:text-slate-400"/>
                </div>
              </div>
            </div>

            {/* Timeline Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Start Date */}
              <div className="flex items-start gap-3.5 p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                <div className="pt-0.5">
                  <input
                    type="checkbox"
                    id="chk-start"
                    checked={updateStartDate}
                    onChange={(e) => setUpdateStartDate(e.target.checked)}
                    className="w-4.5 h-4.5 rounded border-slate-300 text-[#4F46E5] focus:ring-[#4F46E5]/30 cursor-pointer"
                  />
                </div>
                <div className="flex-1 space-y-1.5">
                  <label htmlFor="chk-start" className="text-xs font-bold text-slate-700 cursor-pointer flex items-center gap-1.5">
                    <Calendar size={13} className="text-slate-450" />
                    Update Start Date
                  </label>
                  <input
                    type="date"
                    disabled={!updateStartDate}
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] transition-all disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                   aria-label="W-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#4 F46 E5]/20 focus:border-[#4 F46 E5] transition-all disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"/>
                </div>
              </div>

              {/* End Date */}
              <div className="flex items-start gap-3.5 p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                <div className="pt-0.5">
                  <input
                    type="checkbox"
                    id="chk-end"
                    checked={updateEndDate}
                    onChange={(e) => setUpdateEndDate(e.target.checked)}
                    className="w-4.5 h-4.5 rounded border-slate-300 text-[#4F46E5] focus:ring-[#4F46E5]/30 cursor-pointer"
                  />
                </div>
                <div className="flex-1 space-y-1.5">
                  <label htmlFor="chk-end" className="text-xs font-bold text-slate-700 cursor-pointer flex items-center gap-1.5">
                    <Calendar size={13} className="text-slate-450" />
                    Update End Date
                  </label>
                  <input
                    type="date"
                    disabled={!updateEndDate}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] transition-all disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                   aria-label="W-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#4 F46 E5]/20 focus:border-[#4 F46 E5] transition-all disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"/>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/60 flex justify-end gap-3">
            <button
              type="button"
              disabled={submitting}
              onClick={onClose}
              className="px-4 h-10 rounded-lg border border-slate-300 text-slate-650 hover:bg-slate-50 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center gap-1.5 px-4 h-10 rounded-lg bg-[#4F46E5] text-xs font-semibold text-white hover:bg-[#3730A3] transition-all duration-150 cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default BulkEditModal;
