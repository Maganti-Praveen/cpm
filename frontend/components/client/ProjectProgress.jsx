// Visualizes overall phase completions and milestone counts.
// Displays color-coded progress bars.


import React from "react";
import { Link } from "react-router-dom";

export default function ProjectProgress({ projects = [], loading = false }) {

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs font-sans min-h-[180px]">
      <h2 className="font-display font-bold text-slate-900 text-base mb-5">
        Project Progress
      </h2>
      <div className="space-y-5">
        {loading ? (
          <div className="space-y-4">
            <div className="animate-pulse space-y-2.5">
              <div className="h-3.5 bg-slate-100 rounded-md w-1/3" />
              <div className="h-2.5 bg-slate-100 rounded-full w-full" />
              <div className="h-2 bg-slate-100 rounded-md w-1/4" />
            </div>
          </div>
        ) : projects.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No active projects.</p>
        ) : (
          // Iterates active projects to display completion statistics and tracking bars
          projects.map((proj) => (
            <div key={proj.name} className="space-y-2">
              <div className="flex justify-between items-center text-xs font-semibold gap-3 min-w-0">
                <Link to="/client/projects" className="text-slate-800 font-display font-bold truncate flex-1 min-w-0 hover:text-indigo-600 transition-colors no-underline" title={proj.name}>{proj.name}</Link>
                <span className="text-primary shrink-0">{proj.progress}%</span>
              </div>
              
              {/* Progress Bar Track */}
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${proj.progress}%` }}
                />
              </div>
              
              <p className="text-[11px] text-slate-400 font-medium">
                Deadline: {proj.deadline}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
