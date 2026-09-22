// Form modal to schedule milestones and link them to projects.
// Validates target due dates.


import { useState } from 'react';
import { X } from 'lucide-react';
import { createMilestone } from '../../services/milestoneService';

function NewMilestoneModal({ isOpen, onClose, projectId, onSave }) {
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    status: 'Planning',
    progress: 0
  });

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'progress' ? parseInt(value) || 0 : value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title) return;

    createMilestone({
      ...formData,
      projectId: parseInt(projectId)
    })
      .then((res) => {
        onSave(res.data.data);
        // Reset form
        setFormData({
          title: '',
          date: '',
          status: 'Planning',
          progress: 0
        });
        onClose();
      })
      .catch((err) => {
        console.error("Error creating milestone:", err);
      });
  };

  return (
    <div className="fixed inset-0 bg-[#0f172a]/45 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md max-h-[90vh] overflow-y-auto animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900 font-display">
            Create New Milestone
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
              Milestone Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="e.g. Phase 1: Brand Discovery"
              className="w-full h-10 px-3.5 text-xs border border-slate-300 rounded-xl outline-none focus:border-primary focus:ring-3 focus:ring-primary/12 transition-all placeholder:text-slate-400"
             aria-label="e.g. Phase 1: Brand Discovery"/>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
              Target Date
            </label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="w-full h-10 px-3.5 text-xs border border-slate-300 rounded-xl outline-none focus:border-primary focus:ring-3 focus:ring-primary/12 transition-all cursor-pointer"
             aria-label="Date"/>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                Progress (%)
              </label>
              <input
                type="number"
                name="progress"
                min="0"
                max="100"
                value={formData.progress}
                onChange={handleChange}
                className="w-full h-10 px-3.5 text-xs border border-slate-300 rounded-xl outline-none focus:border-primary focus:ring-3 focus:ring-primary/12 transition-all"
               aria-label="Progress"/>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full h-10 px-3.5 text-xs border border-slate-300 rounded-xl outline-none focus:border-primary focus:ring-3 focus:ring-primary/12 transition-all bg-white cursor-pointer"
               aria-label="Select status">
                <option value="Planning">Planning</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4.5 h-10 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50 text-xs font-bold transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4.5 h-10 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-bold transition-all cursor-pointer"
            >
              Create Milestone
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default NewMilestoneModal;
