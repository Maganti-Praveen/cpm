// Feeds an overview log of recent global updates and user registrations.
// Displays chronological updates.


function RecentActivity({ activities = [], loading }) {
  // Evaluates loading states and maps active lists of system operations logs
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-sm animate-pulse">
        <h2 className="text-lg font-semibold text-[#0F172A] font-display mb-5">
          Recent Activity
        </h2>
        <div className="space-y-6">
          <div className="flex gap-4">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-200 shrink-0 mt-1.5"></div>
            <div className="space-y-2 flex-1">
              <div className="h-3 bg-slate-200 rounded w-3/4"></div>
              <div className="h-3 bg-slate-200 rounded w-1/3"></div>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-200 shrink-0 mt-1.5"></div>
            <div className="space-y-2 flex-1">
              <div className="h-3 bg-slate-200 rounded w-3/4"></div>
              <div className="h-3 bg-slate-200 rounded w-1/3"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-[#0F172A] font-display mb-5">
        Recent Activity
      </h2>

      <div className="space-y-6">
        
        {activities.map((item, index) => (
          <div key={item.id} className="relative pl-6 flex items-start">
            {/* Vertical line connecting the dots */}
            {index < activities.length - 1 && (
              <span
                className="absolute left-[4px] top-2 bottom-0 w-[2px] bg-[#F1F5F9]"
                aria-hidden="true"
              />
            )}
            {/* Timeline dot */}
            <span
              className={`absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full shrink-0 ${
                item.isActive ? 'bg-[#0284C7]' : 'bg-[#E2E8F0]'
              }`}
              aria-hidden="true"
            />
            {/* Text details */}
            <div className="min-w-0 flex-1 -mt-0.5">
              <p className="text-sm font-medium text-[#0F172A] break-words">
                {item.userName || item.user?.fullName ? `${item.userName || item.user?.fullName}: ${item.title}` : item.title}
              </p>
              {item.detail && (
                <p className="text-xs text-slate-600 mt-0.5">
                  {item.detail}
                </p>
              )}
              <p className="text-xs text-[#94A3B8] mt-0.5">
                {item.subtitle || item.meta}
              </p>
            </div>
          </div>
        ))}
      </div>

      {activities.length === 0 && (
        <div className="text-center py-6">
          <p className="text-sm text-[#64748B]">No recent activity</p>
        </div>
      )}
    </div>
  );
}

export default RecentActivity;
