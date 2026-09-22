// Captures budgets, summaries, client links, and name details for new projects.
// Handles initial registration forms.


import { useState, useEffect } from 'react';
import { X, Plus, Trash2, AlertCircle } from 'lucide-react';
import { getClients } from '../../services/clientService';
import { getUsers } from '../../services/authService';

function NewProjectModal({ isOpen, onClose, onSave, projectToEdit }) {
  const [clients, setClients] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    clientId: '',
    startDate: '',
    dueDate: '',
    deliverables: [],
    teamIds: [],
    status: 'Planning',
    progress: 0,
    color: '#6366F1',
    createGroupChat: false
  });
  
  const [newDeliverable, setNewDeliverable] = useState('');
  const [error, setError] = useState('');

  // Load clients, staff users, and pre-fill form data if editing
  useEffect(() => {
    if (isOpen) {
      setError('');
      // Fetch clients
      getClients()
        .then(res => setClients(res.data.data))
        .catch(err => console.error("Error loading clients:", err));
      
      // Fetch staff members
      getUsers({ role: 'STAFF' })
        .then(res => {
          setTeamMembers(res.data.data || []);
        })
        .catch(err => console.error("Error loading team members:", err));

      if (projectToEdit) {
        setFormData({
          name: projectToEdit.name || '',
          description: projectToEdit.description || '',
          clientId: projectToEdit.rawClientId ? String(projectToEdit.rawClientId) : '',
          startDate: projectToEdit.rawStartDate || '',
          dueDate: projectToEdit.rawDueDate || '',
          deliverables: projectToEdit.deliverables || [],
          teamIds: projectToEdit.rawTeamIds || [],
          status: projectToEdit.rawStatus || 'Planning',
          progress: projectToEdit.rawProgress !== undefined ? projectToEdit.rawProgress : 0,
          color: projectToEdit.color || '#6366F1'
        });
      } else {
        setFormData({
          name: '',
          description: '',
          clientId: '',
          startDate: '',
          dueDate: '',
          deliverables: [],
          teamIds: [],
          status: 'Planning',
          progress: 0,
          color: '#6366F1',
          createGroupChat: false
        });
      }
    }
  }, [isOpen, projectToEdit]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (error) setError('');
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleAddDeliverable = () => {
    if (!newDeliverable.trim()) return;
    setFormData({
      ...formData,
      deliverables: [...formData.deliverables, newDeliverable.trim()]
    });
    setNewDeliverable('');
  };

  const handleRemoveDeliverable = (index) => {
    setFormData({
      ...formData,
      deliverables: formData.deliverables.filter((_, i) => i !== index)
    });
  };

  const handleTeamMemberToggle = (id) => {
    const isSelected = formData.teamIds.includes(id);
    setFormData({
      ...formData,
      teamIds: isSelected 
        ? formData.teamIds.filter(tid => tid !== id)
        : [...formData.teamIds, id]
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.clientId) return;

    if (formData.startDate && formData.dueDate) {
      const start = new Date(formData.startDate);
      const due = new Date(formData.dueDate);
      if (due < start) {
        setError("End date must be after start date.");
        return;
      }
    }
    
    onSave({
      ...formData,
      clientId: parseInt(formData.clientId),
      progress: projectToEdit ? formData.progress : 0,
      status: projectToEdit ? formData.status : 'Planning',
      color: formData.color,
      createGroupChat: !projectToEdit ? formData.createGroupChat : false
    });
    
    // Reset form
    setFormData({
      name: '',
      description: '',
      clientId: '',
      startDate: '',
      dueDate: '',
      deliverables: [],
      teamIds: [],
      status: 'Planning',
      progress: 0,
      color: '#6366F1',
      createGroupChat: false
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-[#0f172a]/45 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl max-h-[90vh] flex flex-col max-h-[90vh] overflow-y-auto animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <h3 className="text-lg font-bold text-slate-900 font-display">
            {projectToEdit ? 'Edit Project' : 'Create New Project'}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-600 flex items-start gap-2 animate-fade-in">
              <AlertCircle size={14} className="mt-0.5 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}
          {/* Project Name */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
              Project Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="e.g. Wipro ERP Implementation"
              className="w-full h-10 px-3.5 text-sm border border-slate-300 rounded-xl outline-none focus:border-primary focus:ring-3 focus:ring-primary/12 transition-all placeholder:text-slate-400"
             aria-label="e.g. Wipro ERP Implementation"/>
          </div>

          {/* Description */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              placeholder="Provide a detailed description of the project scopes and integration deliverables..."
              className="w-full p-3.5 text-sm border border-slate-300 rounded-xl outline-none focus:border-primary focus:ring-3 focus:ring-primary/12 transition-all placeholder:text-slate-400 resize-none"
             aria-label="Provide a detailed description of the project scopes and integration deliverables..."/>
          </div>

          {/* Client Selection */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
              Assigned Client *
            </label>
            <select
              name="clientId"
              value={formData.clientId}
              onChange={handleChange}
              required
              className="w-full h-10 px-3.5 text-sm border border-slate-300 rounded-xl outline-none focus:border-primary focus:ring-3 focus:ring-primary/12 transition-all bg-white cursor-pointer"
             aria-label="Select client">
              <option value="">Select client...</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.company})
                </option>
              ))}
            </select>
          </div>

          {/* Start & Due Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                Start Date
              </label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className="w-full h-10 px-3.5 text-sm border border-slate-300 rounded-xl outline-none focus:border-primary focus:ring-3 focus:ring-primary/12 transition-all cursor-pointer"
               aria-label="Start Date"/>
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
                className="w-full h-10 px-3.5 text-sm border border-slate-300 rounded-xl outline-none focus:border-primary focus:ring-3 focus:ring-primary/12 transition-all cursor-pointer"
               aria-label="Due Date"/>
            </div>
          </div>

          {/* Project Accent Color Selection */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-wider">
              Project Accent Color
            </label>
            <div className="flex flex-wrap items-center gap-3 border border-slate-200 rounded-xl p-3 bg-slate-50/30">
              {[
                { hex: '#6366F1', name: 'Indigo' },
                { hex: '#3B82F6', name: 'Blue' },
                { hex: '#10B981', name: 'Emerald' },
                { hex: '#F59E0B', name: 'Amber' },
                { hex: '#F43F5E', name: 'Rose' },
                { hex: '#8B5CF6', name: 'Violet' },
                { hex: '#0EA5E9', name: 'Sky' }
              ].map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => setFormData({ ...formData, color: c.hex })}
                  className={`w-7 h-7 rounded-full transition-all relative border flex items-center justify-center shrink-0 cursor-pointer ${
                    formData.color.toLowerCase() === c.hex.toLowerCase()
                      ? 'scale-110 ring-2 ring-offset-2 ring-primary border-transparent'
                      : 'hover:scale-105 border-slate-300/40'
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={c.name}
                 aria-label={c.name}>
                  {formData.color.toLowerCase() === c.hex.toLowerCase() && (
                    <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))}
              
              {/* Custom Color Input Wrapper */}
              <div className="flex items-center gap-2 border-l border-slate-200 pl-3.5 ml-1 shrink-0">
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-8 h-8 rounded-lg border border-slate-300 outline-none cursor-pointer p-0.5 bg-white shrink-0"
                  title="Choose custom color"
                 aria-label="W-8 h-8 rounded-lg border border-slate-300 outline-none cursor-pointer p-0.5 bg-white shrink-0"/>
                <input
                  type="text"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-20 h-8 px-2 text-xs border border-slate-300 rounded-lg outline-none font-mono text-slate-700 bg-white"
                  placeholder="#6366F1"
                 aria-label="#6366F1"/>
              </div>
            </div>
          </div>

          {/* Assign Team Members */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
              Assign Staff / Team Members
            </label>
            <div className="border border-slate-200 rounded-xl p-3.5 max-h-36 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2">
              {teamMembers.filter(member => member.status !== 'Suspended').map(member => {
                const isChecked = formData.teamIds.includes(member.id);
                return (
                  <label 
                    key={member.id} 
                    className={`flex items-center gap-2.5 p-2 rounded-lg border text-xs font-semibold cursor-pointer transition-all ${
                      isChecked 
                        ? 'bg-indigo-50/50 border-indigo-200 text-indigo-900' 
                        : 'border-slate-100 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleTeamMemberToggle(member.id)}
                      className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                     aria-label="H-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"/>
                    <span>{member.fullName}</span>
                  </label>
                );
              })}
              {teamMembers.length === 0 && (
                <div className="col-span-2 text-center text-xs text-slate-400 py-4 font-medium">
                  No staff members available.
                </div>
              )}
            </div>
          </div>

          {/* Automatic Group Chat creation toggle */}
          {!projectToEdit && (
            <div className="flex items-center gap-2.5 p-3.5 bg-slate-50/50 border border-slate-200 rounded-xl">
              <input
                type="checkbox"
                id="createGroupChat"
                name="createGroupChat"
                checked={formData.createGroupChat || false}
                onChange={(e) => setFormData({ ...formData, createGroupChat: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer animate-none"
              />
              <label htmlFor="createGroupChat" className="text-xs font-semibold text-slate-700 cursor-pointer select-none">
                Create a collaborative Group Chat for this project
              </label>
            </div>
          )}

          {/* Key Deliverables (Checklist Builders) */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
              Project Deliverables List
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newDeliverable}
                onChange={(e) => setNewDeliverable(e.target.value)}
                placeholder="Add key deliverable (e.g. Design Wireframes)"
                className="flex-1 h-10 px-3.5 text-sm border border-slate-300 rounded-xl outline-none focus:border-primary focus:ring-3 focus:ring-primary/12 transition-all placeholder:text-slate-400"
               aria-label="Add key deliverable (e.g. Design Wireframes)"/>
              <button
                type="button"
                onClick={handleAddDeliverable}
                className="h-10 px-4 rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
              >
                <Plus size={16} />
              </button>
            </div>
            
            {/* Added list */}
            {formData.deliverables.length > 0 && (
              <div className="mt-3.5 space-y-2 max-h-36 overflow-y-auto">
                {formData.deliverables.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs font-semibold text-slate-700">
                    <span className="line-clamp-1">{item}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveDeliverable(index)}
                      className="text-rose-500 p-1 rounded-md hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer shrink-0"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Status & Progress (Only visible in Edit Mode) */}
          {projectToEdit && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full h-10 px-3.5 text-sm border border-slate-300 rounded-xl outline-none focus:border-primary focus:ring-3 focus:ring-primary/12 transition-all bg-white cursor-pointer"
                 aria-label="Select status">
                  <option value="Planning">Planning</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Review">Review</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                  Progress ({formData.progress}%)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    name="progress"
                    min="0"
                    max="100"
                    value={formData.progress}
                    onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) })}
                    className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#4F46E5]"
                   aria-label="Progress"/>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.progress}
                    onChange={(e) => setFormData({ ...formData, progress: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)) })}
                    className="w-16 h-10 border border-slate-300 rounded-xl text-center text-sm outline-none focus:border-primary"
                   aria-label="W-16 h-10 border border-slate-300 rounded-xl text-center text-sm outline-none focus:border-primary"/>
                </div>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4.5 h-10 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50 text-xs font-bold transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4.5 h-10 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-bold transition-all shadow-sm shadow-primary/15 cursor-pointer"
            >
              {projectToEdit ? 'Save Changes' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default NewProjectModal;
