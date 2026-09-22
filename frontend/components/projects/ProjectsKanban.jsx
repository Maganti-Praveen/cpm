// Maps project cards to columns based on development stages.
// Supports status shifts.


import { useNavigate } from 'react-router-dom';
import { Calendar } from 'lucide-react';
import { AvatarStack } from '../common/Avatar';
import ProgressBar from '../common/ProgressBar';

const COLUMNS = [
  { status: 'Planning', label: 'Planning', headerBg: 'bg-slate-100', dotBg: 'bg-slate-400' },
  { status: 'In Progress', label: 'In Progress', headerBg: 'bg-amber-50', dotBg: 'bg-amber-500' },
  { status: 'Review', label: 'Review', headerBg: 'bg-purple-50', dotBg: 'bg-purple-500' },
  { status: 'Completed', label: 'Completed', headerBg: 'bg-emerald-50', dotBg: 'bg-emerald-500' }
];

function ProjectsKanban({ projects = [], onClickCard }) {
  const navigate = useNavigate();

  // Group projects by status
  const grouped = COLUMNS.reduce((acc, col) => {
    acc[col.status] = projects.filter((p) => p.status === col.status);
    return acc;
  }, {});

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-6">
      {COLUMNS.map((col) => {
        const list = grouped[col.status] || [];
        return (
          <div key={col.status} className="flex flex-col min-h-[500px]">
            {/* Column Header */}
            <div className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg ${col.headerBg} border border-slate-200/50 mb-4`}>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${col.dotBg}`} />
                <span className="text-sm font-semibold text-slate-800 font-display">
                  {col.label}
                </span>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 bg-white text-slate-600 rounded-full border border-slate-200 shadow-sm">
                {list.length}
              </span>
            </div>

            {/* Column Content */}
            <div className="flex-1 space-y-3">
              {list.map((project) => (
                <div
                  key={project.id}
                  onClick={() => {
                    if (onClickCard) {
                      onClickCard(project);
                    } else {
                      navigate(`/admin/projects/${project.id}`);
                    }
                  }}
                  className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-150 cursor-pointer active:scale-[0.99] group"
                >
                  {/* Client Tag */}
                  <span className="inline-block bg-slate-50 border border-slate-200 px-2 py-0.5 rounded text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    {project.client}
                  </span>

                  {/* Project Name */}
                  <h4 className="text-sm font-semibold text-slate-900 font-display mt-2 group-hover:text-primary transition-colors line-clamp-1">
                    {project.name}
                  </h4>

                  {/* Progress Section */}
                  <div className="mt-4">
                    <div className="flex justify-between items-center mb-1 text-[11px] font-medium text-slate-500">
                      <span>Progress</span>
                      <span>{project.progress}%</span>
                    </div>
                    <ProgressBar value={project.progress} size="xs" showLabel={false} />
                  </div>

                  {/* Card Footer */}
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                    <AvatarStack users={project.team} max={3} size="xs" />
                    <div className="flex items-center gap-1 text-[11px] text-slate-400">
                      <Calendar size={12} />
                      <span className="font-medium">{project.dueDate}</span>
                    </div>
                  </div>
                </div>
              ))}

              {list.length === 0 && (
                <div className="flex items-center justify-center h-24 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                  <p className="text-xs text-slate-400 font-medium">No projects in this stage</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default ProjectsKanban;
