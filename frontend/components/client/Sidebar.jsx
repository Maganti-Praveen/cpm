// Collapsible navigation menu adapting to screen configurations.
// Handles menu toggles.


import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logout } from "../../slices/authSlice";
import { useGlobalSettings } from "../../hooks/useGlobalSettings";
import logoImg from "../../assets/logo.webp";
import OptimizedImage from "../common/OptimizedImage";

export default function Sidebar({ isOpen, toggleSidebar }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // load site branding (logo, colors)
  const { siteTitle, siteLogo } = useGlobalSettings();
  const brandName = siteTitle.replace(/\s+(CRP|Portal|CRM|System|Solutions)\b/gi, "").trim();

  const handleLogout = () => {
    dispatch(logout());
    navigate("/client/login");
  };

  const menuItems = [
    {
      name: "Dashboard",
      path: "/client/dashboard",
      icon: (
        <svg className="w-5 h-5" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
        </svg>
      ),
    },
    {
      name: "My Projects",
      path: "/client/projects",
      icon: (
        <svg className="w-5 h-5" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
      ),
    },
    {
      name: "Deliverables",
      path: "/client/deliverables",
      icon: (
        <svg className="w-5 h-5" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-12 7h.01M6 10a1 1 0 11-2 0 1 1 0 012 0zm12 0a1 1 0 11-2 0 1 1 0 012 0zm-6 8a1 1 0 100-2 1 1 0 000 2z" />
        </svg>
      ),
    },
    {
      name: "Documents",
      path: "/client/documents",
      icon: (
        <svg className="w-5 h-5" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      name: "Invoices",
      path: "/client/invoices",
      icon: (
        <svg className="w-5 h-5" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      name: "Payment History",
      path: "/client/payment-history",
      icon: (
        <svg className="w-5 h-5" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      name: "Support Tickets",
      path: "/client/support-tickets",
      icon: (
        <svg className="w-5 h-5" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
        </svg>
      ),
    },
    {
      name: "Messages",
      path: "/client/messages",
      icon: (
        <svg className="w-5 h-5" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
    },
    {
      name: "Notifications",
      path: "/client/notifications",
      icon: (
        <svg className="w-5 h-5" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      ),
    },

    {
      name: "Settings",
      path: "/client/settings",
      icon: (
        <svg className="w-5 h-5" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ];

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 md:hidden"
          onClick={toggleSidebar}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-60 bg-[var(--bg-sidebar)] border-r flex flex-col transition-transform duration-300 md:translate-x-0 md:static ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } h-screen font-sans text-[var(--text-sidebar)]`}
        style={{ borderColor: "var(--bg-sidebar-hover, rgba(30,27,75,0.2))" }}
        aria-label="Client portal navigation"
      >
        {/* Sidebar Header Brand */}
        <div className="py-4 px-5 border-bottom border-[var(--bg-sidebar-hover)]/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <OptimizedImage
              src={siteLogo || logoImg}
              alt={siteTitle || "Sai IT Services logo"}
              width={36}
              height={36}
              className="object-contain rounded-lg p-0.5"
              style={{ backgroundColor: "#FFFFFF" }}
            />
            <div>
              <span className="font-display font-bold text-base text-[var(--text-sidebar-active)] leading-tight tracking-tight truncate max-w-[130px] block" title={siteTitle}>
                {siteTitle}
              </span>
              <p className="text-[11px] font-semibold text-[var(--text-sidebar)]/80">Client Portal</p>
            </div>
          </div>
          
          {/* Close button on mobile */}
          <button
            onClick={toggleSidebar}
            aria-label="Close sidebar menu"
            className="md:hidden p-1 text-[var(--text-sidebar)]/80 hover:text-[var(--text-sidebar-active)] rounded-lg cursor-pointer"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>


        {/* Sidebar Menu Items */}
        <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto" aria-label="Main menu">
          {menuItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={() => {
                if (window.innerWidth < 768) {
                  toggleSidebar();
                }
              }}
              className={({ isActive }) =>
                `w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold ${
                  isActive
                    ? "bg-[var(--bg-sidebar-active)] text-[var(--text-sidebar-active)] shadow-xs"
                    : "text-[var(--text-sidebar)]/80 hover:bg-[var(--bg-sidebar-hover)] hover:text-[var(--text-sidebar-active)]"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`transition-colors duration-200 ${isActive ? "text-[var(--text-sidebar-active)]" : "text-[var(--text-sidebar)]/80"}`} aria-hidden="true">
                    {item.icon}
                  </span>
                  <span>{item.name}</span>
                </>
              )}
            </NavLink>
          ))}

          {/* Logout Action Button */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold text-red-200 hover:bg-[var(--bg-sidebar-hover)]/45 hover:text-red-100 transition-all duration-200 cursor-pointer"
          >
            <span className="text-red-300" aria-hidden="true">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </span>
            <span>Logout</span>
          </button>
        </nav>

        {/* Bottom Section (Footer only) */}
        <div className="p-3 border-t" style={{ borderColor: "var(--bg-sidebar-hover, rgba(45,42,114,0.5))" }}>
          <div className="text-center text-[11px] font-medium" style={{ color: "var(--text-sidebar, #C7D2FE)" }}>
            Agency Partner: {brandName}
          </div>
        </div>
      </aside>
    </>
  );
}
