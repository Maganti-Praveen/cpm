// This file defines the layout shell for all staff-authenticated routes.
// It wraps nested child pages in a layout with a persistent sidebar and top header bar.
// Enforces password change on first login.

import React, { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout, updateProfile } from "../slices/authSlice";
import StaffSidebar from "../components/layout/StaffSidebar";
import FirstLoginModal from "../components/auth/FirstLoginModal";
import { useGlobalSettings } from "../hooks/useGlobalSettings";
import HeaderNotifications from "../components/layout/HeaderNotifications";
import NavbarSearch from "../components/layout/NavbarSearch";
import ThemeSelector from "../components/layout/ThemeSelector";
import { Menu } from "lucide-react";

export default function StaffLayout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  // Retrieve user session info from Redux store
  const { user: reduxUser, loading, error } = useSelector((state) => state.auth);
  
  // Get active site branding settings
  const { siteTitle, siteLogo } = useGlobalSettings();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  // Set local user attributes defaults
  const user = reduxUser || {
    fullName: "Staff Member",
    role: "STAFF",
    email: "",
  };

  // Dispatches exit log out actions and clears session
  const handleLogout = () => {
    dispatch(logout());
    navigate("/staff/login");
  };

  const handlePasswordSubmit = (newPassword) => {
    dispatch(updateProfile({ password: newPassword }));
  };

  // Computes display name letters fallback
  const initials = user?.fullName
    ? user.fullName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : "ST";

  return (
    <div className="h-screen flex overflow-hidden bg-slate-50 font-sans">
      {/* Sidebar Navigation Drawer */}
      <StaffSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden md:pl-60">
        {/* Navbar top-bar panel */}
        <header className="h-16 bg-white border-b border-slate-200/80 sticky top-0 z-30 px-6.5 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation sidebar menu"
              className="md:hidden p-1.5 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors border-none bg-transparent"
            >
              <Menu size={20} className="text-slate-600" />
            </button>
            <div className="hidden sm:flex items-center gap-2 text-left">
              <span className="font-display font-bold text-slate-800 text-sm truncate max-w-[150px]">{siteTitle}</span>
              <span className="text-slate-300 font-light text-xs">|</span>
              <span className="text-slate-500 text-xs font-semibold">{user.role} Portal</span>
            </div>
          </div>

          <NavbarSearch portal="staff" />

          <div className="flex items-center gap-4">
            <ThemeSelector portal="portal" />
            <HeaderNotifications />

            {/* Profile Dropdown panel */}
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                aria-label="Open user profile menu"
                className="w-8.5 h-8.5 rounded-full overflow-hidden text-white font-display font-semibold text-xs flex items-center justify-center transition-colors shadow-sm cursor-pointer border-none"
                style={{ backgroundColor: "var(--primary-btn, #4F46E5)" }}
              >
                {user.avatar ? (
                  <img src={user.avatar} alt={`${user.fullName} avatar`} width="34" height="34" className="w-full h-full object-cover" />
                ) : (
                  initials
                )}
              </button>

              {profileDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    aria-hidden="true"
                    onClick={() => setProfileDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2.5 w-60 border rounded-2xl shadow-lg z-50 overflow-hidden bg-white border-slate-100 text-left" role="menu" aria-label="User menu">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                      <p className="text-xs text-slate-400 font-medium">Logged in staff</p>
                      <p className="font-display font-bold text-slate-900 text-sm mt-0.5">{user.fullName}</p>
                      <p className="text-[11px] text-slate-550 font-medium truncate mt-0.5">{user.email}</p>
                    </div>
                    <div className="p-2 space-y-0.5">
                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          navigate("/staff/settings");
                        }}
                        role="menuitem"
                        className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer border-none bg-transparent"
                      >
                        View Profile
                      </button>
                      <button
                        onClick={handleLogout}
                        role="menuitem"
                        className="w-full text-left px-3 py-2 text-xs font-semibold text-red-650 hover:bg-red-50 rounded-lg transition-colors cursor-pointer border-none bg-transparent"
                      >
                        Logout & Exit
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Content Outlet scroll area */}
        <main className="flex-1 overflow-y-auto p-6" role="main">
          <div className="max-w-[68.75rem] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* First Login Password Change Modal Popup */}
      <FirstLoginModal
        isOpen={!!user?.isFirstLogin}
        onSubmit={handlePasswordSubmit}
        loading={loading}
        error={error}
      />
    </div>
  );
}
