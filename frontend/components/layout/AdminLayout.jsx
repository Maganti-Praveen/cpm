// Frames the workspace for administrative tools.
// Manages sidebars transitions and topbars alignments.
// Enforces password change on first login.

import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import FirstLoginModal from '../auth/FirstLoginModal';
import { updateProfile } from '../../slices/authSlice';
import { registerServiceWorker } from '../../services/pushNotificationService';

function AdminLayout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, loading, error } = useSelector((state) => state.auth);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    registerServiceWorker().catch((err) => {
      console.log("[SW] Registration failed on mount:", err.message);
    });
  }, []);

  const handlePasswordSubmit = (newPassword) => {
    dispatch(updateProfile({ password: newPassword }));
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--page-bg, #F8FAFC)", color: "var(--page-text, #0F172A)" }}>
      {/* Mobile Sidebar Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 md:hidden"
          aria-hidden="true"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />
      <Topbar onMenuClick={() => setIsSidebarOpen(true)} />
      
      <main className="ml-0 md:ml-60 pt-16 transition-all duration-300" role="main">
        <div className="p-4 md:p-6">
          <React.Suspense fallback={<div className="flex h-[50vh] items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-slate-200 border-t-slate-800 rounded-full"></div></div>}>
            <Outlet />
          </React.Suspense>
        </div>
      </main>

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

export default AdminLayout;
