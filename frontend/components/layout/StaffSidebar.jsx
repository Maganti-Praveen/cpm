// Renders the side navigation menu layout for staff accounts.
// Shows routes permitted for staff.

import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../slices/authSlice";
import logoImg from "../../assets/logo.webp";
import { useGlobalSettings } from "../../hooks/useGlobalSettings";

function StaffSidebar({ isOpen, onClose }) {
  const { siteTitle, siteLogo } = useGlobalSettings();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user: reduxUser } = useSelector((state) => state.auth);

  const user = reduxUser || {
    fullName: "Staff Member",
    role: "STAFF",
  };

  const onLogout = () => {
    dispatch(logout());
  };

  const navItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: (
        <svg className="w-5 h-5" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
        </svg>
      ),
    },
    {
      id: "projects",
      label: "My Projects",
      icon: (
        <svg className="w-5 h-5" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
      ),
    },
    {
      id: "tasks",
      label: "My Tasks",
      icon: (
        <svg className="w-5 h-5" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
    },
    {
      id: "milestones",
      label: "Milestones",
      icon: (
        <svg className="w-5 h-5" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      id: "documents",
      label: "Documents",
      icon: (
        <svg className="w-5 h-5" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
        </svg>
      ),
    },
    {
      id: "settings",
      label: "Settings",
      icon: (
        <svg className="w-5 h-5" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      id: "tickets",
      label: "Support",
      icon: (
        <svg className="w-5 h-5" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.09 9C9.3251 8.33167 9.78915 7.7708 10.4 7.39918C11.0108 7.02756 11.7289 6.88501 12.4344 6.99587C13.1399 7.10673 13.784 7.4639 14.2569 8.00631C14.7298 8.54873 15.0001 9.2433 15 9.96C15 11.88 12 12.84 12 12.84" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 17H12.01" />
        </svg>
      ),
    },
    {
      id: "messages",
      label: "Messages",
      icon: (
        <svg className="w-5 h-5" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
    },
  ];

  return (
    <aside className={`fixed top-0 left-0 h-screen w-60 bg-[var(--bg-sidebar)] text-[var(--text-sidebar)] flex flex-col z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:z-40 border-r shadow-xl select-none font-sans`} style={{ borderColor: "var(--bg-sidebar-hover, rgba(30,27,75,0.2))" }}>
      {/* Brand Logo Header */}
      <div className="h-16 flex items-center px-6 border-b border-[var(--bg-sidebar-hover)]/40 gap-2.5">
        <img
          src={siteLogo || logoImg}
          alt={siteTitle || "Sai IT Services logo"}
          className="w-8 h-8 object-contain rounded-md p-0.5"
          style={{ backgroundColor: "#FFFFFF" }}
          width={32}
          height={32}
        />
        <div className="flex flex-col text-left">
          <span className="font-bold text-[var(--text-sidebar-active)] tracking-wider text-sm truncate max-w-[130px]" title={siteTitle}>{siteTitle}</span>
          <span className="text-[11px] text-[var(--text-sidebar)]/80 font-semibold tracking-widest uppercase">Staff Portal</span>
        </div>
      </div>

      {/* Main Navigation Link Stack */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto no-scrollbar" aria-label="Main menu">
        <div className="px-3 mb-2 text-[11px] font-bold text-[var(--text-sidebar)]/80 tracking-wider uppercase">
          Menu
        </div>
        {navItems.map((item) => {
          const itemPath = `/staff/${item.id}`;
          const isActive = location.pathname.startsWith(itemPath);
          return (
            <Link
              key={item.id}
              to={itemPath}
              onClick={() => { if (onClose) onClose(); }}
              className={`w-full flex items-center gap-3 px-3 py-3.5 rounded-lg text-sm font-medium cursor-pointer transition-colors duration-150 decoration-none ${isActive
                  ? "bg-[var(--bg-sidebar-active)] text-[var(--text-sidebar-active)] font-semibold"
                  : "text-[var(--text-sidebar)]/85 hover:bg-[var(--bg-sidebar-hover)] hover:text-[var(--text-sidebar-active)]"
                }`}
            >
              <span className={`transition-colors duration-200 ${isActive ? "text-[var(--text-sidebar-active)]" : "text-[var(--text-sidebar)]/80 group-hover:text-[var(--text-sidebar-active)]"}`} aria-hidden="true">
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Info & Support at bottom */}
      <div className="p-4 border-t border-[var(--bg-sidebar-hover)]/40 bg-[var(--bg-sidebar-hover)]/20 space-y-3">
        {/* Profile Card */}
        <div className="flex items-center gap-3 px-2 py-1.5 border-t border-[var(--bg-sidebar-hover)]/40 pt-3">
          <div className="w-9 h-9 rounded-full border border-[var(--bg-sidebar-hover)] bg-[var(--bg-sidebar-hover)]/40 flex items-center justify-center text-[var(--text-sidebar)]/75 shrink-0">
            <svg className="w-5 h-5 text-[var(--text-sidebar)]/75" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-xs font-semibold text-[var(--text-sidebar-active)] truncate">
              {user.fullName}
            </p>
            <p className="text-[11px] text-[var(--text-sidebar)]/80 truncate lowercase">
              {user.role}
            </p>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 py-3 px-3 text-xs font-medium text-[var(--text-sidebar)]/85 hover:text-[var(--text-sidebar-active)] bg-[var(--bg-sidebar-hover)]/40 hover:bg-red-950/20 hover:border-red-900/30 hover:text-red-400 border border-[var(--bg-sidebar-hover)]/80 rounded-md cursor-pointer transition-all duration-200"
        >
          <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

export default StaffSidebar;
