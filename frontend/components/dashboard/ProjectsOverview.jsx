// Renders project breakdowns, total values, and active milestone metrics.
// Feeds statistics cards.


import { AvatarStack } from '../common/Avatar';
import ProgressBar from '../common/ProgressBar';
import StatusBadge from '../common/StatusBadge';
import { MoreHorizontal } from 'lucide-react';
import { Link } from 'react-router-dom';

function ProjectsOverview({ projects = [], loading }) {
  // Evaluates loading states and maps project metrics into data columns
  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm animate-pulse">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="h-5 bg-slate-200 rounded w-1/3"></div>
          <div className="h-4 bg-slate-200 rounded w-16"></div>
        </div>
        <div className="space-y-4">
          <div className="h-12 bg-slate-100 rounded w-full"></div>
          <div className="h-12 bg-slate-100 rounded w-full"></div>
          <div className="h-12 bg-slate-100 rounded w-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold text-[#0F172A] font-display">
          Projects Overview
        </h2>
        <Link
          to="/admin/projects"
          className="text-sm font-medium text-[#4F46E5] hover:text-[#3730A3] transition-colors no-underline"
        >
          View All
        </Link>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full" role="table">
          <thead>
            <tr className="border-b border-[#F1F5F9]">
              <th scope="col" className="text-left py-3 px-2 text-[0.6875rem] font-semibold text-[#64748B] uppercase tracking-[0.05em]">
                Project &amp; Client
              </th>
              <th scope="col" className="text-left py-3 px-2 text-[0.6875rem] font-semibold text-[#64748B] uppercase tracking-[0.05em]">
                Team
              </th>
              <th scope="col" className="text-left py-3 px-2 text-[0.6875rem] font-semibold text-[#64748B] uppercase tracking-[0.05em]">
                Progress
              </th>
              <th scope="col" className="text-left py-3 px-2 text-[0.6875rem] font-semibold text-[#64748B] uppercase tracking-[0.05em]">
                Status
              </th>
              <th scope="col" className="text-left py-3 px-2 text-[0.6875rem] font-semibold text-[#64748B] uppercase tracking-[0.05em]">
                Due Date
              </th>
              <th scope="col" className="text-left py-3 px-2 text-[0.6875rem] font-semibold text-[#64748B] uppercase tracking-[0.05em]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project) => (
              <tr
                key={project.id}
                className="border-b border-[#F8FAFC] last:border-b-0 hover:bg-[#F8FAFC] transition-colors"
              >
                <td className="py-3.5 px-2">
                  <Link 
                    to={`/admin/projects/${project.id}`} 
                    className="text-sm font-semibold text-[#0F172A] font-display hover:text-[#4F46E5] transition-colors no-underline block"
                  >
                    {project.name}
                  </Link>
                  <p className="text-xs text-[#64748B] mt-0.5">{project.client}</p>
                </td>
                <td className="py-3.5 px-2">
                  <AvatarStack users={project.team} max={4} size="sm" />
                </td>
                <td className="py-3.5 px-2 min-w-[8rem]">
                  <ProgressBar value={project.progress} size="sm" />
                </td>
                <td className="py-3.5 px-2">
                  <StatusBadge status={project.status} />
                </td>
                <td className="py-3.5 px-2">
                  <span className="text-sm text-[#475569]">{project.dueDate}</span>
                </td>
                <td className="py-3.5 px-2">
                  <Link
                    to={`/admin/projects/${project.id}`}
                    className="inline-flex items-center justify-center px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-[11px] font-bold text-indigo-700 rounded-lg transition-colors no-underline border-none"
                  >
                    View Details
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {projects.length === 0 && (
        <div className="text-center py-8">
          <p className="text-sm text-[#64748B]">No projects yet</p>
        </div>
      )}
    </div>
  );
}

export default ProjectsOverview;
