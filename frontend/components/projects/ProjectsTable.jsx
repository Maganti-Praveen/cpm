// Tabular grid compiling project records, budgets, and clients.
// Provides direct action edits.

import { useNavigate } from 'react-router-dom';
import { AvatarStack } from '../common/Avatar';
import ProgressBar from '../common/ProgressBar';
import StatusBadge from '../common/StatusBadge';
import { Trash2 } from 'lucide-react';

function ProjectsTable({ projects = [], onClickRow, onDeleteClick, selectedIds = [], onSelectAll, onSelectRow }) {
  const navigate = useNavigate();

  // Checks if current rows list entries match checkmark targets lists
  const isAllSelected = projects.length > 0 && projects.every((p) => selectedIds.includes(p.id));

  return (
    <div className="overflow-x-auto">
      <table className="w-full" role="table">
        <thead>
          <tr className="border-b border-[#E2E8F0]">
            {onSelectRow && onSelectAll && (
              <th scope="col" className="py-3 px-3 w-10 text-center">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={(e) => onSelectAll(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-350 text-[#4F46E5] focus:ring-[#4F46E5]/30 cursor-pointer transition-colors"
                  aria-label="Select all projects"
                />
              </th>
            )}
            <th scope="col" className="text-left py-3 px-3 text-[0.6875rem] font-semibold text-[#64748B] uppercase tracking-[0.08em]">
              Project Name &amp; Client
            </th>
            <th scope="col" className="text-left py-3 px-3 text-[0.6875rem] font-semibold text-[#64748B] uppercase tracking-[0.08em] hidden sm:table-cell">
              Team
            </th>
            <th scope="col" className="text-left py-3 px-3 text-[0.6875rem] font-semibold text-[#64748B] uppercase tracking-[0.08em]">
              Progress
            </th>
            <th scope="col" className="text-left py-3 px-3 text-[0.6875rem] font-semibold text-[#64748B] uppercase tracking-[0.08em]">
              Status
            </th>
            <th scope="col" className="text-left py-3 px-3 text-[0.6875rem] font-semibold text-[#64748B] uppercase tracking-[0.08em] hidden sm:table-cell">
              Timeline
            </th>
            {onDeleteClick && (
              <th scope="col" className="text-right py-3 px-3 text-[0.6875rem] font-semibold text-[#64748B] uppercase tracking-[0.08em]">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {projects.map((project) => {
            const isSelected = selectedIds.includes(project.id);
            return (
              <tr
                key={project.id}
                onClick={() => {
                  if (onClickRow) {
                    onClickRow(project);
                  } else {
                    navigate(`/admin/projects/${project.id}`);
                  }
                }}
                className={`border-b border-[#F1F5F9] last:border-b-0 hover:bg-[#F8FAFC] transition-colors cursor-pointer ${
                  isSelected ? 'bg-indigo-50/40 hover:bg-indigo-50/60' : ''
                }`}
              >
                {onSelectRow && onSelectAll && (
                  <td className="py-4 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onSelectRow(project.id)}
                      className="w-4 h-4 rounded border-slate-350 text-[#4F46E5] focus:ring-[#4F46E5]/30 cursor-pointer transition-colors"
                      aria-label={`Select project ${project.name}`}
                    />
                  </td>
                )}
                <td className="py-4 px-3">
                  <p className="text-sm font-semibold text-[#0F172A] font-display">
                    {project.name}
                  </p>
                  <span className="inline-block bg-[#F8FAFC] border border-[#CBD5E1] px-2 py-0.5 rounded text-[11px] font-semibold text-[#64748B] uppercase tracking-wider w-fit mt-1.5">
                    {project.client}
                  </span>
                </td>
                <td className="py-4 px-3 hidden sm:table-cell">
                  <AvatarStack users={project.team} max={3} size="sm" />
                </td>
                <td className="py-4 px-3">
                  <span className="text-sm font-semibold text-[#475569]">
                    {project.progress}%
                  </span>
                </td>
                <td className="py-4 px-3">
                  <StatusBadge status={project.status} />
                </td>
                <td className="py-4 px-3 hidden sm:table-cell">
                  <p className="text-sm text-[#475569]">{project.startDate}</p>
                  <p className="text-xs text-[#94A3B8] mt-0.5">
                    {project.status === 'Completed' ? 'Done' : 'Due'}: {project.dueDate}
                  </p>
                </td>
                {onDeleteClick && (
                  <td className="py-4 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => onDeleteClick(project)}
                      className="p-1.5 rounded text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer inline-flex items-center bg-transparent border-none"
                      title="Delete Project"
                      aria-label="Delete Project"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>

      {projects.length === 0 && (
        <div className="text-center py-12">
          <p className="text-sm text-[#64748B]">No projects match your filters</p>
        </div>
      )}
    </div>
  );
}

export default ProjectsTable;
