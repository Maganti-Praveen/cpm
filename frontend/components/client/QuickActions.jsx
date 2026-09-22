// Groups shortcuts for clients to file help tickets or upload materials.
// Promotes fast navigation.


import React from "react";
import { Link } from "react-router-dom";

export default function QuickActions() {
  // Defines high-frequency links for client dashboard shortcut controls
  const actions = [
    {
      label: "View Projects",
      path: "/client/projects",
      bg: "bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900",
      icon: (
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
    },
    {
      label: "Review Deliverables",
      path: "/client/deliverables",
      bg: "bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900",
      icon: (
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: "View Documents",
      path: "/client/documents",
      bg: "bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900",
      icon: (
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      label: "Create Support Ticket",
      path: "/client/support-tickets",
      bg: "bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900",
      icon: (
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs font-sans">
      <h2 className="font-display font-bold text-slate-900 text-base mb-4">
        Quick Actions
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Iterates defined shortcuts to output links with responsive grid positioning */}
        {actions.map((act) => (
          <Link
            key={act.label}
            to={act.path}
            className={`flex items-center justify-center px-4 py-3 rounded-xl text-sm font-bold shadow-xs hover:shadow-md transform hover:-translate-y-0.5 transition-all duration-200 cursor-pointer ${act.bg}`}
          >
            {act.icon}
            {act.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
