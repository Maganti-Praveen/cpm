import React from "react";
import { Link } from "react-router-dom";

/**
 * StatCard component displays key metrics in a card with specific styling profiles (primary, success, warning, etc.).
 * Can optionally act as a React Router Link.
 * 
 * @param {Object} props - Component properties.
 * @param {string} props.label - Descriptive label text for the metric.
 * @param {string|number} props.value - Metric value to display.
 * @param {'primary'|'success'|'warning'|'info'|'danger'} [props.type="primary"] - Styling config profile to apply.
 * @param {string} [props.to] - Target destination route. If provided, renders the card inside a Link wrapper.
 * @returns {React.JSX.Element} The rendered stat card markup.
 */
export default function StatCard({ label, value, type = "primary", to }) {
  const configs = {
    primary: {
      bg: "bg-indigo-50/50 dark:bg-indigo-950/20",
      text: "text-indigo-600 dark:text-indigo-400",
      border: "border-indigo-100 dark:border-indigo-900/30",
      icon: (
        <svg className="w-5 h-5" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
      ),
    },
    success: {
      bg: "bg-emerald-50/50 dark:bg-emerald-950/20",
      text: "text-emerald-600 dark:text-emerald-400",
      border: "border-emerald-100 dark:border-emerald-900/30",
      icon: (
        <svg className="w-5 h-5" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    warning: {
      bg: "bg-amber-50/50 dark:bg-amber-950/20",
      text: "text-amber-600 dark:text-amber-400",
      border: "border-amber-100 dark:border-amber-900/30",
      icon: (
        <svg className="w-5 h-5" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    info: {
      bg: "bg-blue-50/50 dark:bg-blue-950/20",
      text: "text-blue-600 dark:text-blue-400",
      border: "border-blue-100 dark:border-blue-900/30",
      icon: (
        <svg className="w-5 h-5" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
        </svg>
      ),
    },
    danger: {
      bg: "bg-rose-50/50 dark:bg-rose-950/20",
      text: "text-rose-600 dark:text-rose-400",
      border: "border-rose-100 dark:border-rose-900/30",
      icon: (
        <svg className="w-5 h-5" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2" />
        </svg>
      ),
    },
  };

  const currentConfig = configs[type] || configs.primary;
  const trendArrow = type === "success" || type === "primary" ? " ↗" : "";

  const cardContent = (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex items-center gap-4 w-full h-full group relative overflow-hidden font-sans text-left">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${currentConfig.bg} ${currentConfig.text} ${currentConfig.border} transition-transform duration-300 group-hover:scale-110 shadow-xs`} aria-hidden="true">
        {currentConfig.icon}
      </div>
      <div>
        <h2 className="text-2xl font-display font-extrabold text-slate-900 tracking-tight leading-none flex items-center">
          {value}
          <span className="text-xs font-bold text-emerald-600 ml-1.5">{trendArrow}</span>
        </h2>
        <p className="text-slate-500 text-[11px] sm:text-xs font-semibold tracking-wide uppercase mt-2 leading-none">
          {label}
        </p>
      </div>
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="no-underline block w-full h-full">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}
