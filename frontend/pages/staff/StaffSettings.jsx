// This file renders the settings dashboard panel for portal staff members.
// It supports profile details modifications, custom theme selection, 2FA, and push subscription.

import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { updateProfile } from "../../slices/authSlice";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../context/ToastContext";
import { Camera, Loader2, RefreshCw } from "lucide-react";
import { getSubscriptionStatus, subscribeUserToPush, unsubscribeUserFromPush, registerServiceWorker } from "../../services/pushNotificationService";
import CameraCaptureModal from "../../components/common/CameraCaptureModal";
import AvatarSelectionModal from "../../components/common/AvatarSelectionModal";
import API from "../../services/api";

export default function StaffSettings() {
  const dispatch = useDispatch();
  const { showToast } = useToast();
  const { user: reduxUser } = useSelector((state) => state.auth);
  const { themes, saveTheme } = useTheme();

  const user = reduxUser || {
    fullName: "Staff Member",
    role: "STAFF",
    email: "",
    themeId: "",
  };

  const [activeSettingsTab, setActiveSettingsTab] = useState("profile");
  const [profileName, setProfileName] = useState(user.fullName || "");
  const [profileEmail, setProfileEmail] = useState(user.email || "");
  const [profileAvatar, setProfileAvatar] = useState(user.avatar || "");
  const [selectedUserThemeId, setSelectedUserThemeId] = useState(user.themeId || "");
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isSelectionOpen, setIsSelectionOpen] = useState(false);
  const [renderLazy, setRenderLazy] = useState(false);

  useEffect(() => {
    const id = typeof window.requestIdleCallback === 'function'
      ? window.requestIdleCallback(() => setRenderLazy(true), { timeout: 200 })
      : setTimeout(() => setRenderLazy(true), 80);
    return () => {
      if (typeof window.cancelIdleCallback === 'function') window.cancelIdleCallback(id);
      else clearTimeout(id);
    };
  }, []);

  // Security Tab States
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [isClearingCache, setIsClearingCache] = useState(false);

  // Push Notifications Settings State
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);

  // Register push service worker and retrieve existing active sub status
  useEffect(() => {
    registerServiceWorker().catch((err) => {
      console.log("[SW] Registration failed on mount:", err.message);
    });

    const checkPushStatus = async () => {
      const status = await getSubscriptionStatus();
      if (status.supported && status.enabled && status.permission === "granted") {
        setPushEnabled(true);
      } else {
        setPushEnabled(false);
      }
    };
    checkPushStatus();
  }, []);

  // Sync settings when reduxUser changes
  useEffect(() => {
    if (reduxUser) {
      setProfileName(reduxUser.fullName || "");
      setProfileEmail(reduxUser.email || "");
      setTwoFactorEnabled(reduxUser.twoFactorEnabled || false);
      setProfileAvatar(reduxUser.avatar || "");
      setSelectedUserThemeId(reduxUser.themeId || "");
    }
  }, [reduxUser]);

  // Registers or deletes browser notification subscription configurations
  const handlePushToggle = async () => {
    setPushLoading(true);
    try {
      if (pushEnabled) {
        const success = await unsubscribeUserFromPush();
        if (success) {
          setPushEnabled(false);
          showToast("Push notifications disabled successfully.", "success");
        } else {
          showToast("Failed to disable push notifications.", "error");
        }
      } else {
        const success = await subscribeUserToPush();
        if (success) {
          setPushEnabled(true);
          showToast("Push notifications enabled successfully!", "success");
        } else {
          showToast("Failed to enable push notifications.", "error");
        }
      }
    } catch (error) {
      console.error(error);
      showToast(error.message || "Failed to update push settings.", "error");
    } finally {
      setPushLoading(false);
    }
  };

  // Reads avatar uploads and converts to base64 encoding format
  const handleStaffAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("Only image files are allowed.", "error");
      e.target.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      showToast("Avatar image file size must be under 2MB.", "error");
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setProfileAvatar(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Dispatches update profiles actions to sync with database
  const handleProfileSave = async (e) => {
    e.preventDefault();
    if (!profileName.trim() || !profileEmail.trim()) {
      showToast("Name and Email cannot be empty.", "error");
      return;
    }
    try {
      const resultAction = await dispatch(updateProfile({ fullName: profileName, email: profileEmail, avatar: profileAvatar }));
      if (updateProfile.fulfilled.match(resultAction)) {
        if (selectedUserThemeId !== (reduxUser?.themeId || "")) {
          await saveTheme(selectedUserThemeId);
        }
        showToast("Profile updated successfully!", "success");
      } else {
        showToast(resultAction.payload || "Failed to update profile.", "error");
      }
    } catch (err) {
      showToast("An unexpected error occurred.", "error");
    }
  };

  // Dispatches new passwords values configurations safely
  const handleSecuritySave = async (e) => {
    e.preventDefault();
    if (!newPassword) {
      showToast("Password cannot be empty.", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast("Passwords do not match.", "error");
      return;
    }
    try {
      const resultAction = await dispatch(updateProfile({ password: newPassword }));
      if (updateProfile.fulfilled.match(resultAction)) {
        showToast("Password updated successfully!", "success");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        showToast(resultAction.payload || "Failed to update password.", "error");
      }
    } catch (err) {
      showToast("An unexpected error occurred.", "error");
    }
  };

  // Enables or disables two factor options on profile updates
  const handle2FAToggle = async (checked) => {
    try {
      const resultAction = await dispatch(updateProfile({ twoFactorEnabled: checked }));
      if (updateProfile.fulfilled.match(resultAction)) {
        showToast(`Two-Factor Authentication ${checked ? "enabled" : "disabled"} successfully!`, "success");
        setTwoFactorEnabled(checked);
      } else {
        showToast(resultAction.payload || "Failed to update Two-Factor Authentication settings.", "error");
      }
    } catch (err) {
      showToast("An unexpected error occurred.", "error");
    }
  };

  return (
    <div className="space-y-6 max-w-4xl text-left">
      {/* Header */}
      <div className="space-y-1">
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">System Settings</h2>
        <p className="text-sm text-slate-500 font-normal">Manage your profile, security credentials, notification channels, and portal layout options.</p>
      </div>

      {/* Tab Selector Layout */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row min-h-[500px]">
        <nav role="tablist" aria-label="Settings navigation" className="w-full md:w-64 border-b md:border-b-0 md:border-r border-slate-200 bg-slate-50/50 p-4 space-y-1">
          <button
            role="tab"
            aria-selected={activeSettingsTab === "profile"}
            onClick={() => setActiveSettingsTab("profile")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-150 cursor-pointer border-none bg-transparent ${activeSettingsTab === "profile"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                : "text-slate-500 hover:bg-slate-200/50 hover:text-slate-800"
              }`}
          >
            <svg className="w-4.5 h-4.5" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span>My Profile</span>
          </button>

          <button
            role="tab"
            aria-selected={activeSettingsTab === "security"}
            onClick={() => setActiveSettingsTab("security")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-150 cursor-pointer border-none bg-transparent ${activeSettingsTab === "security"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                : "text-slate-500 hover:bg-slate-200/50 hover:text-slate-800"
              }`}
          >
            <svg className="w-4.5 h-4.5" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>Security</span>
          </button>
          <button
            role="tab"
            aria-selected={activeSettingsTab === "cache"}
            onClick={() => setActiveSettingsTab("cache")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-150 cursor-pointer border-none bg-transparent ${activeSettingsTab === "cache"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                : "text-slate-500 hover:bg-slate-200/50 hover:text-slate-800"
              }`}
          >
            <RefreshCw className="w-4.5 h-4.5" />
            <span>Cache Settings</span>
          </button>
        </nav>

        {/* Right Form segment */}
        <div className="flex-1 p-6 sm:p-8 bg-white">
          {!renderLazy ? (
            <div className="space-y-6 animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-1/4" />
              <div className="h-10 bg-slate-200 rounded w-full" />
              <div className="h-10 bg-slate-200 rounded w-full" />
            </div>
          ) : (
            <>
              {/* TAB 1: Profile settings */}
              {activeSettingsTab === "profile" && (
                <form onSubmit={handleProfileSave} className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Profile Information</h3>
                <p className="text-xs text-slate-400 mt-1">Configure your personal public-facing portal details here.</p>
              </div>

              {/* Profile Picture Upload Section */}
              <div className="flex items-center gap-5 pb-6 border-b border-slate-200/50">
                <div className="relative group cursor-pointer" onClick={() => setIsSelectionOpen(true)}>
                  {profileAvatar ? (
                    <img 
                      src={profileAvatar} 
                      alt="Staff avatar" 
                      width="80"
                      height="80"
                      className="w-20 h-20 rounded-full object-cover border-2 border-slate-100 shadow-sm"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-indigo-600 text-white font-display font-bold text-xl flex items-center justify-center shadow-sm">
                      {profileName ? profileName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "ST"}
                    </div>
                  )}
                  
                  {/* Camera hover icon trigger */}
                  <div className="absolute inset-0 bg-slate-900/50 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer">
                    <Camera className="w-5 h-5" />
                  </div>
                </div>
                <input 
                  type="file" 
                  id="staff-avatar-input" 
                  accept="image/*" 
                  onChange={handleStaffAvatarChange} 
                  className="hidden" 
                />

                <div className="text-left">
                  <button
                    type="button"
                    onClick={() => setIsSelectionOpen(true)}
                    className="px-3.5 py-1.5 border border-slate-200 hover:border-slate-350 text-slate-700 text-xs font-bold rounded-xl cursor-pointer shadow-xs transition-all hover:bg-slate-50 bg-white"
                  >
                    Change Photo
                  </button>
                  <p className="text-[11px] text-slate-455 mt-1.5 font-medium">
                    JPG or PNG. Max size of 2MB.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label htmlFor="staff-full-name" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Full Name</label>
                  <input
                    id="staff-full-name"
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    placeholder="Staff Member"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                    required
                    aria-label="Full name"/>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="staff-email" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
                  <input
                    id="staff-email"
                    type="email"
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    placeholder="staff@gmail.com"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                    required
                    aria-label="Email address"/>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="staff-role" className="text-[11px] font-bold text-slate-550 uppercase tracking-wider">Assigned Role</label>
                  <input
                    id="staff-role"
                    type="text"
                    value={user.role}
                    disabled
                    aria-label="Assigned role (read-only)"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-100 text-slate-400 select-none outline-none"/>
                </div>

                <div className="space-y-1.5 font-sans">
                  <label htmlFor="staff-theme-select" className="text-[11px] font-bold text-slate-555 uppercase tracking-wider block text-left">My Theme</label>
                  <select
                    id="staff-theme-select"
                    value={selectedUserThemeId}
                    onChange={(e) => setSelectedUserThemeId(e.target.value)}
                    aria-label="Select portal theme"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-body font-medium cursor-pointer">
                    <option value="">Default (Site Branding Color)</option>
                    {themes.map((theme) => (
                      <option key={theme.id} value={theme.id}>
                        {theme.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Push Notifications Toggle */}
                <div className="space-y-1.5 font-sans text-left">
                  <label htmlFor="staff-push-toggle" className="text-[11px] font-bold text-slate-555 uppercase tracking-wider block">Push Notifications</label>
                  <div className="flex items-center gap-3 mt-2.5">
                    <button
                      id="staff-push-toggle"
                      type="button"
                      onClick={handlePushToggle}
                      disabled={pushLoading}
                      aria-label={pushEnabled ? "Disable push notifications" : "Enable push notifications"}
                      aria-pressed={pushEnabled}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                        pushEnabled ? "bg-indigo-600" : "bg-slate-200"
                      } ${pushLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          pushEnabled ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                    <span className="text-xs font-semibold text-slate-600">
                      {pushLoading ? "Updating..." : pushEnabled ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-md hover:shadow-indigo-600/10 cursor-pointer border-none transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: Security settings */}
          {activeSettingsTab === "security" && (
            <form onSubmit={handleSecuritySave} className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Security & Credentials</h3>
                <p className="text-xs text-slate-400 mt-1">Update your password to keep your Sai IT Services portal account secure.</p>
              </div>

              <div className="pb-5 border-b border-slate-100 max-w-md">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Two-Factor Authentication</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">Secure your account with two-factor authentication.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        id="staff-2fa-toggle"
                        type="checkbox"
                        checked={twoFactorEnabled}
                        onChange={(e) => handle2FAToggle(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-350 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#4F46E5]"></div>
                    </label>
                    <span className="text-xs font-bold text-slate-600">
                      {twoFactorEnabled ? "ON" : "OFF"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-5 max-w-md">
                <div className="space-y-1.5">
                  <label htmlFor="staff-new-password" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">New Password</label>
                  <input
                    id="staff-new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    aria-label="New password"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                    required/>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="staff-confirm-password" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Confirm New Password</label>
                  <input
                    id="staff-confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    aria-label="Confirm new password"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                    required/>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-md hover:shadow-indigo-600/10 cursor-pointer border-none transition-colors"
                >
                  Update Password
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: Cache Settings */}
          {activeSettingsTab === "cache" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Cache Settings</h3>
                <p className="text-xs text-slate-400 mt-1">Flush system cached data immediately.</p>
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                <div>
                  <p className="text-sm font-semibold text-slate-800">Clear All Cache</p>
                  <p className="text-xs text-slate-400 mt-0.5">Flush all cached data from Redis. Next requests will rebuild the cache.</p>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    setIsClearingCache(true);
                    try {
                      await API.delete("/cache/flush");
                      showToast("All cache cleared successfully!", "success");
                    } catch (err) {
                      showToast("Failed to clear cache. Please try again.", "error");
                    } finally {
                      setIsClearingCache(false);
                    }
                  }}
                  disabled={isClearingCache}
                  className="inline-flex items-center gap-2 h-9 px-4 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                >
                  {isClearingCache ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <RefreshCw size={14} />
                  )}
                  {isClearingCache ? "Clearing..." : "Clear Cache"}
                </button>
              </div>
            </div>
              )}
            </>
          )}
        </div>
      </div>
      <CameraCaptureModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={(img) => setProfileAvatar(img)}
      />
      <AvatarSelectionModal
        isOpen={isSelectionOpen}
        onClose={() => setIsSelectionOpen(false)}
        onTakeActive={() => setIsCameraOpen(true)}
        onChooseFile={() => document.getElementById("staff-avatar-input").click()}
        onRemove={() => setProfileAvatar("")}
        hasPhoto={!!profileAvatar}
      />
    </div>
  );
}
