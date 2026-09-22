// Form modal to assign tasks to a project and choose due dates.
// Initializes task variables.


import { useState } from 'react';
import { X } from 'lucide-react';
import { createTask } from '../../services/taskService';

function NewProjectTaskModal({ isOpen, onClose, projectId, projectName = '', team = [], onSave }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assigneeId: '',
    priority: 'Medium',
    status: 'To Do',
    dueDate: ''
  });
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title || loading) return;

    setLoading(true);
    createTask({
      title: formData.title,
      description: formData.description,
      projectId: parseInt(projectId),
      assigneeId: formData.assigneeId ? parseInt(formData.assigneeId) : null,
      priority: formData.priority,
      status: formData.status,
      dueDate: formData.dueDate || null
    })
      .then((res) => {
        onSave(res.data.data);
        // Reset form
        setFormData({
          title: '',
          description: '',
          assigneeId: '',
          priority: 'Medium',
          status: 'To Do',
          dueDate: ''
        });
        onClose();
      })
      .catch((err) => {
        console.error("Error creating task:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <div className="fixed inset-0 bg-[#0f172a]/45 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md max-h-[90vh] overflow-y-auto animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900 font-display">
            Create New Task
          </h3>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
              Project Name
            </label>
            <input
              type="text"
              value={projectName || ''}
              disabled
              readOnly
              className="w-full h-10 px-3.5 text-xs border border-slate-200 rounded-xl bg-slate-50 text-slate-400 outline-none cursor-not-allowed font-medium"
             aria-label="W-full h-10 px-3.5 text-xs border border-slate-200 rounded-xl bg-slate-50 text-slate-400 outline-none cursor-not-allowed font-medium"/>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
              Task Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="e.g. Design Login Form UI"
              className="w-full h-10 px-3.5 text-xs border border-slate-300 rounded-xl outline-none focus:border-primary focus:ring-3 focus:ring-primary/12 transition-all placeholder:text-slate-400"
             aria-label="e.g. Design Login Form UI"/>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              placeholder="Provide detailed instructions..."
              className="w-full p-3.5 text-xs border border-slate-300 rounded-xl outline-none focus:border-primary focus:ring-3 focus:ring-primary/12 transition-all placeholder:text-slate-400 resize-none"
             aria-label="Provide detailed instructions..."/>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                Assignee
              </label>
              <select
                name="assigneeId"
                value={formData.assigneeId}
                onChange={handleChange}
                className="w-full h-10 px-3.5 text-xs border border-slate-300 rounded-xl outline-none focus:border-primary focus:ring-3 focus:ring-primary/12 transition-all bg-white cursor-pointer"
               aria-label="Select assignee">
                <option value="">Unassigned</option>
                {team.filter(member => member.role !== 'CLIENT' && member.status !== 'Suspended').map(member => (
                  <option key={member.id} value={member.id}>{member.fullName || member.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                Due Date
              </label>
              <input
                type="date"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
                min={new Date().toISOString().split('T')[0]}
                className="w-full h-10 px-3.5 text-xs border border-slate-300 rounded-xl outline-none focus:border-primary focus:ring-3 focus:ring-primary/12 transition-all cursor-pointer"
               aria-label="Due Date"/>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                Priority
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full h-10 px-3.5 text-xs border border-slate-300 rounded-xl outline-none focus:border-primary focus:ring-3 focus:ring-primary/12 transition-all bg-white cursor-pointer"
               aria-label="Select priority">
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                Initial Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full h-10 px-3.5 text-xs border border-slate-300 rounded-xl outline-none focus:border-primary focus:ring-3 focus:ring-primary/12 transition-all bg-white cursor-pointer"
               aria-label="Select status">
                <option value="To Do">To Do</option>
                <option value="In Progress">In Progress</option>
                <option value="In Review">In Review</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4.5 h-10 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50 text-xs font-bold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4.5 h-10 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default NewProjectTaskModal;
