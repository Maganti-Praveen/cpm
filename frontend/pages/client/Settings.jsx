// Self-service settings for clients to edit profiles and setup MFA.
// Coordinates login edits.


import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { 
  User, 
  Phone, 
  Mail, 
  Lock, 
  Camera, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  RefreshCw
} from "lucide-react";
import * as clientProfileService from "../../services/clientProfileService";
import { useTheme } from "../../context/ThemeContext";
import { getSubscriptionStatus, subscribeUserToPush, unsubscribeUserFromPush } from "../../services/pushNotificationService";
import CameraCaptureModal from "../../components/common/CameraCaptureModal";
import AvatarSelectionModal from "../../components/common/AvatarSelectionModal";
import API from "../../services/api";

export default function ClientSettings() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("profile"); // 'profile' or 'security'
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isSelectionOpen, setIsSelectionOpen] = useState(false);

  const [isClearingCache, setIsClearingCache] = useState(false);
  const [cacheSuccess, setCacheSuccess] = useState("");
  const [cacheError, setCacheError] = useState("");

  const { themes, saveTheme } = useTheme();
  const [selectedUserThemeId, setSelectedUserThemeId] = useState("");

  // Push Notifications Settings State
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);

  useEffect(() => {
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

  const handlePushToggle = async () => {
    setPushLoading(true);
    setProfileErrors({});
    setProfileSuccess("");
    try {
      if (pushEnabled) {
        const success = await unsubscribeUserFromPush();
        if (success) {
          setPushEnabled(false);
          setProfileSuccess("Push notifications disabled successfully.");
        } else {
          setProfileErrors({ global: "Failed to disable push notifications." });
        }
      } else {
        const success = await subscribeUserToPush();
        if (success) {
          setPushEnabled(true);
          setProfileSuccess("Push notifications enabled successfully!");
        } else {
          setProfileErrors({ global: "Failed to enable push notifications." });
        }
      }
    } catch (error) {
      console.error(error);
      setProfileErrors({ global: error.message || "Failed to update push settings." });
    } finally {
      setPushLoading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get("tab");
    if (tabParam && ["profile", "security"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [location]);

  // Profile Form State
  const [profileData, setProfileData] = useState({
    fullName: "",
    email: "",
    phone: "",
    company: "",
    avatar: "",
    twoFactorEnabled: false
  });
  const [initialProfileData, setInitialProfileData] = useState({});
  const [profileErrors, setProfileErrors] = useState({});
  const [profileSuccess, setProfileSuccess] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);

  // Password Form State
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: ""
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Load profile on mount
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setProfileLoading(true);
    try {
      const res = await clientProfileService.getClientProfile();
      if (res.success && res.data) {
        const data = {
          fullName: res.data.fullName || "",
          email: res.data.email || "",
          phone: res.data.phone || "",
          company: res.data.company || "",
          avatar: res.data.avatar || "",
          twoFactorEnabled: res.data.twoFactorEnabled || false,
          themeId: res.data.themeId || ""
        };
        setProfileData(data);
        setInitialProfileData(data);
        setSelectedUserThemeId(res.data.themeId || "");
      }
    } catch (err) {
      console.error("Failed to load profile:", err);
    } finally {
      setProfileLoading(false);
    }
  };

  // Profile inputs validation
  const validateProfile = () => {
    const errors = {};
    if (!profileData.fullName.trim()) {
      errors.fullName = "Full Name is required.";
    }
    
    if (!profileData.email.trim()) {
      errors.email = "Email address is required.";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(profileData.email)) {
        errors.email = "Please enter a valid email address.";
      }
    }

    if (profileData.phone.trim()) {
      const phoneRegex = /^\+?[0-9\s\-()]{7,16}$/;
      if (!phoneRegex.test(profileData.phone)) {
        errors.phone = "Please enter a valid phone number.";
      }
    }

    setProfileErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Password validation
  const validatePassword = () => {
    const errors = {};
    if (!passwordData.currentPassword) {
      errors.currentPassword = "Current password is required.";
    }
    if (!passwordData.newPassword) {
      errors.newPassword = "New password is required.";
    } else if (passwordData.newPassword.length < 8) {
      errors.newPassword = "Password must be at least 8 characters.";
    }
    if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      errors.confirmNewPassword = "Passwords do not match.";
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle Profile Save
  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileSuccess("");
    if (!validateProfile()) return;

    setProfileLoading(true);
    try {
      const res = await clientProfileService.updateClientProfile(profileData);
      if (res.success) {
        if (selectedUserThemeId !== (initialProfileData.themeId || "")) {
          await saveTheme(selectedUserThemeId);
        }
        setProfileSuccess("Profile updated successfully!");
        setInitialProfileData({ ...profileData, themeId: selectedUserThemeId });
        // Refresh page header avatar if any listeners exist or just update locally
        window.dispatchEvent(new Event("profileUpdate"));
      } else {
        setProfileErrors({ global: res.message || "Failed to update profile." });
      }
    } catch (err) {
      setProfileErrors({ global: err.message || "An unexpected error occurred." });
    } finally {
      setProfileLoading(false);
    }
  };

  // Reset Profile changes
  const handleProfileCancel = () => {
    setProfileData(initialProfileData);
    setSelectedUserThemeId(initialProfileData.themeId || "");
    setProfileErrors({});
    setProfileSuccess("");
  };

  // Handle Profile Image change (Base64)
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      const msg = "Only image files are allowed.";
      setProfileErrors({ avatar: msg });
      showToast(msg, "error");
      e.target.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) { // 2MB limit
      const msg = "Avatar image file size must be under 2MB.";
      setProfileErrors({ avatar: msg });
      showToast(msg, "error");
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setProfileData(prev => ({ ...prev, avatar: reader.result }));
      setProfileErrors(prev => ({ ...prev, avatar: null }));
    };
    reader.readAsDataURL(file);
  };

  const handle2FAToggle = async (checked) => {
    try {
      setPasswordSuccess("");
      setPasswordErrors({});
      const res = await clientProfileService.updateClientProfile({
        ...profileData,
        twoFactorEnabled: checked
      });
      if (res.success) {
        setProfileData(prev => ({ ...prev, twoFactorEnabled: checked }));
        setInitialProfileData(prev => ({ ...prev, twoFactorEnabled: checked }));
        setPasswordSuccess(`Two-Factor Authentication ${checked ? "enabled" : "disabled"} successfully.`);
      } else {
        setPasswordErrors({ global: res.message || "Failed to update Two-Factor Authentication." });
      }
    } catch (err) {
      setPasswordErrors({ global: err.message || "An unexpected error occurred." });
    }
  };

  // Handle Password Update
  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setPasswordSuccess("");
    if (!validatePassword()) return;

    setPasswordLoading(true);
    try {
      const res = await clientProfileService.changePassword(passwordData);
      if (res.success) {
        setPasswordSuccess("Password updated successfully.");
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmNewPassword: ""
        });
        setPasswordErrors({});
      } else {
        setPasswordErrors({ global: res.message || "Failed to update password." });
      }
    } catch (err) {
      setPasswordErrors({ global: err.message || "An error occurred while updating password." });
    } finally {
      setPasswordLoading(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return "NA";
    return name
      .split(" ")
      .map(w => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Title Header Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/85 shadow-sm">
        <h1 className="font-display font-extrabold text-slate-900 text-xl tracking-tight">Portal Settings</h1>
        <p className="text-slate-500 text-sm mt-1">
          Manage your personal details, contact coordinates, and security configurations.
        </p>
      </div>

      {/* Settings Panel Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        
        {/* Navigation Tabs (Vertical Stack on Mobile & Desktop) */}
        <nav role="tablist" aria-label="Settings navigation" className="md:col-span-1 bg-white p-2 rounded-2xl border border-slate-200/85 shadow-xs flex flex-col gap-1.5 shrink-0">
          <button
            role="tab"
            id="tab-profile"
            aria-selected={activeTab === "profile"}
            aria-controls="panel-profile"
            onClick={() => setActiveTab("profile")}
            className={`flex items-center justify-start gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer whitespace-nowrap ${
              activeTab === "profile"
                ? "bg-primary-light text-primary shadow-xs"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <User size={16} />
            <span>Profile Information</span>
          </button>
          
          <button
            role="tab"
            id="tab-security"
            aria-selected={activeTab === "security"}
            aria-controls="panel-security"
            onClick={() => setActiveTab("security")}
            className={`flex items-center justify-start gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer whitespace-nowrap ${
              activeTab === "security"
                ? "bg-primary-light text-primary shadow-xs"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <Lock size={16} />
            <span>Security &amp; Password</span>
          </button>
          <button
            role="tab"
            id="tab-cache"
            aria-selected={activeTab === "cache"}
            aria-controls="panel-cache"
            onClick={() => {
              setActiveTab("cache");
              setCacheSuccess("");
              setCacheError("");
            }}
            className={`flex items-center justify-start gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer whitespace-nowrap ${
              activeTab === "cache"
                ? "bg-primary-light text-primary shadow-xs"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <RefreshCw size={16} />
            <span>Cache Settings</span>
          </button>
        </nav>

        {/* Form panel container */}
        <div className="md:col-span-3">
          
          {/* TAB 1: Profile Settings */}
          {activeTab === "profile" && (
            <form onSubmit={handleProfileSave} role="tabpanel" id="panel-profile" aria-labelledby="tab-profile" className="bg-white rounded-2xl border border-slate-200/85 shadow-sm overflow-hidden divide-y divide-slate-100">
              {/* Header */}
              <div className="p-6">
                <h2 className="font-display font-bold text-slate-900 text-base">Profile Information</h2>
                <p className="text-slate-400 text-xs mt-0.5">Update your visual profile, name, and contact fields.</p>
              </div>

              {/* Body */}
              <div className="p-6 space-y-6">
                
                {/* Alerts */}
                {profileSuccess && (
                  <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl px-4 py-3 text-xs font-semibold flex items-center gap-2.5">
                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                    <span>{profileSuccess}</span>
                  </div>
                )}
                {profileErrors.global && (
                  <div className="bg-rose-50 border border-rose-100 text-rose-700 rounded-xl px-4 py-3 text-xs font-semibold flex items-center gap-2.5">
                    <AlertCircle size={16} className="text-rose-500 shrink-0" />
                    <span>{profileErrors.global}</span>
                  </div>
                )}

                {/* Profile Picture Upload Section */}
                <div className="flex flex-col sm:flex-row items-center gap-5 pb-4">
                  <button 
                    type="button" 
                    onClick={() => setIsSelectionOpen(true)}
                    className="relative cursor-pointer group focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-full border-none bg-transparent p-0"
                    aria-label="Change profile picture"
                  >
                    {profileData.avatar ? (
                      <img 
                        src={profileData.avatar} 
                        alt="Profile avatar" 
                        width="80"
                        height="80"
                        className="w-20 h-20 rounded-full object-cover border-2 border-slate-100/50 shadow-sm"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-indigo-600 text-white font-display font-bold text-xl flex items-center justify-center shadow-sm">
                        {getInitials(profileData.fullName)}
                      </div>
                    )}
                    
                    {/* Camera trigger badge */}
                    <div 
                      className="absolute bottom-0 right-0 w-7 h-7 bg-primary text-white border-2 border-white rounded-full flex items-center justify-center shadow-md hover:bg-primary-dark hover:scale-105 transition-all duration-200 cursor-pointer"
                      aria-hidden="true"
                    >
                      <Camera size={13} />
                    </div>
                  </button>
                  <input 
                    type="file" 
                    id="avatar-file" 
                    accept="image/*" 
                    onChange={handleAvatarChange} 
                    className="hidden" 
                    aria-label="Upload profile photo file"
                  />

                  <div className="text-center sm:text-left space-y-1">
                    <button 
                      type="button"
                      onClick={() => setIsSelectionOpen(true)}
                      className="px-3.5 py-1.5 border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-bold rounded-xl cursor-pointer shadow-xs transition-all hover:bg-slate-50 bg-white"
                    >
                      Change Photo
                    </button>
                    <p className="text-[11px] text-slate-400 font-medium mt-1">
                      JPG or PNG. Max size of 2MB.
                    </p>
                    {profileErrors.avatar && (
                      <p className="text-rose-600 text-[11px] font-bold mt-1">{profileErrors.avatar}</p>
                    )}
                  </div>
                </div>

                {/* Profile inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <label htmlFor="fullName" className="block text-slate-700 text-xs font-bold">Full Name</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                        <User size={15} />
                      </span>
                      <input 
                        id="fullName"
                        type="text" 
                        value={profileData.fullName}
                        onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                        placeholder="John Doe" 
                        className={`w-full h-[2.5rem] pl-10 pr-3.5 text-xs bg-white border ${profileErrors.fullName ? 'border-rose-400 focus:ring-rose-100' : 'border-slate-200 focus:border-primary focus:ring-primary-light'} text-slate-900 rounded-xl outline-none focus:ring-4 transition-all placeholder-slate-400 font-medium`}
                      />
                    </div>
                    {profileErrors.fullName && (
                      <p className="text-rose-600 text-[11px] font-bold">{profileErrors.fullName}</p>
                    )}
                  </div>

                  {/* Company (ReadOnly) */}
                  <div className="space-y-1.5">
                    <label htmlFor="managedCompany" className="block text-slate-400 text-xs font-bold">Company (Managed)</label>
                    <div className="relative">
                      <input 
                        id="managedCompany"
                        type="text" 
                        value={profileData.company || "Independent"} 
                        disabled
                        className="w-full h-[2.5rem] px-3.5 text-xs bg-slate-50 border border-slate-200 text-slate-400 rounded-xl outline-none font-medium cursor-not-allowed"
                      />
                    </div>
                  </div>

                  {/* Contact Email */}
                  <div className="space-y-1.5">
                    <label htmlFor="contactEmail" className="block text-slate-700 text-xs font-bold">Contact Email</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                        <Mail size={15} />
                      </span>
                      <input 
                        id="contactEmail"
                        type="email" 
                        value={profileData.email}
                        onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                        placeholder="john@example.com" 
                        className={`w-full h-[2.5rem] pl-10 pr-3.5 text-xs bg-white border ${profileErrors.email ? 'border-rose-400 focus:ring-rose-100' : 'border-slate-200 focus:border-primary focus:ring-primary-light'} text-slate-900 rounded-xl outline-none focus:ring-4 transition-all placeholder-slate-400 font-medium`}
                      />
                    </div>
                    {profileErrors.email && (
                      <p className="text-rose-600 text-[11px] font-bold">{profileErrors.email}</p>
                    )}
                  </div>

                  {/* Contact Number */}
                  <div className="space-y-1.5">
                    <label htmlFor="contactNumber" className="block text-slate-700 text-xs font-bold">Contact Number</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                        <Phone size={15} />
                      </span>
                      <input 
                        id="contactNumber"
                        type="text" 
                        value={profileData.phone}
                        onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                        placeholder="+91 98765 43210" 
                        className={`w-full h-[2.5rem] pl-10 pr-3.5 text-xs bg-white border ${profileErrors.phone ? 'border-rose-400 focus:ring-rose-100' : 'border-slate-200 focus:border-primary focus:ring-primary-light'} text-slate-900 rounded-xl outline-none focus:ring-4 transition-all placeholder-slate-400 font-medium`}
                      />
                    </div>
                    {profileErrors.phone && (
                      <p className="text-rose-600 text-[11px] font-bold">{profileErrors.phone}</p>
                    )}
                  </div>

                  {/* My Theme Dropdown */}
                  <div className="space-y-1.5 text-left">
                    <label htmlFor="client-theme-select" className="block text-slate-700 text-xs font-bold">My Theme</label>
                    <select
                      id="client-theme-select"
                      value={selectedUserThemeId}
                      onChange={(e) => setSelectedUserThemeId(e.target.value)}
                      className="w-full h-[2.5rem] px-3.5 text-xs bg-white border border-slate-200 focus:border-primary focus:ring-primary-light text-slate-900 rounded-xl outline-none focus:ring-4 transition-all font-medium cursor-pointer"
                    >
                      <option value="">Default (Site Branding Color)</option>
                      {themes.map((theme) => (
                        <option key={theme.id} value={theme.id}>
                          {theme.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Push Notifications Toggle */}
                  <div className="space-y-1.5 text-left">
                    <label htmlFor="client-push-toggle" className="block text-slate-700 text-xs font-bold">Push Notifications</label>
                    <div className="flex items-center gap-3 mt-2">
                      <button
                        id="client-push-toggle"
                        type="button"
                        onClick={handlePushToggle}
                        disabled={pushLoading}
                        aria-label={pushEnabled ? "Disable push notifications" : "Enable push notifications"}
                        aria-pressed={pushEnabled}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:ring-offset-2 ${
                          pushEnabled ? "bg-[#4F46E5]" : "bg-slate-200"
                        } ${pushLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            pushEnabled ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                      <span className="text-xs font-semibold text-[#475569]">
                        {pushLoading ? "Updating..." : pushEnabled ? "Enabled" : "Disabled"}
                      </span>
                    </div>
                  </div>
                  
                </div>

              </div>

              {/* Action buttons */}
              <div className="p-4 bg-slate-50/50 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleProfileCancel}
                  className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer shadow-xs hover:bg-slate-100/50 transition-all shrink-0"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={profileLoading}
                  className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs hover:bg-primary-dark transition-all flex items-center gap-1.5 shrink-0"
                >
                  {profileLoading ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: Change Password Security Settings */}
          {activeTab === "security" && (
            <form onSubmit={handlePasswordUpdate} role="tabpanel" id="panel-security" aria-labelledby="tab-security" className="bg-white rounded-2xl border border-slate-200/85 shadow-sm overflow-hidden divide-y divide-slate-100">
              {/* Header */}
              <div className="p-6">
                <h2 className="font-display font-bold text-slate-900 text-base">Security &amp; Password</h2>
                <p className="text-slate-400 text-xs mt-0.5">Ensure your portal account remains secure by keeping your credentials updated.</p>
              </div>

              {/* Body */}
              <div className="p-6 space-y-5">
                
                {/* Alerts */}
                {passwordSuccess && (
                  <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl px-4 py-3 text-xs font-semibold flex items-center gap-2.5">
                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                    <span>{passwordSuccess}</span>
                  </div>
                )}
                {passwordErrors.global && (
                  <div className="bg-rose-50 border border-rose-100 text-rose-700 rounded-xl px-4 py-3 text-xs font-semibold flex items-center gap-2.5">
                    <AlertCircle size={16} className="text-rose-500 shrink-0" />
                    <span>{passwordErrors.global}</span>
                  </div>
                )}

                {/* Two-Factor Authentication Toggle */}
                <div className="pb-5 border-b border-slate-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 id="2fa-label" className="text-xs font-bold text-slate-800 uppercase tracking-wider">Two-Factor Authentication</h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">Secure your account with two-factor authentication.</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <label htmlFor="client-2fa-toggle" className="relative inline-flex items-center cursor-pointer">
                        <input
                          id="client-2fa-toggle"
                          type="checkbox"
                          checked={profileData.twoFactorEnabled || false}
                          onChange={(e) => handle2FAToggle(e.target.checked)}
                          className="sr-only peer"
                          aria-labelledby="2fa-label"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                      <span className="text-xs font-bold text-slate-600">
                        {profileData.twoFactorEnabled ? "ON" : "OFF"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Current Password */}
                <div className="space-y-1.5">
                  <label htmlFor="currentPassword" className="block text-slate-700 text-xs font-bold">Current Password</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                      <Lock size={15} />
                    </span>
                    <input 
                      id="currentPassword"
                      type="password" 
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      placeholder="••••••••" 
                      aria-label="Current Password"
                      className={`w-full h-[2.5rem] pl-10 pr-3.5 text-xs bg-white border ${passwordErrors.currentPassword ? 'border-rose-400 focus:ring-rose-100' : 'border-slate-200 focus:border-primary focus:ring-primary-light'} text-slate-900 rounded-xl outline-none focus:ring-4 transition-all placeholder-slate-400 font-medium`}
                    />
                  </div>
                  {passwordErrors.currentPassword && (
                    <p className="text-rose-600 text-[11px] font-bold">{passwordErrors.currentPassword}</p>
                  )}
                </div>

                {/* New Password */}
                <div className="space-y-1.5">
                  <label htmlFor="newPassword" className="block text-slate-700 text-xs font-bold">New Password</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                      <Lock size={15} />
                    </span>
                    <input 
                      id="newPassword"
                      type="password" 
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      placeholder="••••••••" 
                      aria-label="New Password"
                      className={`w-full h-[2.5rem] pl-10 pr-3.5 text-xs bg-white border ${passwordErrors.newPassword ? 'border-rose-400 focus:ring-rose-100' : 'border-slate-200 focus:border-primary focus:ring-primary-light'} text-slate-900 rounded-xl outline-none focus:ring-4 transition-all placeholder-slate-400 font-medium`}
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium">Must be at least 8 characters long.</p>
                  {passwordErrors.newPassword && (
                    <p className="text-rose-600 text-[11px] font-bold">{passwordErrors.newPassword}</p>
                  )}
                </div>

                {/* Confirm New Password */}
                <div className="space-y-1.5">
                  <label htmlFor="confirmNewPassword" className="block text-slate-700 text-xs font-bold">Confirm New Password</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                      <Lock size={15} />
                    </span>
                    <input 
                      id="confirmNewPassword"
                      type="password" 
                      value={passwordData.confirmNewPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmNewPassword: e.target.value })}
                      placeholder="••••••••" 
                      aria-label="Confirm New Password"
                      className={`w-full h-[2.5rem] pl-10 pr-3.5 text-xs bg-white border ${passwordErrors.confirmNewPassword ? 'border-rose-400 focus:ring-rose-100' : 'border-slate-200 focus:border-primary focus:ring-primary-light'} text-slate-900 rounded-xl outline-none focus:ring-4 transition-all placeholder-slate-400 font-medium`}
                    />
                  </div>
                  {passwordErrors.confirmNewPassword && (
                    <p className="text-rose-600 text-[11px] font-bold">{passwordErrors.confirmNewPassword}</p>
                  )}
                </div>

              </div>

              {/* Action buttons */}
              <div className="p-4 bg-slate-50/50 flex justify-end">
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs hover:bg-primary-dark transition-all flex items-center gap-1.5 shrink-0"
                >
                  {passwordLoading ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Updating Password...</span>
                    </>
                  ) : (
                    <span>Update Password</span>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: Cache Settings */}
          {activeTab === "cache" && (
            <div role="tabpanel" id="panel-cache" aria-labelledby="tab-cache" className="bg-white rounded-2xl border border-slate-200/85 shadow-sm p-6 space-y-6">
              <div>
                <h2 className="font-display font-bold text-slate-900 text-base">Cache Settings</h2>
                <p className="text-slate-400 text-xs mt-0.5">Flush system cached data immediately.</p>
              </div>

              {cacheSuccess && (
                <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl px-4 py-3 text-xs font-semibold flex items-center gap-2.5">
                  <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                  <span>{cacheSuccess}</span>
                </div>
              )}
              {cacheError && (
                <div className="bg-rose-50 border border-rose-100 text-rose-700 rounded-xl px-4 py-3 text-xs font-semibold flex items-center gap-2.5">
                  <AlertCircle size={16} className="text-rose-500 shrink-0" />
                  <span>{cacheError}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <div>
                  <p className="text-sm font-semibold text-slate-800">Clear All Cache</p>
                  <p className="text-xs text-slate-400 mt-0.5">Flush all cached data from Redis. Next requests will rebuild the cache.</p>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    setIsClearingCache(true);
                    setCacheSuccess("");
                    setCacheError("");
                    try {
                      await API.delete("/cache/flush");
                      setCacheSuccess("All cache cleared successfully!");
                    } catch (err) {
                      setCacheError("Failed to clear cache. Please try again.");
                    } finally {
                      setIsClearingCache(false);
                    }
                  }}
                  disabled={isClearingCache}
                  className="inline-flex items-center gap-2 h-9 px-4 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
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

        </div>

      </div>
      <CameraCaptureModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={(img) => {
          setProfileData((prev) => ({ ...prev, avatar: img }));
          setProfileErrors((prev) => ({ ...prev, avatar: null }));
        }}
      />
      <AvatarSelectionModal
        isOpen={isSelectionOpen}
        onClose={() => setIsSelectionOpen(false)}
        onTakeActive={() => setIsCameraOpen(true)}
        onChooseFile={() => document.getElementById("avatar-file").click()}
        onRemove={() => {
          setProfileData((prev) => ({ ...prev, avatar: "" }));
          setProfileErrors((prev) => ({ ...prev, avatar: null }));
        }}
        hasPhoto={!!profileData.avatar}
      />
    </div>
  );
}
