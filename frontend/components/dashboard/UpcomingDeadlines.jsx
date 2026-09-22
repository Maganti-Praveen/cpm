// Shows list of tasks and milestone due dates approaching.
// flags items overdue.


import { Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

function UpcomingDeadlines({ deadlines = [], loading }) {
  // Calculates highlight indicator colors depending on proximity to due dates
  const getDaysStyle = (days) => {
    if (days <= 1) return { bg: '#FEE2E2', text: '#DC2626' };
    if (days <= 3) return { bg: '#FEF3C7', text: '#D97706' };
    return { bg: '#E0F2FE', text: '#0284C7' };
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm animate-pulse">
        <div className="h-5 bg-slate-200 rounded w-1/2 mb-5"></div>
        <div className="space-y-4">
          <div className="flex justify-between items-center py-2">
            <div className="flex items-center gap-3 w-2/3">
              <div className="w-8 h-8 rounded-lg bg-slate-200 shrink-0"></div>
              <div className="space-y-2 w-full">
                <div className="h-3 bg-slate-200 rounded w-5/6"></div>
                <div className="h-3 bg-slate-200 rounded w-1/2"></div>
              </div>
            </div>
            <div className="w-16 h-5 bg-slate-200 rounded-full"></div>
          </div>
          <div className="flex justify-between items-center py-2">
            <div className="flex items-center gap-3 w-2/3">
              <div className="w-8 h-8 rounded-lg bg-slate-200 shrink-0"></div>
              <div className="space-y-2 w-full">
                <div className="h-3 bg-slate-200 rounded w-5/6"></div>
                <div className="h-3 bg-slate-200 rounded w-1/2"></div>
              </div>
            </div>
            <div className="w-16 h-5 bg-slate-200 rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-[#0F172A] font-display mb-5">
        Upcoming Deadlines
      </h2>

      <div className="space-y-0">
        {deadlines.map((item, index) => {
          const style = getDaysStyle(item.daysLeft);
          return (
            <div
              key={item.id}
              className={`flex items-center justify-between py-3.5 ${
                index < deadlines.length - 1 ? 'border-b border-[#F1F5F9]' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#F1F5F9] flex items-center justify-center shrink-0 mt-0.5">
                  <Clock size={16} className="text-[#64748B]" />
                </div>
                <div>
                  <Link 
                    to="/admin/tasks" 
                    className="text-sm font-medium text-[#0F172A] hover:text-[#4F46E5] transition-colors no-underline block"
                  >
                    {item.title}
                  </Link>
                  <p className="text-xs text-[#94A3B8] mt-0.5">{item.project || item.department}</p>
                </div>
              </div>
              <span
                className="text-[0.6875rem] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap"
                style={{ backgroundColor: style.bg, color: style.text }}
              >
                {item.daysLeft} Day{item.daysLeft !== 1 ? 's' : ''} Left
              </span>
            </div>
          );
        })}
      </div>

      {deadlines.length === 0 && (
        <div className="text-center py-6">
          <p className="text-sm text-[#64748B]">No upcoming deadlines</p>
        </div>
      )}
    </div>
  );
}

export default UpcomingDeadlines;
