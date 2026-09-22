// Frames the dashboard workspace for logged-in clients.
// Coordinates side menus, topbars, and custom brand configurations.


import React, { useState, useEffect, useCallback } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout, updateProfile } from "../slices/authSlice";
import Sidebar from "../components/client/Sidebar";
import FirstLoginModal from "../components/auth/FirstLoginModal";
import * as clientProfileService from "../services/clientProfileService";
import { useGlobalSettings } from "../hooks/useGlobalSettings";
import HeaderNotifications from "../components/layout/HeaderNotifications";
import NavbarSearch from "../components/layout/NavbarSearch";
import ThemeSelector from "../components/layout/ThemeSelector";
import { registerServiceWorker } from "../services/pushNotificationService";
import OptimizedImage from "../components/common/OptimizedImage";

export default function ClientLayout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, loading, error } = useSelector((state) => state.auth);
  const { siteTitle, siteLogo, themeColor } = useGlobalSettings();


  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [profile, setProfile] = useState(null);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await clientProfileService.getClientProfile();
      if (res.success) {
        setProfile(res.data);
      }
    } catch (e) {
      console.error("Failed to load header profile details:", e);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
    registerServiceWorker().catch((err) => {
      console.log("[SW] Registration failed on mount:", err.message);
    });
    window.addEventListener("profileUpdate", fetchProfile);
    return () => {
      window.removeEventListener("profileUpdate", fetchProfile);
    };
  }, [fetchProfile]);

  const initials = user?.fullName
    ? user.fullName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : "CL";

  const toggleSidebar = useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);

  // Destroys active user tokens and redirects to portal landing route
  const handleLogout = useCallback(() => {
    dispatch(logout());
    navigate("/client/login");
  }, [dispatch, navigate]);

  const handlePasswordSubmit = useCallback((newPassword) => {
    dispatch(updateProfile({ password: newPassword }));
  }, [dispatch]);

  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <div className="h-screen flex overflow-hidden" style={{ backgroundColor: "var(--page-bg, #F8FAFC)", color: "var(--page-text, #0F172A)" }}>
      {/* Collapsible Sidebar */}
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-[3.75rem] bg-[var(--bg-navbar)] text-[var(--text-navbar)] border-bottom border-slate-300/60 sticky top-0 z-30 px-6.5 flex items-center justify-between shadow-xs font-sans" role="banner">
          
          {/* Mobile hamburger menu toggle */}
          <div className="flex items-center gap-4">
            <button
              onClick={toggleSidebar}
              aria-label="Open sidebar menu"
              className="md:hidden p-1.5 text-[var(--text-navbar)]/80 hover:bg-[var(--bg-base)] rounded-lg cursor-pointer transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            
            {/* Breadcrumbs */}
            <div className="hidden sm:flex items-center gap-2">
              <span className="font-display font-bold text-[var(--text-navbar)] text-sm truncate max-w-[180px]" title={siteTitle}>
                {siteTitle}
              </span>
              <span className="text-slate-300 font-light text-xs">|</span>
              <span className="text-[var(--text-navbar)] text-xs font-bold">{profile?.company || user?.company || "Independent"}</span>
            </div>
          </div>

          <NavbarSearch portal="client" />

          {/* Right Header Navigation Panel */}
          <div className="flex items-center gap-4">
            <ThemeSelector portal="portal" />
            {/* Dynamic Notifications Dropdown */}
            <HeaderNotifications />

            {/* Profile Dropdown Trigger */}
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                aria-label="Open user profile menu"
                className="w-8.5 h-8.5 rounded-full overflow-hidden text-white font-display font-semibold text-xs flex items-center justify-center transition-colors shadow-sm cursor-pointer"
                style={{ backgroundColor: "var(--primary-btn, #4F46E5)", border: "2px solid var(--primary-btn, #4F46E5)", boxShadow: "0 0 0 2px rgba(var(--primary-btn-rgb, 79, 70, 229), 0.2)" }}
              >

                {profile?.avatar ? (
                  <OptimizedImage src={profile.avatar} alt={`${profile?.fullName || 'User'} avatar`} width={34} height={34} className="rounded-full object-cover" />
                ) : (
                  getInitials(profile?.fullName || user?.fullName)
                )}
              </button>

              {profileDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    aria-hidden="true"
                    onClick={() => setProfileDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2.5 w-60 border rounded-2xl shadow-lg z-50 overflow-hidden animate-fade-in" style={{ backgroundColor: "var(--card-bg, #FFFFFF)", borderColor: "var(--border-color, rgba(226,232,240,0.9))" }} role="menu" aria-label="User menu">
                    <div className="p-4 border-b" style={{ borderColor: "var(--border-color, #F1F5F9)", backgroundColor: "var(--page-bg, rgba(248,250,252,0.5))" }}>
                      <p className="text-xs text-slate-400 font-medium">Logged in client</p>
                      <p className="font-display font-bold text-slate-900 text-sm mt-0.5">{profile?.fullName || user?.fullName || "User"}</p>
                      <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">{profile?.email || user?.email || ""}</p>
                    </div>
                    <div className="p-2 space-y-0.5">
                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          navigate("/client/settings?tab=profile");
                        }}
                        role="menuitem"
                        className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                      >
                        View Profile
                      </button>
                      <button
                        onClick={handleLogout}
                        role="menuitem"
                        className="w-full text-left px-3 py-2 text-xs font-semibold text-danger hover:bg-danger-light/30 rounded-lg transition-colors cursor-pointer"
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
        <main className="flex-1 overflow-y-auto bg-base p-6" role="main">
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
