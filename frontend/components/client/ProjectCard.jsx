// Renders a snapshot view of project budgets, deadlines, and progress ratios.
// Serves client projects grid screens.


import React from "react";

export default function ProjectCard({
  title,
  progress,
  status,
  dateRange,
  milestoneText,
  reviewBadgeText,
  teamLead,
  buttonText = "View Project"
}) {
  const isProgressing = status === "In Progress";
  const statusColors = isProgressing
    ? "bg-indigo-50 text-indigo-700 border-indigo-100"
    : "bg-slate-50 text-slate-600 border-slate-200";

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-300 mb-6 font-sans">
      {/* Header Info */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="font-display font-bold text-slate-900 text-lg leading-tight">
            {title}
          </h3>
          <p className="text-xs text-slate-400 font-medium mt-1">
            {dateRange || "Timeline pending"}
          </p>
        </div>
        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${statusColors}`}>
          {status}
        </span>
      </div>

      {/* Progress Bar Section */}
      <div className="mt-5">
        <div className="flex justify-between items-center text-xs font-semibold mb-1.5">
          <span className="text-slate-500">Overall Progress</span>
          <span className="text-primary">{progress}% complete</span>
        </div>
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Milestone Stats */}
      {milestoneText && (
        <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-slate-600">
          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{milestoneText}</span>
        </div>
      )}

      {/* Footer Info & Actions */}
      <div className="mt-6 pt-5 border-top border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Team Contact */}
        {teamLead ? (
          <div className="flex items-center gap-2.5">
            <div className="w-8.5 h-8.5 rounded-full bg-slate-200 text-slate-700 font-display font-semibold text-xs flex items-center justify-center border border-white shadow-sm shrink-0">
              {teamLead.initials || "PV"}
            </div>
            <div className="min-w-0">
              <h5 className="font-display font-semibold text-slate-800 text-xs truncate">
                {teamLead.name}
              </h5>
              <p className="text-[11px] text-slate-400 font-medium tracking-wider uppercase leading-none mt-0.5">
                {teamLead.role || "Project Lead"}
              </p>
            </div>
          </div>
        ) : (
          <div className="w-1" />
        )}

        {/* Deliverables Chip & Button */}
        <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
          {reviewBadgeText && (
            <span className="inline-flex items-center bg-warning-light text-warning px-2.5 py-1.5 rounded-lg text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-warning mr-1.5 shrink-0" />
              {reviewBadgeText}
            </span>
          )}
          <button className="px-4 py-2 bg-white border border-primary text-primary hover:bg-primary-light text-xs font-semibold rounded-xl cursor-pointer transition-colors duration-200">
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
}
