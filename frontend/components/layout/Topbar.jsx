// Nav header mounting search bars, alert counts, and profile controls.
// Integrates mobile menu options.


import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CircleUser, Menu, LogOut, User } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../slices/authSlice';
import { useGlobalSettings } from "../../hooks/useGlobalSettings";
import HeaderNotifications from './HeaderNotifications';
import logoImg from '../../assets/logo.webp';
import NavbarSearch from './NavbarSearch';
import OptimizedImage from '../common/OptimizedImage';

function Topbar({ onMenuClick }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { siteTitle, siteLogo } = useGlobalSettings();

  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = useCallback(() => {
    dispatch(logout());
    navigate('/admin/login');
  }, [dispatch, navigate]);

  const handleDropdownToggle = useCallback(() => {
    setProfileDropdownOpen((prev) => !prev);
  }, []);

  const handleViewProfile = useCallback(() => {
    setProfileDropdownOpen(false);
    navigate("/admin/settings?tab=profile");
  }, [navigate]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="fixed top-0 left-0 md:left-60 right-0 h-16 bg-[var(--bg-navbar)] text-[var(--text-navbar)] flex items-center justify-between px-4 md:px-6 z-30 shadow-sm transition-all duration-300" role="banner">
      {/* Brand & Menu Toggle */}
      <div className="flex items-center gap-3">
        <button 
          onClick={onMenuClick}
          className="md:hidden p-2.5 -ml-2 rounded-lg hover:bg-[var(--bg-base)] text-[var(--text-navbar)]/80 transition-colors cursor-pointer min-w-[48px] min-h-[48px] flex items-center justify-center"
          aria-label="Toggle navigation sidebar"
        >
          <Menu size={20} />
        </button>
        <div className="flex items-center gap-3 min-w-0 md:min-w-[220px]">
          <OptimizedImage
            src={siteLogo || logoImg}
            alt={siteTitle || "Sai IT Services logo"}
            width={32}
            height={32}
            priority={true}
            className="object-contain rounded-md bg-white p-0.5 shrink-0"
          />
          <span className="font-display font-bold text-[var(--text-navbar)] text-sm truncate hidden sm:block" title={siteTitle}>
            {siteTitle}
          </span>
        </div>
      </div>

      {/* Search */}
      <NavbarSearch portal="admin" />

      {/* Right Actions */}
      <div className="flex items-center gap-1 shrink-0">
        {/* Dynamic Notifications Dropdown */}
        <HeaderNotifications />

        {/* Admin Account Dropdown Trigger */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={handleDropdownToggle}
            className="p-0.5 rounded-full transition-colors cursor-pointer flex items-center justify-center border border-slate-200 hover:border-slate-300 min-w-[48px] min-h-[48px] overflow-hidden bg-white"
            aria-label="Account"
          >
            {user?.avatar ? (
              <OptimizedImage 
                src={user.avatar} 
                alt="Admin avatar" 
                width={32}
                height={32}
                className="rounded-full object-cover" 
              />
            ) : (
              <CircleUser size={22} className="text-slate-400 m-1" />
            )}
          </button>

          {profileDropdownOpen && (
            <div className="absolute right-0 mt-2.5 w-60 border rounded-2xl shadow-xl z-50 overflow-hidden font-sans animate-in fade-in slide-in-from-top-2 duration-150 text-left" style={{ backgroundColor: "var(--card-bg, #FFFFFF)", borderColor: "var(--border-color, #E2E8F0)" }} role="menu" aria-label="Admin menu">
              <div className="p-4 border-b flex items-center gap-3" style={{ borderColor: "var(--border-color, #F1F5F9)", backgroundColor: "var(--page-bg, #F8FAFC)" }}>
                {user?.avatar ? (
                  <OptimizedImage 
                    src={user.avatar} 
                    alt="Admin avatar" 
                    width={40}
                    height={40}
                    className="rounded-full object-cover shadow-xs border border-slate-200"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full text-white font-display font-bold text-sm flex items-center justify-center shadow-xs" style={{ backgroundColor: "var(--primary-btn, #4F46E5)" }}>
                    {user?.fullName ? user.fullName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "AD"}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Logged in Administrator</p>
                  <p className="font-display font-bold text-slate-900 text-sm mt-0.5 truncate">{user?.fullName || "Admin User"}</p>
                  <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">{user?.email || ""}</p>
                </div>
              </div>
              <div className="p-2 space-y-0.5">
                <button
                  onClick={handleViewProfile}
                  role="menuitem"
                  className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer flex items-center gap-2"
                >
                  <User size={14} className="text-slate-450" />
                  View Profile
                </button>
                <button
                  onClick={handleLogout}
                  role="menuitem"
                  className="w-full text-left px-3 py-2 text-xs font-bold text-red-650 hover:bg-red-50 rounded-lg transition-colors cursor-pointer flex items-center gap-2"
                >
                  <LogOut size={14} />
                  Logout & Exit
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Topbar;
