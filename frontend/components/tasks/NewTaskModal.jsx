// Gathers details to create tasks, assign work, and choose deadlines.
// Validates task profiles.


import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const priorityOptions = ['Critical', 'High', 'Medium', 'Low'];
const statusOptions = ['To Do', 'In Progress', 'Done'];

function NewTaskModal({ isOpen, onClose, onSave, projects = [], assignees = [] }) {
  const [formData, setFormData] = useState({
    title: '',
    projectId: '',
    assigneeId: '',
    priority: 'Medium',
    status: 'To Do',
    dueDate: '',
    description: ''
  });

  // Resets task configuration forms when modal is active
  useEffect(() => {
    if (isOpen) {
      setFormData({
        title: '',
        projectId: projects[0]?.id || '',
        assigneeId: assignees[0]?.id || '',
        priority: 'Medium',
        status: 'To Do',
        dueDate: '',
        description: ''
      });
    }
  }, [isOpen, projects, assignees]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Validates required form parameters before calling save handlers
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.projectId || !formData.dueDate) return;

    onSave({
      title: formData.title,
      projectId: parseInt(formData.projectId),
      assigneeId: formData.assigneeId ? parseInt(formData.assigneeId) : null,
      priority: formData.priority,
      status: formData.status === 'Done' ? 'Completed' : formData.status,
      dueDate: formData.dueDate,
      description: formData.description
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-[#0f172a]/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md max-h-[90vh] overflow-y-auto animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900 font-display">
            Create New Task
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
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
              Task Title
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="e.g. API Endpoint Load Testing"
              className="w-full h-9 px-3 text-xs border border-slate-300 rounded-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/12 transition-all placeholder:text-slate-400"
             aria-label="e.g. API Endpoint Load Testing"/>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
                Project Name
              </label>
              <select
                name="projectId"
                value={formData.projectId}
                onChange={handleChange}
                required
                className="w-full h-9 px-3 text-xs border border-slate-300 rounded-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/12 transition-all bg-white cursor-pointer"
               aria-label="Select project">
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
                {projects.length === 0 && (
                  <option value="">No active projects</option>
                )}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
                Assignee
              </label>
              <select
                name="assigneeId"
                value={formData.assigneeId}
                onChange={handleChange}
                className="w-full h-9 px-3 text-xs border border-slate-300 rounded-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/12 transition-all bg-white cursor-pointer"
               aria-label="Select assignee">
                <option value="">Unassigned</option>
                {assignees.filter(a => a.status === 'Active' || a.status === 'ACTIVE' || !a.status).map(a => (
                  <option key={a.id} value={a.id}>{a.fullName} ({a.role})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
                Priority
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full h-9 px-3 text-xs border border-slate-300 rounded-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/12 transition-all bg-white cursor-pointer"
               aria-label="Select priority">
                {priorityOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
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
                {statusOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
                Due Date
              </label>
              <input
                type="date"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
                min={new Date().toISOString().split('T')[0]}
                required
                className="w-full h-9 px-3 text-xs border border-slate-300 rounded-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/12 transition-all bg-white cursor-pointer"
               aria-label="Due Date"/>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              placeholder="Detailed task instructions..."
              className="w-full p-3 text-xs border border-slate-300 rounded-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/12 transition-all placeholder:text-slate-400 resize-none"
             aria-label="Detailed task instructions..."/>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 h-9 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 h-9 rounded-lg bg-primary hover:bg-primary-dark text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              Create Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default NewTaskModal;
