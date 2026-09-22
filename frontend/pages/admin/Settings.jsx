// Settings home directing visual style profiles and mail setup menus.
// Coordinates configurations updates.


import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { updateProfile } from "../../slices/authSlice";
import API from "../../services/api";
import CameraCaptureModal from "../../components/common/CameraCaptureModal";
import AvatarSelectionModal from "../../components/common/AvatarSelectionModal";
import { useRefreshSiteSettings } from "../../hooks/useGlobalSettings";
import { useTheme } from "../../context/ThemeContext";
import ThemeSettings from "./settings/ThemeSettings";
import { broadcastSettingsUpdate } from "../../context/SiteSettingsContext";
import { adjustColorBrightness } from "../../utils/siteSettingsHelper";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "../../context/ToastContext";
import { getSubscriptionStatus, subscribeUserToPush, unsubscribeUserFromPush } from "../../services/pushNotificationService";
import { getCacheStatus, enableCache, disableCache } from "../../services/cacheService";
import { 
  Globe, 
  User, 
  UploadCloud, 
  Check, 
  Lock, 
  Settings, 
  AlertCircle, 
  Save,
  X,
  CheckCircle2,
  Mail,
  FileText,
  Shield,
  ChevronRight,
  Cloud,
  Key,
  Wifi,
  WifiOff,
  Loader2,
  ExternalLink,
  Camera,
  Palette,
  Database,
  Trash2
} from "lucide-react";

export default function AdminSettings() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user: reduxUser, token } = useSelector((state) => state.auth);
  // Direct context refresh — guaranteed to update all components immediately
  const refreshSiteSettings = useRefreshSiteSettings();
  const { showToast } = useToast();

  const { themes, saveTheme } = useTheme();
  const [selectedUserThemeId, setSelectedUserThemeId] = useState(reduxUser?.themeId || "");

  useEffect(() => {
    if (reduxUser) {
      setSelectedUserThemeId(reduxUser.themeId || "");
    }
  }, [reduxUser]);

  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";


  
  const isSubAdmin = reduxUser?.role === 'ADMIN' && reduxUser?.isSuperAdmin !== true;
  let userPermissions = {};
  if (reduxUser?.permissions) {
    if (typeof reduxUser.permissions === "string") {
      try {
        userPermissions = JSON.parse(reduxUser.permissions);
      } catch (_) {
        userPermissions = {};
      }
    } else if (typeof reduxUser.permissions === "object") {
      userPermissions = reduxUser.permissions;
    }
  }

  const location = useLocation();
  // Tab control state: "site", "cloud", or "profile"
  const [activeTab, setActiveTab] = useState("site");

  useEffect(() => {
    if (isSubAdmin) {
      if (activeTab === "site" && !userPermissions.settings_site) {
        if (userPermissions.settings_theme) setActiveTab("theme");
        else if (userPermissions.settings_cloud) setActiveTab("cloud");
        else if (userPermissions.settings_redis) setActiveTab("redis");
        else setActiveTab("profile");
      }
    }
  }, [isSubAdmin, userPermissions, activeTab]);

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

  // Sync tab status with URL query search parameters and permissions
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get("tab");
    
    const hasAccess = (tab) => {
      if (!isSubAdmin) return true;
      if (tab === "profile") return true;
      if (tab === "site") return !!userPermissions.settings_site;
      if (tab === "theme") return !!userPermissions.settings_theme;
      if (tab === "cloud") return !!userPermissions.settings_cloud;
      if (tab === "redis") return !!userPermissions.settings_redis;
      return false;
    };

    if (tabParam && ["site", "theme", "cloud", "redis", "profile"].includes(tabParam)) {
      if (hasAccess(tabParam)) {
        setActiveTab(tabParam);
      } else {
        setActiveTab("profile");
      }
    } else {
      // Default on mount
      if (isSubAdmin) {
        if (userPermissions.settings_site) {
          setActiveTab("site");
        } else if (userPermissions.settings_theme) {
          setActiveTab("theme");
        } else if (userPermissions.settings_cloud) {
          setActiveTab("cloud");
        } else if (userPermissions.settings_redis) {
          setActiveTab("redis");
        } else {
          setActiveTab("profile");
        }
      } else {
        setActiveTab("site");
      }
    }
  }, [location, reduxUser, isSubAdmin]);
  
  // Tab 1: SITE SETTINGS States
  const [siteTitle, setSiteTitle] = useState(
    localStorage.getItem("sai_site_title") || "Sai CRP"
  );
  const [metaTitle, setMetaTitle] = useState(
    localStorage.getItem("sai_meta_title") || "Sai IT Services - Project Management Portal"
  );
  const [metaDescription, setMetaDescription] = useState(
    localStorage.getItem("sai_meta_description") || 
    "Sai IT Services Client Relationship Portal for streamlined client project management, milestones tracking, and document collaboration."
  );
  const [primaryColor, setPrimaryColor] = useState(
    localStorage.getItem("sai_theme_color") || "#4F46E5"
  );
  const [secondaryColor, setSecondaryColor] = useState(
    localStorage.getItem("sai_theme_secondary_color") || "#6366F1"
  );

  // Media upload states
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");
  
  const [faviconFile, setFaviconFile] = useState(null);
  const [faviconPreview, setFaviconPreview] = useState("");

  // Tab 2: CLOUD STORAGE States
  const [storageProvider, setStorageProvider] = useState("local");
  const [cloudinaryCloudName, setCloudinaryCloudName] = useState("");
  const [cloudinaryApiKey, setCloudinaryApiKey] = useState("");
  const [cloudinaryApiSecret, setCloudinaryApiSecret] = useState("");

  const [s3Bucket, setS3Bucket] = useState("");
  const [s3Region, setS3Region] = useState("");
  const [s3AccessKeyId, setS3AccessKeyId] = useState("");
  const [s3SecretAccessKey, setS3SecretAccessKey] = useState("");
  const [s3Endpoint, setS3Endpoint] = useState("");

  // Tab: REDIS CACHE States
  const [redisEnabled, setRedisEnabled] = useState(false);
  const [redisUrl, setRedisUrl] = useState("");
  const [redisConnected, setRedisConnected] = useState(false);
  const [isSavingRedis, setIsSavingRedis] = useState(false);
  const [isTogglingRedis, setIsTogglingRedis] = useState(false);
  const [showClearCacheConfirm, setShowClearCacheConfirm] = useState(false);
  const [isClearingCache, setIsClearingCache] = useState(false);
  const [cloudinaryEnabled, setCloudinaryEnabled] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionTestResult, setConnectionTestResult] = useState(null); // { success, message }
  const [isTestingS3, setIsTestingS3] = useState(false);
  const [s3TestResult, setS3TestResult] = useState(null); // { success, message }
  const [isSavingCloud, setIsSavingCloud] = useState(false);

  // Load Redis status from backend on mount
  useEffect(() => {
    getCacheStatus()
      .then((res) => {
        setRedisEnabled(res.data.data.enabled);
        setRedisConnected(res.data.data.connected);
      })
      .catch(() => {});
  }, []);

  // Load Redis URL from env (shown as placeholder hint only — not stored in frontend)
  useEffect(() => {
    API.get("/cache/status")
      .then(() => {})
      .catch(() => {});
  }, [token]);

  const handleRedisToggle = async () => {
    setIsTogglingRedis(true);
    try {
      const res = redisEnabled ? await disableCache() : await enableCache();
      if (res.data?.data) {
        setRedisEnabled(res.data.data.enabled);
        setRedisConnected(res.data.data.connected);
      }
      showToast(redisEnabled ? "Redis cache disabled" : "Redis cache enabled", "success");
    } catch {
      showToast("Failed to update Redis status", "error");
    } finally {
      setIsTogglingRedis(false);
    }
  };

  const handleSaveRedisUrl = async () => {
    if (!redisUrl.trim()) {
      showToast("Please enter a Redis URL", "error");
      return;
    }
    setIsSavingRedis(true);
    try {
      await API.put("/cache/url", { redisUrl: redisUrl.trim() });
      showToast("Redis URL saved. Restart server to apply.", "success");
    } catch {
      showToast("Failed to save Redis URL", "error");
    } finally {
      setIsSavingRedis(false);
    }
  };

  const handleClearCache = async () => {
    setIsClearingCache(true);
    try {
      await API.delete("/cache/flush");
      showToast("All cache cleared successfully", "success");
    } catch {
      showToast("Failed to clear cache", "error");
    } finally {
      setIsClearingCache(false);
      setShowClearCacheConfirm(false);
    }
  };

  useEffect(() => {
    API.get("/site-settings")
      .then((res) => {
        const data = res.data?.data;
        if (data) {
          setSiteTitle(data.siteTitle || "Sai CRP");
          setMetaTitle(data.metaTitle || "Sai IT Services - Project Management Portal");
          setMetaDescription(data.metaDescription || "");
          setPrimaryColor(data.themeColor || "#4F46E5");
          setSecondaryColor(data.themeSecondaryColor || "#6366F1");
          if (data.logoUrl)    setLogoPreview(data.logoUrl);
          if (data.faviconUrl) setFaviconPreview(data.faviconUrl);
          setStorageProvider(data.storageProvider || "local");
          setCloudinaryEnabled(data.storageProvider === "cloudinary");
        }
      })
      .catch(() => {}); // Fail silently — defaults are fine
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!token) return;
    API.get("/site-settings/cloudinary-config")
      .then((res) => {
        const data = res.data?.data;
        if (data) {
          setStorageProvider(data.storageProvider || "local");
          setCloudinaryCloudName(data.cloudinaryCloudName || "");
          setCloudinaryApiKey(data.cloudinaryApiKey || "");
          setCloudinaryApiSecret(data.cloudinaryApiSecret || "");
          setS3Bucket(data.s3Bucket || "");
          setS3Region(data.s3Region || "");
          setS3AccessKeyId(data.s3AccessKeyId || "");
          setS3SecretAccessKey(data.s3SecretAccessKey || "");
          setS3Endpoint(data.s3Endpoint || "");
        }
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Tab 3: ADMIN PROFILE States
  const [fullName, setFullName] = useState(
    localStorage.getItem("fullName") || ""
  );
  const [emailAddress, setEmailAddress] = useState(
    localStorage.getItem("emailAddress") || ""
  );
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [avatar, setAvatar] = useState("");
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isSelectionOpen, setIsSelectionOpen] = useState(false);
  
  // UI states
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  // Sync with reduxUser profile if loaded and no local edits have been stored yet
  useEffect(() => {
    if (reduxUser) {
      if (!localStorage.getItem("fullName")) {
        setFullName(reduxUser.fullName || "");
      }
      if (!localStorage.getItem("emailAddress")) {
        setEmailAddress(reduxUser.email || "");
      }
      setTwoFactorEnabled(reduxUser.twoFactorEnabled || false);
      setAvatar(reduxUser.avatar || "");
    }
  }, [reduxUser]);

  const handleAdminAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMsg("Only image files are allowed.");
      showToast("Only image files are allowed.", "error");
      e.target.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg("Avatar image file size must be under 2MB.");
      showToast("Avatar image file size must be under 2MB.", "error");
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatar(reader.result);
      setErrorMsg("");
    };
    reader.readAsDataURL(file);
  };

  // Convert File to Base64 helper
  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  // Upload actions
  const handleLogoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith("image/")) {
        showToast("Only image files are allowed.", "error");
        e.target.value = "";
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        showToast("Image file size should be less than 5MB.", "error");
        e.target.value = "";
        return;
      }
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleFaviconChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith("image/")) {
        showToast("Only image files are allowed.", "error");
        e.target.value = "";
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        showToast("Image file size should be less than 5MB.", "error");
        e.target.value = "";
        return;
      }
      setFaviconFile(file);
      setFaviconPreview(URL.createObjectURL(file));
    }
  };

  const handleClearLogo = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setLogoFile(null);
    setLogoPreview("");
    // The flag will be sent on next Save — actual deletion happens server-side
  };

  const handleClearFavicon = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setFaviconFile(null);
    setFaviconPreview("");
    // The flag will be sent on next Save — actual deletion happens server-side
  };

  const triggerLogoUpload = () => {
    document.getElementById("logo-upload-input").click();
  };

  const triggerFaviconUpload = () => {
    document.getElementById("favicon-upload-input").click();
  };

  // cloudinary utility actions
  const handleTestCloudinary = async () => {
    setIsTestingConnection(true);
    setConnectionTestResult(null);
    try {
      const res = await API.post("/site-settings/cloudinary-test", {
        cloudinaryCloudName,
        cloudinaryApiKey,
        cloudinaryApiSecret,
      });
      const data = res.data;
      setConnectionTestResult({
        success: data.success,
        message: data.message,
      });
    } catch (err) {
      setConnectionTestResult({
        success: false,
        message: err.response?.data?.message || "Network error. Please check your connection.",
      });
    } finally {
      setIsTestingConnection(false);
    }
  };
  const handleSaveCloudinary = async () => {
    setIsSavingCloud(true);
    setErrorMsg("");
    try {
      const res = await API.put("/site-settings/cloudinary-config", {
        storageProvider,
        cloudinaryCloudName,
        cloudinaryApiKey,
        cloudinaryApiSecret,
        s3Bucket,
        s3Region,
        s3AccessKeyId,
        s3SecretAccessKey,
        s3Endpoint,
      });
      const data = res.data;
      if (!data?.success) throw new Error(data?.message || "Failed to save");
      setCloudinaryEnabled(data.data?.storageProvider === "cloudinary");
      await refreshSiteSettings();
      broadcastSettingsUpdate();
      showToast(data.message || "Storage configuration saved!", "success");
      setConnectionTestResult(null);
      setS3TestResult(null);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || "Failed to save storage settings.");
    } finally {
      setIsSavingCloud(false);
    }
  };

  const handleClearCloudinary = async () => {
    setCloudinaryCloudName("");
    setCloudinaryApiKey("");
    setCloudinaryApiSecret("");
    setConnectionTestResult(null);
    const nextProvider = storageProvider === "cloudinary" ? "local" : storageProvider;
    setStorageProvider(nextProvider);
    setIsSavingCloud(true);
    try {
      const res = await API.put("/site-settings/cloudinary-config", {
        storageProvider: nextProvider,
        cloudinaryCloudName: "",
        cloudinaryApiKey: "",
        cloudinaryApiSecret: "",
        s3Bucket,
        s3Region,
        s3AccessKeyId,
        s3SecretAccessKey,
        s3Endpoint,
      });
      setCloudinaryEnabled(nextProvider === "cloudinary");
      await refreshSiteSettings();
      broadcastSettingsUpdate();
      showToast("Cloudinary credentials cleared.", "success");
    } catch (err) {
      setErrorMsg("Failed to clear Cloudinary settings.");
    } finally {
      setIsSavingCloud(false);
    }
  };

  const handleClearS3 = async () => {
    setS3Bucket("");
    setS3Region("");
    setS3AccessKeyId("");
    setS3SecretAccessKey("");
    setS3Endpoint("");
    setS3TestResult(null);
    const nextProvider = storageProvider === "s3" ? "local" : storageProvider;
    setStorageProvider(nextProvider);
    setIsSavingCloud(true);
    try {
      const res = await API.put("/site-settings/cloudinary-config", {
        storageProvider: nextProvider,
        cloudinaryCloudName,
        cloudinaryApiKey,
        cloudinaryApiSecret,
        s3Bucket: "",
        s3Region: "",
        s3AccessKeyId: "",
        s3SecretAccessKey: "",
        s3Endpoint: "",
      });
      await refreshSiteSettings();
      broadcastSettingsUpdate();
      showToast("AWS S3 credentials cleared.", "success");
    } catch (err) {
      setErrorMsg("Failed to clear S3 settings.");
    } finally {
      setIsSavingCloud(false);
    }
  };

  const handleTestS3 = async () => {
    setIsTestingS3(true);
    setS3TestResult(null);
    try {
      const res = await API.post("/site-settings/s3-test", {
        s3Bucket,
        s3Region,
        s3AccessKeyId,
        s3SecretAccessKey,
        s3Endpoint,
      });
      setS3TestResult({
        success: true,
        message: res.data.message || "Connection successful!",
      });
    } catch (err) {
      setS3TestResult({
        success: false,
        message: err.response?.data?.message || "Failed to connect to S3. Please verify credentials.",
      });
    } finally {
      setIsTestingS3(false);
    }
  };



  // Submit and Save Configurations
  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMsg("");

    try {
      if (activeTab === "site") {
        // Build multipart FormData — files go to backend uploads/site-settings/
        const formData = new FormData();
        formData.append("siteTitle",           siteTitle);
        formData.append("metaTitle",           metaTitle);
        formData.append("metaDescription",     metaDescription);

        if (logoFile) {
          formData.append("logo", logoFile);
        } else if (!logoPreview) {
          formData.append("clearLogo", "true");
        }

        if (faviconFile) {
          formData.append("favicon", faviconFile);
        } else if (!faviconPreview) {
          formData.append("clearFavicon", "true");
        }

        const res = await API.put("/site-settings", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        const data = res.data?.data;
        if (!res.data?.success) {
          throw new Error(res.data?.message || "Failed to save site settings");
        }
        // Update local preview to the saved server URL
        setLogoPreview(data.logoUrl || "");
        setFaviconPreview(data.faviconUrl || "");
        setLogoFile(null);
        setFaviconFile(null);

        // Refresh context (fetches fresh from API) + broadcast to other tabs
        await refreshSiteSettings();
        broadcastSettingsUpdate();
        setIsSuccessModalOpen(true);
      } else if (activeTab === "profile") {
        // ADMIN PROFILE Settings
        if (!fullName.trim() || !emailAddress.trim()) {
          setErrorMsg("Full Name and Email Address cannot be empty.");
          setIsSaving(false);
          return;
        }

        if (newPassword && newPassword !== confirmNewPassword) {
          setErrorMsg("New passwords do not match.");
          setIsSaving(false);
          return;
        }

        localStorage.setItem("fullName", fullName);
        localStorage.setItem("emailAddress", emailAddress);

        // Call backend update if Redux user is active
        const updateData = { fullName, email: emailAddress, twoFactorEnabled, avatar };
        if (currentPassword) {
          updateData.currentPassword = currentPassword;
        }
        if (newPassword) {
          updateData.password = newPassword;
        }

        const resultAction = await dispatch(updateProfile(updateData));
        if (updateProfile.fulfilled.match(resultAction)) {
          if (selectedUserThemeId !== (reduxUser?.themeId || "")) {
            await saveTheme(selectedUserThemeId);
          }
          setCurrentPassword("");
          setNewPassword("");
          setConfirmNewPassword("");
          setIsSuccessModalOpen(true);
        } else {
          setErrorMsg(resultAction.payload || "Failed to update profile settings.");
        }
      }
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.message || err.message || "An unexpected error occurred while saving configurations.";
      setErrorMsg(errMsg);
      showToast(errMsg, "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full bg-[#F8FAFC] min-h-[85vh] font-sans antialiased text-[#0F172A]">
      {/* Title Header */}
      <div className="mb-8 flex flex-col items-start text-left">
        <h1 className="text-[1.75rem] font-bold text-[#0F172A] font-display flex items-center gap-3">
          <Settings className="w-7 h-7 text-[#4F46E5]" />
          Portal Configurations
        </h1>
        <p className="text-sm text-[#475569] font-normal mt-1">
          Configure the core site layout settings and manage your admin account profile credentials.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap border-b border-slate-200 mb-8 gap-4 sm:gap-6">
        {(!isSubAdmin || !!userPermissions.settings_site) && (
          <button
            id="tab-btn-site"
            onClick={() => {
              setActiveTab("site");
              setErrorMsg("");
            }}
            className={`pb-3 text-sm font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer flex items-center gap-2 ${
              activeTab === "site"
                ? "border-b-2 border-[#4F46E5] text-[#4F46E5]"
                : "text-[#475569] hover:text-[#0F172A] border-b-2 border-transparent"
            }`}
          >
            <Globe className="w-4 h-4" />
            SITE SETTINGS
          </button>
        )}
        {(!isSubAdmin || !!userPermissions.settings_theme) && (
          <button
            id="tab-btn-theme"
            onClick={() => {
              setActiveTab("theme");
              setErrorMsg("");
            }}
            className={`pb-3 text-sm font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer flex items-center gap-2 ${
              activeTab === "theme"
                ? "border-b-2 border-[#4F46E5] text-[#4F46E5]"
                : "text-[#475569] hover:text-[#0F172A] border-b-2 border-transparent"
            }`}
          >
            <Palette className="w-4 h-4" />
            THEME SETTINGS
          </button>
        )}
        {(!isSubAdmin || !!userPermissions.settings_cloud) && (
          <button
            id="tab-btn-cloud"
            onClick={() => {
              setActiveTab("cloud");
              setErrorMsg("");
            }}
            className={`pb-3 text-sm font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer flex items-center gap-2 ${
              activeTab === "cloud"
                ? "border-b-2 border-[#4F46E5] text-[#4F46E5]"
                : "text-[#475569] hover:text-[#0F172A] border-b-2 border-transparent"
            }`}
          >
            <Cloud className="w-4 h-4" />
            CLOUD STORAGE
          </button>
        )}
        {(!isSubAdmin || !!userPermissions.settings_redis) && (
          <button
            id="tab-btn-redis"
            onClick={() => {
              setActiveTab("redis");
              setErrorMsg("");
            }}
            className={`pb-3 text-sm font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer flex items-center gap-2 ${
              activeTab === "redis"
                ? "border-b-2 border-[#4F46E5] text-[#4F46E5]"
                : "text-[#475569] hover:text-[#0F172A] border-b-2 border-transparent"
            }`}
          >
            <Database className="w-4 h-4" />
            REDIS CACHE
          </button>
        )}
        <button
          id="tab-btn-profile"
          onClick={() => {
            setActiveTab("profile");
            setErrorMsg("");
          }}
          className={`pb-3 text-sm font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer flex items-center gap-2 ${
            activeTab === "profile"
              ? "border-b-2 border-[#4F46E5] text-[#4F46E5]"
              : "text-[#475569] hover:text-[#0F172A] border-b-2 border-transparent"
          }`}
        >
          <User className="w-4 h-4" />
          ADMIN PROFILE
        </button>
      </div>

      {errorMsg && (
        <div className="mb-6 bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* MAIN FORM CONTAINER */}
      {activeTab === "cloud" ? (
        /* ────────────────────────────────────────────────────────────── */
        /* Tab 2: CLOUD STORAGE (Cloudinary Configuration)             */
        /* ────────────────────────────────────────────────────────────── */
        <div className="w-full bg-white rounded-xl border border-slate-200 p-8 shadow-sm space-y-8 text-left">
          
          {/* Active Provider Selector */}
          <div className="space-y-3 pb-6 border-b border-slate-100">
            <h3 className="text-base font-bold text-[#0F172A] font-display flex items-center gap-2">
              <Database className="w-4.5 h-4.5 text-[#4F46E5]" />
              Active Storage Provider
            </h3>
            <p className="text-xs text-[#64748B] mt-1">
              Select where newly uploaded files and attachments should be saved.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {/* Local Storage Card */}
              <div
                onClick={() => setStorageProvider("local")}
                className={`border p-4 rounded-xl cursor-pointer flex flex-col justify-between transition-all ${
                  storageProvider === "local"
                    ? "border-[#4F46E5] bg-indigo-50/20 shadow-sm"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${storageProvider === "local" ? "bg-[#4F46E5] text-white" : "bg-slate-100 text-slate-500"}`}>
                    <Database className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-slate-800">Local Storage</h5>
                    <p className="text-[11px] text-slate-500 mt-1 font-medium">Store files on the local server filesystem. Ideal for development or private testing.</p>
                  </div>
                </div>
              </div>

              {/* Cloudinary Storage Card */}
              <div
                onClick={() => setStorageProvider("cloudinary")}
                className={`border p-4 rounded-xl cursor-pointer flex flex-col justify-between transition-all ${
                  storageProvider === "cloudinary"
                    ? "border-[#4F46E5] bg-indigo-50/20 shadow-sm"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${storageProvider === "cloudinary" ? "bg-[#4F46E5] text-white" : "bg-slate-100 text-slate-500"}`}>
                    <Cloud className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-slate-800">Cloudinary</h5>
                    <p className="text-[11px] text-slate-500 mt-1 font-medium">Upload images and docs using Cloudinary CDN. Optimized for media serving.</p>
                  </div>
                </div>
              </div>

              {/* AWS S3 Storage Card */}
              <div
                onClick={() => setStorageProvider("s3")}
                className={`border p-4 rounded-xl cursor-pointer flex flex-col justify-between transition-all ${
                  storageProvider === "s3"
                    ? "border-[#4F46E5] bg-indigo-50/20 shadow-sm"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${storageProvider === "s3" ? "bg-[#4F46E5] text-white" : "bg-slate-100 text-slate-500"}`}>
                    <UploadCloud className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-slate-800">AWS S3 (or compatible)</h5>
                    <p className="text-[11px] text-slate-500 mt-1 font-medium">Use Amazon S3 or S3-compatible cloud storage (like MinIO, DigitalOcean, etc.).</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Local Storage Banner */}
          {storageProvider === "local" && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-left">
              <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Local Storage Selected
              </h4>
              <p className="text-xs text-slate-600 mt-2 font-medium">
                No extra configuration is required. Uploads will be saved locally inside the <code>uploads/documents</code> folder on the server.
              </p>
              
              <div className="pt-6 border-t border-slate-200 mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveCloudinary}
                  disabled={isSavingCloud}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#4F46E5] hover:bg-[#3730A3] disabled:bg-slate-400 text-white text-xs font-bold rounded-lg shadow-sm transition-all duration-200 cursor-pointer uppercase tracking-wider"
                >
                  {isSavingCloud ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Set as Active
                </button>
              </div>
            </div>
          )}

          {/* Cloudinary Config Form */}
          {storageProvider === "cloudinary" && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-base font-bold text-[#0F172A] font-display flex items-center gap-2">
                  <Cloud className="w-4.5 h-4.5 text-[#4F46E5]" />
                  Cloudinary Configuration
                </h3>
                <p className="text-xs text-[#64748B] mt-1">
                  Enter your Cloudinary credentials. You can find these in your{" "}
                  <a 
                    href="https://console.cloudinary.com/settings/api-keys" 
                    target="_blank" rel="noopener noreferrer" 
                    className="text-[#4F46E5] hover:underline font-semibold inline-flex items-center gap-0.5"
                  >
                    Cloudinary Dashboard <ExternalLink className="w-3 h-3" />
                  </a>.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-5">
                <div className="space-y-2">
                  <label htmlFor="cloudinary-cloud-name" className="text-[0.8125rem] font-bold text-[#475569] uppercase tracking-wider block flex items-center gap-1.5">
                    Cloud Name
                  </label>
                  <input
                    id="cloudinary-cloud-name"
                    type="text"
                    value={cloudinaryCloudName}
                    onChange={(e) => setCloudinaryCloudName(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:bg-white transition-all font-body font-medium"
                    placeholder="e.g. my-cloud-name"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="cloudinary-api-key" className="text-[0.8125rem] font-bold text-[#475569] uppercase tracking-wider block flex items-center gap-1.5">
                    API Key
                  </label>
                  <input
                    id="cloudinary-api-key"
                    type="text"
                    value={cloudinaryApiKey}
                    onChange={(e) => setCloudinaryApiKey(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:bg-white transition-all font-body font-medium font-mono"
                    placeholder="e.g. 123456789012345"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="cloudinary-api-secret" className="text-[0.8125rem] font-bold text-[#475569] uppercase tracking-wider block flex items-center gap-1.5">
                    API Secret
                  </label>
                  <input
                    id="cloudinary-api-secret"
                    type="password"
                    value={cloudinaryApiSecret}
                    onChange={(e) => setCloudinaryApiSecret(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:bg-white transition-all font-body font-medium font-mono"
                    placeholder="••••••••••••••••••••"
                  />
                </div>
              </div>

              {connectionTestResult && (
                <div className={`flex items-center gap-2 px-4 py-3 rounded-lg border text-xs font-semibold ${
                  connectionTestResult.success
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                    : "bg-rose-50 border-rose-200 text-rose-700"
                }`}>
                  {connectionTestResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                  {connectionTestResult.message}
                </div>
              )}

              <div className="pt-6 border-t border-slate-100 flex items-center justify-between flex-wrap gap-3">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleTestCloudinary}
                    disabled={isTestingConnection || !cloudinaryCloudName || !cloudinaryApiKey || !cloudinaryApiSecret}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50 disabled:text-slate-400 text-slate-700 text-xs font-bold rounded-lg transition-all duration-200 cursor-pointer uppercase tracking-wider border border-slate-200"
                  >
                    {isTestingConnection ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wifi className="w-4 h-4" />}
                    {isTestingConnection ? "Testing..." : "Test Connection"}
                  </button>

                  <button
                    type="button"
                    onClick={handleClearCloudinary}
                    disabled={isSavingCloud}
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 text-xs font-bold rounded-lg transition-all duration-200 cursor-pointer uppercase tracking-wider border border-rose-200"
                  >
                    <X className="w-4 h-4" />
                    Disconnect
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleSaveCloudinary}
                  disabled={isSavingCloud || !cloudinaryCloudName || !cloudinaryApiKey || !cloudinaryApiSecret}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#4F46E5] hover:bg-[#3730A3] disabled:bg-slate-400 text-white text-xs font-bold rounded-lg shadow-sm transition-all duration-200 cursor-pointer uppercase tracking-wider"
                >
                  {isSavingCloud ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {isSavingCloud ? "Saving..." : "Save Credentials"}
                </button>
              </div>
            </div>
          )}

          {/* AWS S3 Config Form */}
          {storageProvider === "s3" && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-base font-bold text-[#0F172A] font-display flex items-center gap-2">
                  <UploadCloud className="w-4.5 h-4.5 text-[#4F46E5]" />
                  AWS S3 Configuration
                </h3>
                <p className="text-xs text-[#64748B] mt-1">
                  Enter your S3 bucket credentials. Custom endpoints are supported for providers like DigitalOcean Spaces, MinIO, or Cloudflare R2.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label htmlFor="s3-bucket" className="text-[0.8125rem] font-bold text-[#475569] uppercase tracking-wider block">
                    Bucket Name
                  </label>
                  <input
                    id="s3-bucket"
                    type="text"
                    value={s3Bucket}
                    onChange={(e) => setS3Bucket(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:bg-white transition-all font-body font-medium"
                    placeholder="e.g. my-project-bucket"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="s3-region" className="text-[0.8125rem] font-bold text-[#475569] uppercase tracking-wider block">
                    Region
                  </label>
                  <input
                    id="s3-region"
                    type="text"
                    value={s3Region}
                    onChange={(e) => setS3Region(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:bg-white transition-all font-body font-medium"
                    placeholder="e.g. us-east-1"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="s3-access-key" className="text-[0.8125rem] font-bold text-[#475569] uppercase tracking-wider block">
                    Access Key ID
                  </label>
                  <input
                    id="s3-access-key"
                    type="text"
                    value={s3AccessKeyId}
                    onChange={(e) => setS3AccessKeyId(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:bg-white transition-all font-body font-medium font-mono"
                    placeholder="e.g. AKIAIOSFODNN7EXAMPLE"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="s3-secret-key" className="text-[0.8125rem] font-bold text-[#475569] uppercase tracking-wider block">
                    Secret Access Key
                  </label>
                  <input
                    id="s3-secret-key"
                    type="password"
                    value={s3SecretAccessKey}
                    onChange={(e) => setS3SecretAccessKey(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:bg-white transition-all font-body font-medium font-mono"
                    placeholder="••••••••••••••••••••••••••••••••••••••••"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label htmlFor="s3-endpoint" className="text-[0.8125rem] font-bold text-[#475569] uppercase tracking-wider block">
                    Custom Endpoint (Optional)
                  </label>
                  <input
                    id="s3-endpoint"
                    type="text"
                    value={s3Endpoint}
                    onChange={(e) => setS3Endpoint(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:bg-white transition-all font-body font-medium font-mono"
                    placeholder="e.g. https://nyc3.digitaloceanspaces.com"
                  />
                </div>
              </div>

              {s3TestResult && (
                <div className={`flex items-center gap-2 px-4 py-3 rounded-lg border text-xs font-semibold ${
                  s3TestResult.success
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                    : "bg-rose-50 border-rose-200 text-rose-700"
                }`}>
                  {s3TestResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                  {s3TestResult.message}
                </div>
              )}

              <div className="pt-6 border-t border-slate-100 flex items-center justify-between flex-wrap gap-3">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleTestS3}
                    disabled={isTestingS3 || !s3Bucket || !s3Region || !s3AccessKeyId || !s3SecretAccessKey}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50 disabled:text-slate-400 text-slate-700 text-xs font-bold rounded-lg transition-all duration-200 cursor-pointer uppercase tracking-wider border border-slate-200"
                  >
                    {isTestingS3 ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wifi className="w-4 h-4" />}
                    {isTestingS3 ? "Testing..." : "Test Connection"}
                  </button>

                  <button
                    type="button"
                    onClick={handleClearS3}
                    disabled={isSavingCloud}
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 text-xs font-bold rounded-lg transition-all duration-200 cursor-pointer uppercase tracking-wider border border-rose-200"
                  >
                    <X className="w-4 h-4" />
                    Disconnect
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleSaveCloudinary}
                  disabled={isSavingCloud || !s3Bucket || !s3Region || !s3AccessKeyId || !s3SecretAccessKey}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#4F46E5] hover:bg-[#3730A3] disabled:bg-slate-400 text-white text-xs font-bold rounded-lg shadow-sm transition-all duration-200 cursor-pointer uppercase tracking-wider"
                >
                  {isSavingCloud ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {isSavingCloud ? "Saving..." : "Save Credentials"}
                </button>
              </div>
            </div>
          )}
        </div>
      ) : activeTab === "redis" ? (
        /* ── Tab: REDIS CACHE ─────────────────────────────────── */
        <div className="w-full bg-white rounded-xl border border-slate-200 p-8 shadow-sm space-y-6 text-left">

          {/* Header row — title + toggle */}
          <div className="flex items-center justify-between pb-5 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-[#0F172A] font-display flex items-center gap-2">
                <Database className="w-4 h-4 text-[#4F46E5]" />
                Redis Cache
              </h3>
              <p className="text-xs text-[#64748B] mt-0.5">
                Enable high-speed caching to reduce database load.
              </p>
            </div>

            {/* On / Off toggle */}
            <button
              id="redis-toggle-btn"
              type="button"
              disabled={isTogglingRedis}
              onClick={handleRedisToggle}
              className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors duration-200 cursor-pointer focus:outline-none disabled:opacity-50 ${
                redisEnabled ? "bg-[#4F46E5]" : "bg-[#CBD5E1]"
              }`}
            >
              {isTogglingRedis ? (
                <Loader2 size={12} className="animate-spin absolute left-1/2 -translate-x-1/2 text-white" />
              ) : (
                <span
                  className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transform transition-transform duration-200 ${
                    redisEnabled ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              )}
            </button>
          </div>

          {/* Status pill */}
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${
              redisEnabled && redisConnected
                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                : redisEnabled
                ? "bg-amber-50 border-amber-200 text-amber-700"
                : "bg-slate-100 border-slate-200 text-slate-500"
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                redisEnabled && redisConnected ? "bg-emerald-500" :
                redisEnabled ? "bg-amber-400" : "bg-slate-400"
              }`} />
              {redisEnabled && redisConnected ? "Connected" : redisEnabled ? "Enabled — Not Connected" : "Disabled"}
            </span>
          </div>

          {/* Redis URL input */}
          <div className="space-y-2">
            <label htmlFor="redis-url-input" className="text-[0.8125rem] font-bold text-[#475569] uppercase tracking-wider block">
              Redis URL
            </label>
            <div className="flex gap-2">
              <input
                id="redis-url-input"
                type="text"
                value={redisUrl}
                onChange={(e) => setRedisUrl(e.target.value)}
                placeholder="redis://localhost:6379  or  rediss://user:pass@host:6379"
                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:bg-white transition-all font-mono"
              />
              <button
                id="save-redis-url-btn"
                type="button"
                onClick={handleSaveRedisUrl}
                disabled={isSavingRedis || !redisUrl.trim()}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#4F46E5] hover:bg-[#3730A3] disabled:bg-slate-300 text-white text-xs font-bold rounded-lg transition-all cursor-pointer disabled:cursor-not-allowed"
              >
                {isSavingRedis ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                Save
              </button>
            </div>
            <p className="text-[0.7rem] text-[#94A3B8]">
              Local: <code className="bg-slate-100 px-1 rounded">redis://localhost:6379</code> &nbsp;·&nbsp;
              Production (SSL): <code className="bg-slate-100 px-1 rounded">rediss://user:pass@host:6379</code>
            </p>
          </div>

          {/* Clear Cache */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <div>
              <p className="text-sm font-semibold text-[#0F172A]">Clear All Cache</p>
              <p className="text-xs text-[#64748B] mt-0.5">Flush all cached data from Redis immediately.</p>
            </div>
            <button
              id="clear-cache-btn"
              type="button"
              onClick={() => setShowClearCacheConfirm(true)}
              className="inline-flex items-center gap-2 h-9 px-4 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 text-sm font-semibold transition-colors cursor-pointer"
            >
              <Trash2 size={14} />
              Clear Cache
            </button>
          </div>
        </div>
      ) : activeTab === "theme" ? (
        <ThemeSettings isTab={true} />
      ) : (
        <form onSubmit={handleSave} className="w-full bg-white rounded-xl border border-slate-200 p-8 shadow-sm space-y-8 text-left">
          {activeTab === "site" ? (
            /* Tab 1: SITE SETTINGS */
            <div className="space-y-8">
              <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-[#0F172A] font-display">General Branding</h3>
                  <p className="text-xs text-[#64748B] mt-0.5">Customize your portal title, logo, and media settings.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Site Title Input */}
                <div className="space-y-2">
                  <label htmlFor="site-title-input" className="text-[0.8125rem] font-bold text-[#475569] uppercase tracking-wider block">
                    Site Title
                  </label>
                  <input
                    id="site-title-input"
                    type="text"
                    value={siteTitle}
                    onChange={(e) => setSiteTitle(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:bg-white transition-all font-body font-medium"
                    placeholder="e.g. Sai CRP"
                    required
                  />
                </div>

                {/* Meta Title Input */}
                <div className="space-y-2">
                  <label htmlFor="meta-title-input" className="text-[0.8125rem] font-bold text-[#475569] uppercase tracking-wider block">
                    Meta Title
                  </label>
                  <input
                    id="meta-title-input"
                    type="text"
                    value={metaTitle}
                    onChange={(e) => setMetaTitle(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:bg-white transition-all font-body font-medium"
                    placeholder="e.g. Sai IT Services Portal"
                    required
                  />
                </div>
              </div>

              {/* Meta Description Textarea */}
              <div className="space-y-2">
                <label htmlFor="meta-description-textarea" className="text-[0.8125rem] font-bold text-[#475569] uppercase tracking-wider block">
                  Meta Description
                </label>
                <textarea
                  id="meta-description-textarea"
                  rows={4}
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:bg-white transition-all font-body leading-relaxed"
                  placeholder="Enter search engine meta description..."
                  required
                />
              </div>

              {/* Media Assets Upload Grid */}
              <div className="space-y-4 pt-2">
                <span className="text-[0.8125rem] font-bold text-[#475569] uppercase tracking-wider block">
                  Media Assets
                </span>

                {/* Cloudinary warning banner inside Site Settings if not configured */}
                {!cloudinaryEnabled && (
                  <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-amber-200 bg-amber-50/50 mb-2">
                    <WifiOff className="w-4 h-4 text-amber-500 shrink-0" />
                    <p className="text-xs text-amber-700 font-medium">
                      Cloud storage is not configured. Logo and favicon uploads will use local disk storage.{" "}
                      <button
                        type="button"
                        onClick={() => setActiveTab("cloud")}
                        className="text-[#4F46E5] hover:underline font-bold cursor-pointer bg-transparent border-none p-0"
                      >
                        Configure Cloudinary →
                      </button>
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Corporate Logo Box */}
                  <div 
                    onClick={logoPreview ? undefined : triggerLogoUpload}
                    className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center transition-all min-h-[160px] relative ${
                      logoPreview 
                        ? "border-slate-200 bg-white" 
                        : "border-slate-300 hover:border-[#4F46E5] hover:bg-slate-50/50 cursor-pointer"
                    }`}
                  >
                    <input
                      type="file"
                      id="logo-upload-input"
                      className="hidden"
                      accept="image/*"
                      onChange={handleLogoChange}
                    />
                    
                    {logoPreview ? (
                      <div className="w-full flex flex-col items-center justify-center p-2">
                        <img 
                          src={logoPreview} 
                          alt="Corporate Logo Preview" 
                          className="max-h-20 object-contain rounded-md shadow-sm border border-slate-100 mb-3" 
                        />
                        <button
                          id="clear-logo-btn"
                          onClick={handleClearLogo}
                          className="text-xs font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1 cursor-pointer bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-md border border-slate-200 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" /> Clear Logo
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center w-full">
                        <UploadCloud className="w-10 h-10 text-[#475569] mb-2" />
                        <span className="text-xs font-bold text-[#0F172A] font-display">
                          Corporate Logo
                        </span>
                        <span className="text-[11px] text-[#475569] mt-1 font-body">
                          Drag & Drop or Click to upload logo
                        </span>
                        <span className="text-[9px] text-slate-400 mt-0.5">Max size: 5 MB</span>
                      </div>
                    )}
                  </div>

                  {/* Browser Favicon Box */}
                  <div 
                    onClick={faviconPreview ? undefined : triggerFaviconUpload}
                    className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center transition-all min-h-[160px] relative ${
                      faviconPreview 
                        ? "border-slate-200 bg-white" 
                        : "border-slate-300 hover:border-[#4F46E5] hover:bg-slate-50/50 cursor-pointer"
                    }`}
                  >
                    <input
                      type="file"
                      id="favicon-upload-input"
                      className="hidden"
                      accept="image/x-icon,image/png"
                      onChange={handleFaviconChange}
                    />
                    
                    {faviconPreview ? (
                      <div className="w-full flex flex-col items-center justify-center p-2">
                        <img 
                          src={faviconPreview} 
                          alt="Browser Favicon Preview" 
                          className="max-h-16 w-16 object-contain rounded-md shadow-sm border border-slate-100 mb-3" 
                        />
                        <button
                          id="clear-favicon-btn"
                          onClick={handleClearFavicon}
                          className="text-xs font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1 cursor-pointer bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-md border border-slate-200 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" /> Clear Favicon
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center w-full">
                        <UploadCloud className="w-10 h-10 text-[#475569] mb-2" />
                        <span className="text-xs font-bold text-[#0F172A] font-display">
                          Browser Favicon
                        </span>
                        <span className="text-[11px] text-[#475569] mt-1 font-body">
                          Drag & Drop or Click to upload favicon
                        </span>
                        <span className="text-[9px] text-slate-400 mt-0.5">Max size: 5 MB</span>
                      </div>
                    )}
                  </div>

                </div>
              </div>
            </div>
          ) : (
            /* Tab 3: ADMIN PROFILE */
            <div className="space-y-8">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-base font-bold text-[#0F172A] font-display">Profile Details</h3>
                <p className="text-xs text-[#64748B] mt-0.5">Manage your user identity and security details.</p>
              </div>

              {/* Profile Picture Upload Section */}
              <div className="flex items-center gap-5 pb-6 border-b border-slate-100">
                <div className="relative group cursor-pointer" onClick={() => setIsSelectionOpen(true)}>
                  {avatar ? (
                    <img 
                      src={avatar} 
                      alt="Admin avatar" 
                      className="w-20 h-20 rounded-full object-cover border-2 border-slate-100 shadow-sm"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-indigo-600 text-white font-display font-bold text-xl flex items-center justify-center shadow-sm">
                      {fullName ? fullName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "AD"}
                    </div>
                  )}
                  
                  {/* Camera hover icon trigger */}
                  <div className="absolute inset-0 bg-slate-900/50 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer">
                    <Camera className="w-5 h-5" />
                  </div>
                </div>
                <input 
                  type="file" 
                  id="admin-avatar-input" 
                  accept="image/*" 
                  onChange={handleAdminAvatarChange} 
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
                  <p className="text-[11px] text-slate-450 mt-1.5 font-medium">
                    JPG or PNG. Max size of 2MB.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Full Name */}
                <div className="space-y-2">
                  <label htmlFor="admin-fullname-input" className="text-[0.8125rem] font-bold text-[#475569] uppercase tracking-wider block">
                    Full Name
                  </label>
                  <input
                    id="admin-fullname-input"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:bg-white transition-all font-body font-medium"
                    placeholder="Enter full name"
                    required
                  />
                </div>

                {/* Email Address */}
                <div className="space-y-2">
                  <label htmlFor="admin-email-input" className="text-[0.8125rem] font-bold text-[#475569] uppercase tracking-wider block">
                    Email Address
                  </label>
                  <input
                    id="admin-email-input"
                    type="email"
                    value={emailAddress}
                    onChange={(e) => setEmailAddress(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:bg-white transition-all font-body font-medium"
                    placeholder="name@company.com"
                    required
                  />
                </div>
              </div>

              {/* Two-Factor Authentication Toggle */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div>
                  <h4 className="text-sm font-bold text-[#0F172A] font-display">Two-Factor Authentication</h4>
                  <p className="text-xs text-[#64748B] mt-0.5">Secure your account with two-factor authentication.</p>
                </div>
                <div className="flex items-center gap-3">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      id="admin-2fa-toggle"
                      type="checkbox"
                      checked={twoFactorEnabled}
                      onChange={(e) => setTwoFactorEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#4F46E5]"></div>
                  </label>
                  <span className="text-sm font-medium text-slate-700">
                    {twoFactorEnabled ? "Enabled" : "Disabled"}
                  </span>
                </div>
              </div>

              {/* My Theme Selection Dropdown */}
              <div className="space-y-4 pt-4 border-t border-slate-100 text-left">
                <div>
                  <h4 className="text-sm font-bold text-[#0F172A] font-display">My Theme</h4>
                  <p className="text-xs text-[#64748B] mt-0.5">Customize your personal visual preference for the portal interface.</p>
                </div>
                <div className="max-w-xs space-y-1.5">
                  <select
                    id="admin-theme-dropdown"
                    value={selectedUserThemeId}
                    onChange={(e) => setSelectedUserThemeId(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:bg-white transition-all font-body font-medium cursor-pointer"
                  >
                    <option value="">Default (Site Branding Color)</option>
                    {themes.map((theme) => (
                      <option key={theme.id} value={theme.id}>
                        {theme.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Push Notifications Toggle */}
              <div className="space-y-4 pt-4 border-t border-slate-100 text-left">
                <div>
                  <h4 className="text-sm font-bold text-[#0F172A] font-display">Push Notifications</h4>
                  <p className="text-xs text-[#64748B] mt-0.5">Receive real-time system alerts on your desktop/device even when the portal is closed.</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handlePushToggle}
                    disabled={pushLoading}
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
                  <span className="text-sm font-semibold text-[#475569]">
                    {pushLoading ? "Updating..." : pushEnabled ? "Enabled" : "Disabled"}
                  </span>
                </div>
              </div>

              {/* Password Change Section */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div>
                  <h4 className="text-sm font-bold text-[#0F172A] font-display">Password Change Section</h4>
                  <p className="text-xs text-[#64748B] mt-0.5">Leave blank if you do not want to modify your credentials.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Current Password */}
                  <div className="space-y-2">
                    <label htmlFor="admin-current-password-input" className="text-[0.8125rem] font-bold text-[#475569] uppercase tracking-wider block">
                      Current Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        id="admin-current-password-input"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:bg-white transition-all font-body"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  {/* New Password */}
                  <div className="space-y-2">
                    <label htmlFor="admin-new-password-input" className="text-[0.8125rem] font-bold text-[#475569] uppercase tracking-wider block">
                      New Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        id="admin-new-password-input"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:bg-white transition-all font-body"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <label htmlFor="admin-confirm-password-input" className="text-[0.8125rem] font-bold text-[#475569] uppercase tracking-wider block">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        id="admin-confirm-password-input"
                        type="password"
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:bg-white transition-all font-body"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                </div>
              </div>
            </div>
          )}

          {/* Submit Actions */}
          <div className="pt-6 border-t border-slate-100 flex justify-end">
            <button
              id="save-settings-btn"
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#4F46E5] hover:bg-[#3730A3] disabled:bg-slate-400 text-white text-xs font-bold rounded-lg shadow-sm transition-all duration-200 cursor-pointer uppercase tracking-wider"
            >
              <Save className="w-4 h-4" />
              {isSaving ? "Saving..." : "Save Configurations"}
            </button>
          </div>
        </form>
      )}

      {/* Success Centered Popup Modal */}
      {isSuccessModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 text-center flex flex-col items-center border border-slate-100">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-4 border border-emerald-100">
              <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
            </div>
            <h3 className="text-base font-bold text-slate-900 font-display">Success</h3>
            <p className="text-sm text-slate-500 font-medium mt-1 mb-6">Configurations saved successfully!</p>
            <button
              id="success-ok-btn"
              onClick={() => setIsSuccessModalOpen(false)}
              className="w-full py-2.5 bg-[#4F46E5] hover:bg-[#3730A3] text-white text-xs font-bold rounded-lg shadow-sm transition-all duration-200 cursor-pointer"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Clear Cache Confirmation Popup */}
      {showClearCacheConfirm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 text-center flex flex-col items-center border border-slate-100">
            <div className="w-14 h-14 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mb-4 border border-rose-100">
              <Trash2 className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900 font-display">Clear All Cache?</h3>
            <p className="text-sm text-slate-500 font-medium mt-1 mb-6">
              This will flush all cached data from Redis. The app will continue working — next requests will rebuild the cache from the database.
            </p>
            <div className="flex gap-3 w-full">
              <button
                id="cancel-clear-cache-btn"
                onClick={() => setShowClearCacheConfirm(false)}
                className="flex-1 py-2.5 border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold rounded-lg transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="confirm-clear-cache-btn"
                onClick={handleClearCache}
                disabled={isClearingCache}
                className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-600 disabled:opacity-60 text-white text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {isClearingCache ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                {isClearingCache ? "Clearing..." : "Yes, Clear Cache"}
              </button>
            </div>
          </div>
        </div>
      )}
      <CameraCaptureModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={(img) => setAvatar(img)}
      />
      <AvatarSelectionModal
        isOpen={isSelectionOpen}
        onClose={() => setIsSelectionOpen(false)}
        onTakeActive={() => setIsCameraOpen(true)}
        onChooseFile={() => document.getElementById("admin-avatar-input").click()}
        onRemove={() => setAvatar("")}
        hasPhoto={!!avatar}
      />
    </div>
  );
}
