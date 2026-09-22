// Panel illustrating details of a project budget, client details, and active scope descriptions.
// Summarizes workspace settings.


import { CircleCheckBig, Flag, PlusCircle, X } from 'lucide-react';
import Avatar from '../common/Avatar';

/**
 * ProjectOverview component displays project metadata, details such as budget, 
 * client information, tasks completed, milestones status, team members, and a recent activities timeline.
 * 
 * @param {Object} props - Component properties.
 * @param {Object} props.project - Project details (description, budget, deliverables, tasksDone, etc.).
 * @param {Function} props.onAddTeamMemberClick - Event handler invoked when adding a team member.
 * @param {Function} props.onRemoveTeamMember - Event handler invoked when removing a team member.
 * @param {boolean} props.isAdmin - Flag to determine if the viewer has administrator privileges.
 * @returns {React.JSX.Element} The rendered overview layout.
 */
function ProjectOverview({ project, onAddTeamMemberClick, onRemoveTeamMember, isAdmin }) {
  // Evaluates deliverable parameters and displays details of budget and scopes
  return (
    <div className="space-y-6 mt-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left — Description */}
        <div className="col-span-full lg:col-span-7">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-[#E2E8F0]">
            <h3 className="text-base font-semibold text-[#0F172A] font-display mb-3">
              Project Description
            </h3>
            <p className="text-sm text-[#475569] leading-relaxed">
              {project.description}
            </p>

            {project.deliverables && project.deliverables.length > 0 && (
              <div className="mt-5">
                <p className="text-sm font-medium text-[#334155] mb-2">
                  Key deliverables include:
                </p>
                <ul className="space-y-1.5">
                  {project.deliverables.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-[#475569]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#94A3B8] mt-1.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Right — Stats & Activity */}
        <div className="col-span-full lg:col-span-5 flex flex-col justify-between">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Tasks Done */}
            <div className="bg-white rounded-xl p-5 border border-[#E2E8F0] shadow-sm flex flex-col items-center justify-center text-center">
              <CircleCheckBig size={24} className="text-[#4F46E5] mb-2" />
              <p className="text-2xl font-bold text-[#0F172A] font-display">
                {project.tasksDone}/{project.totalTasks}
              </p>
              <p className="text-[0.6875rem] font-semibold text-[#64748B] uppercase tracking-[0.08em] mt-1">
                Tasks Done
              </p>
            </div>

            {/* Milestones */}
            <div className="bg-white rounded-xl p-5 border border-[#E2E8F0] shadow-sm flex flex-col items-center justify-center text-center">
              <Flag size={24} className="text-[#4F46E5] mb-2" />
              <p className="text-2xl font-bold text-[#0F172A] font-display">
                {project.milestonesDone}/{project.totalMilestones}
              </p>
              <p className="text-[0.6875rem] font-semibold text-[#64748B] uppercase tracking-[0.08em] mt-1">
                Milestones
              </p>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl p-6 border border-[#E2E8F0] shadow-sm mt-4 flex-1 flex flex-col justify-start">
            <h3 className="text-base font-semibold text-[#0F172A] font-display mb-4">
              Recent Activity
            </h3>
            
            <div className="relative mt-2 flex-1 min-h-[140px]">
              {/* Timeline line */}
              <div className="absolute left-3 lg:left-1/2 top-2 bottom-2 w-[2px] bg-slate-100 -translate-x-1/2" />
              
              <div className="space-y-4">
                {project.recentActivity?.map((item, idx) => {
                  const isEven = idx % 2 === 0;
                  return (
                    <div key={item.id} className="relative flex items-center justify-between">
                      {/* Left Side (Desktop/lg only) */}
                      <div className={`hidden lg:block w-[44%] text-right ${isEven ? 'invisible pointer-events-none' : ''}`}>
                        {!isEven && (
                          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-2.5 shadow-sm inline-block text-left max-w-full">
                            <p className="text-xs font-semibold text-slate-800 line-clamp-1">{item.title}</p>
                            <p className="text-[11px] text-slate-500 mt-0.5 font-medium">{item.description}</p>
                            <p className="text-[9px] text-[#94A3B8] mt-1 font-semibold">{item.time}</p>
                          </div>
                        )}
                      </div>

                      {/* Timeline Dot & Icon */}
                      <div className={`absolute left-3 lg:left-1/2 -translate-x-1/2 w-6 h-6 rounded-full border-2 bg-white flex items-center justify-center z-10 shadow-sm text-[10px] font-bold ${item.type === 'upload' ? 'border-indigo-100 text-[#4F46E5]' : 'border-emerald-100 text-emerald-600'}`}>
                        {item.type === 'upload' ? '↑' : '✓'}
                      </div>

                      {/* Right Side (Mobile/Desktop) */}
                      <div className={`w-full lg:w-[44%] pl-9 lg:pl-0 text-left ${!isEven ? 'lg:invisible lg:pointer-events-none' : ''}`}>
                        <div className={`bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-2.5 shadow-sm inline-block text-left max-w-full ${!isEven ? 'lg:hidden' : ''}`}>
                          <p className="text-xs font-semibold text-slate-800 line-clamp-1">{item.title}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5 font-medium">{item.description}</p>
                          <p className="text-[9px] text-[#94A3B8] mt-1 font-semibold">{item.time}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Team Members */}
      <div className="bg-white rounded-xl p-6 border border-[#E2E8F0] shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold text-[#0F172A] font-display">
            Team Members
          </h3>
          {isAdmin && onAddTeamMemberClick && (
            <button 
              onClick={onAddTeamMemberClick}
              className="text-[#4F46E5] hover:text-[#3730A3] transition-colors cursor-pointer"
            >
              <PlusCircle size={22} />
            </button>
          )}
        </div>

        <div className="flex items-start gap-4 flex-wrap">
          {project.team?.map((member) => (
            <div
              key={member.id}
              className="flex flex-col items-center text-center p-4 border border-[#E2E8F0] rounded-xl bg-white w-[130px] shadow-sm hover:border-[#CBD5E1] transition-all relative group"
            >
              {isAdmin && onRemoveTeamMember && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Remove ${member.name} from this project?`)) {
                      onRemoveTeamMember(member.id);
                    }
                  }}
                  className="absolute top-1.5 right-1.5 p-1 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  title={`Remove ${member.name}`}
                >
                  <X size={13} />
                </button>
              )}
              <Avatar name={member.name} size="md" color={member.color} src={member.avatar} />
              <p className="text-xs font-semibold text-[#0F172A] mt-3 truncate w-full font-display">
                {member.name}
              </p>
              <p className="text-[11px] font-medium text-[#94A3B8] mt-0.5 truncate w-full">
                {member.role}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ProjectOverview;
