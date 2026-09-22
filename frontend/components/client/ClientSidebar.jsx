// Renders navigation modules specific to client accounts.
// highlights current dashboard choices.


import React from "react";
import { useGlobalSettings } from "../../hooks/useGlobalSettings";

export default function ClientSidebar({ activeTab = "Overview", setActiveTab }) {
  const { siteTitle, siteLogo } = useGlobalSettings();
  const brandName = siteTitle.replace(/\s+(CRP|Portal|CRM|System|Solutions)\b/gi, "").trim();
  // Defines list profiles for navigation menus tailored to clients
  const menuItems = [
    {
      name: "Overview",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
        </svg>
      ),
    },
    {
      name: "My Projects",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
      ),
    },
    {
      name: "Documents",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7v12m0 0l-4-4m4 4l4-4m0 6V4m0 0L8 8m4-4l4 4" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      name: "Invoices",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
    },
    {
      name: "Support",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
    },
  ];

  return (
    <aside className="w-52 bg-white border-right border-slate-300 flex flex-col h-screen sticky top-0 font-sans">
      {/* Brand Header */}
      <div className="py-4 px-5 border-bottom border-slate-100">
        <div className="flex items-center gap-3">
          {siteLogo ? (
            <img src={siteLogo} alt={siteTitle} className="w-9 h-9 object-contain" />
          ) : (
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-primary text-white font-display font-extrabold text-xl">
              {brandName.charAt(0) || "S"}
            </div>
          )}
          <div>
            <h1 className="font-display font-bold text-base text-slate-900 leading-tight tracking-tight">
              {siteTitle}
            </h1>
            <p className="text-[11px] font-medium text-slate-500">Client Portal</p>
          </div>
        </div>
      </div>

      {/* User Information Profile Card */}
      <div className="mx-4 my-1.5 p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-indigo-500 text-white font-display font-semibold text-sm flex items-center justify-center shadow-inner">
          NA
        </div>
        <div className="overflow-hidden">
          <h4 className="font-display font-semibold text-slate-900 text-sm truncate">
            Nikhitha Althi
          </h4>
          <p className="text-xs text-slate-500 font-medium truncate">{brandName}</p>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        // Iterates navigation options to dynamically configure routes and sidebar items
        {menuItems.map((item) => {
          const isActive = activeTab === item.name;
          return (
            <button
              key={item.name}
              onClick={() => setActiveTab && setActiveTab(item.name)}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                isActive
                  ? "bg-primary-light text-primary shadow-sm"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <span className={`transition-colors duration-200 ${isActive ? "text-primary" : "text-slate-400"}`}>
                {item.icon}
              </span>
              <span>{item.name}</span>
            </button>
          );
        })}
      </nav>

      {/* Bottom Footer Info */}
      <div className="p-3 border-top border-slate-100 text-center">
        <p className="text-xs text-slate-400 font-medium">Agency Partner</p>
        <p className="text-xs text-slate-600 font-semibold mt-0.5">{brandName}</p>
      </div>
    </aside>
  );
}
