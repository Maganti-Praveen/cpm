// Displays a highlight card explaining the active phase of a client project.
// Details target delivery deadlines.


import React from "react";

export default function StatusCard({ title, value, type = "primary", subtext }) {
  // Configs for different stat types
  const configs = {
    primary: {
      bg: "bg-primary-light",
      text: "text-primary",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
      ),
    },
    warning: {
      bg: "bg-warning-light",
      text: "text-warning",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    success: {
      bg: "bg-success-light",
      text: "text-success",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    info: {
      bg: "bg-info-light",
      text: "text-info",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
        </svg>
      ),
    },
  };

  const currentConfig = configs[type] || configs.primary;

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-300 flex items-start gap-4 flex-1 min-w-[220px] font-sans">
      {/* Icon Wrapper */}
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${currentConfig.bg} ${currentConfig.text}`}>
        {currentConfig.icon}
      </div>

      {/* Text Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between">
          <h3 className="font-display font-bold text-slate-900 text-2xl tracking-tight leading-none">
            {value}
          </h3>
        </div>
        <p className="text-slate-600 text-sm font-medium mt-1.5 leading-tight truncate">
          {title}
        </p>
        {subtext && (
          <p className="text-xs text-slate-400 font-medium mt-1 leading-normal truncate">
            {subtext}
          </p>
        )}
      </div>
    </div>
  );
}
