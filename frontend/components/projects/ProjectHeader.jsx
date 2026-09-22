// Displays titles, dynamic progress gauges, and action controls on project detail views.
// Shows project status flags.


import { useNavigate } from 'react-router-dom';
import StatusBadge from '../common/StatusBadge';
import ProgressBar from '../common/ProgressBar';
import { ArrowLeft, Pencil, Plus, Building2, CalendarDays, Trash2 } from 'lucide-react';

function ProjectHeader({ project, onEditClick, onAddTaskClick, onDeleteClick, onBackClick, userRole = 'ADMIN' }) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBackClick) {
      onBackClick();
    } else {
      if (userRole === 'ADMIN') {
        navigate('/admin/projects');
      } else if (userRole === 'CLIENT') {
        navigate('/client/projects');
      } else {
        navigate(-1);
      }
    }
  };

  const isAdmin = userRole === 'ADMIN';

  return (
    <div>
      {/* Back Button */}
      <button
        onClick={handleBack}
        className="flex items-center gap-1.5 text-sm font-medium text-[#64748B] hover:text-[#0F172A] transition-colors mb-4 cursor-pointer"
      >
        <ArrowLeft size={16} />
        Back to Projects
      </button>

      {/* Title Row */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-[1.75rem] font-bold text-[#0F172A] font-display">
            {project.name}
          </h1>
          <StatusBadge status={project.status} />
        </div>

        {isAdmin && (
          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            {onDeleteClick && (
              <button
                onClick={onDeleteClick}
                className="inline-flex items-center gap-1.5 px-4 h-9 rounded-lg border border-rose-200 text-sm font-medium text-rose-600 bg-white hover:bg-rose-50 hover:border-rose-350 transition-all duration-150 cursor-pointer"
              >
                <Trash2 size={15} />
                Delete Project
              </button>
            )}
            <button
              onClick={onEditClick}
              className="inline-flex items-center gap-1.5 px-4 h-9 rounded-lg border border-[#CBD5E1] text-sm font-medium text-[#475569] bg-white hover:bg-[#F1F5F9] hover:border-[#94A3B8] transition-all duration-150 cursor-pointer"
            >
              <Pencil size={15} />
              Edit Project
            </button>
            <button
              onClick={onAddTaskClick}
              className="inline-flex items-center gap-1.5 px-4 h-9 rounded-lg bg-[#4F46E5] text-sm font-medium text-white hover:bg-[#3730A3] transition-all duration-150 cursor-pointer"
            >
              <Plus size={16} />
              Add Task
            </button>
          </div>
        )}
      </div>

      {/* Meta Info */}
      <div className="flex items-center gap-4 mt-2">
        <span className="flex items-center gap-1.5 text-sm text-[#64748B]">
          <Building2 size={14} />
          {project.client}
        </span>
        <span className="flex items-center gap-1.5 text-sm text-[#64748B]">
          <CalendarDays size={14} />
          Due: {project.dueDate}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="mt-5">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm font-medium text-[#334155]">Project Progress</span>
          <span className="text-sm font-semibold text-[#334155]">{project.progress}%</span>
        </div>
        <ProgressBar value={project.progress} showLabel={false} />
      </div>
    </div>
  );
}

export default ProjectHeader;
