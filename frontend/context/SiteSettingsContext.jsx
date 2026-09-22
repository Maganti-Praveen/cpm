// Distributes global visual assets, logos, favicons, and system theme colors.
// Employs a BroadcastChannel to sync theme variables across open browser tabs.


import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { applySiteSettings } from "../utils/siteSettingsHelper";

// site branding context — logo, favicon, title, and theme colors
// fetches from backend on startup and syncs across tabs via BroadcastChannel

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

const optimizeCloudinaryUrl = (url) => {
  if (typeof url === "string" && url.includes("res.cloudinary.com/") && url.includes("/image/upload/")) {
    return url.replace("/image/upload/", "/image/upload/w_120,c_scale,f_auto,q_auto/");
  }
  return url;
};

const SiteSettingsContext = createContext(null);

const DEFAULTS = {
  siteTitle:           "Sai CRP",
  metaTitle:           "Sai IT Services - Project Management Portal",
  metaDescription:     "Sai IT Services Client Relationship Portal for streamlined client project management.",
  siteLogo:            "",
  siteFavicon:         "",
  themeColor:          "#4F46E5",
  themeSecondaryColor: "#6366F1",
  sidebarBg:           "#1E1B4B",
  sidebarFontColor:    "#E0E7FF",
  navbarBg:            "#FFFFFF",
  navbarFontColor:     "#475569",
  mainBg:              "#F8FAFC",
  mainFontColor:       "#0F172A",
  activeTabBg:         "#4F46E5",
  activeTabColor:      "#FFFFFF",
  ctaBg:               "#4F46E5",
  ctaHoverBg:          "#3730A3",
  fontFamily:          "Inter",
  cloudinaryEnabled:   false,
};

// map API response fields to hook fields
function mapApiResponse(data) {
  return {
    siteTitle:           data.siteTitle           || DEFAULTS.siteTitle,
    metaTitle:           data.metaTitle           || DEFAULTS.metaTitle,
    metaDescription:     data.metaDescription     || DEFAULTS.metaDescription,
    siteLogo:            optimizeCloudinaryUrl(data.logoUrl || ""),
    siteFavicon:         data.faviconUrl          || "",
    themeColor:          data.themeColor          || DEFAULTS.themeColor,
    themeSecondaryColor: data.themeSecondaryColor || DEFAULTS.themeSecondaryColor,
    sidebarBg:           data.sidebarBg           || DEFAULTS.sidebarBg,
    sidebarFontColor:    data.sidebarFontColor    || DEFAULTS.sidebarFontColor,
    navbarBg:            data.navbarBg            || DEFAULTS.navbarBg,
    navbarFontColor:     data.navbarFontColor     || DEFAULTS.navbarFontColor,
    mainBg:              data.mainBg              || DEFAULTS.mainBg,
    mainFontColor:       data.mainFontColor       || DEFAULTS.mainFontColor,
    activeTabBg:         data.activeTabBg         || DEFAULTS.activeTabBg,
    activeTabColor:      data.activeTabColor      || DEFAULTS.activeTabColor,
    ctaBg:               data.ctaBg               || DEFAULTS.ctaBg,
    ctaHoverBg:          data.ctaHoverBg          || DEFAULTS.ctaHoverBg,
    fontFamily:          data.fontFamily          || DEFAULTS.fontFamily,
    cloudinaryEnabled:   !!data.cloudinaryEnabled,
  };
}

// fetch branding settings from api
async function fetchFromApi() {
  const res = await fetch(`${API_BASE}/api/site-settings`);
  if (!res.ok) throw new Error("Failed to fetch site settings");
  const json = await res.json();
  return mapApiResponse(json.data);
}

// load initial settings from cache or defaults
const getInitialSettings = () => {
  try {
    const cachedTitle = localStorage.getItem("sai_site_title");
    if (!cachedTitle) return DEFAULTS;
    
    return {
      siteTitle:           cachedTitle,
      metaTitle:           localStorage.getItem("sai_meta_title")            || DEFAULTS.metaTitle,
      metaDescription:     localStorage.getItem("sai_meta_description")     || DEFAULTS.metaDescription,
      siteLogo:            optimizeCloudinaryUrl(localStorage.getItem("sai_site_logo") || ""),
      siteFavicon:         localStorage.getItem("sai_site_favicon")          || "",
      themeColor:          localStorage.getItem("sai_theme_color")           || DEFAULTS.themeColor,
      themeSecondaryColor: localStorage.getItem("sai_theme_secondary_color") || DEFAULTS.themeSecondaryColor,
      sidebarBg:           localStorage.getItem("sai_sidebar_bg")            || DEFAULTS.sidebarBg,
      sidebarFontColor:    localStorage.getItem("sai_sidebar_font")           || DEFAULTS.sidebarFontColor,
      navbarBg:            localStorage.getItem("sai_navbar_bg")             || DEFAULTS.navbarBg,
      navbarFontColor:     localStorage.getItem("sai_navbar_font")            || DEFAULTS.navbarFontColor,
      mainBg:              localStorage.getItem("sai_main_bg")               || DEFAULTS.mainBg,
      mainFontColor:       localStorage.getItem("sai_main_font")             || DEFAULTS.mainFontColor,
      activeTabBg:         localStorage.getItem("sai_active_tab_bg")         || DEFAULTS.activeTabBg,
      activeTabColor:      localStorage.getItem("sai_active_tab_color")      || DEFAULTS.activeTabColor,
      ctaBg:               localStorage.getItem("sai_cta_bg")                || DEFAULTS.ctaBg,
      ctaHoverBg:          localStorage.getItem("sai_cta_hover_bg")          || DEFAULTS.ctaHoverBg,
      fontFamily:          localStorage.getItem("sai_font_family")           || DEFAULTS.fontFamily,
      cloudinaryEnabled:   localStorage.getItem("sai_cloudinary_enabled")   === "true",
    };
  } catch (e) {
    return DEFAULTS;
  }
};

// provider wrapper for root context
export function SiteSettingsProvider({ children }) {
  const [settings, setSettings] = useState(getInitialSettings);

  // fetch fresh settings and apply to state/DOM
  const refreshSettings = useCallback(async () => {
    try {
      const fresh = await fetchFromApi();
      setSettings(fresh);
      // Persist to localStorage as a fast cache for applySiteSettings DOM updates
      localStorage.setItem("sai_site_title",            fresh.siteTitle);
      localStorage.setItem("sai_meta_title",            fresh.metaTitle);
      localStorage.setItem("sai_meta_description",      fresh.metaDescription);
      localStorage.setItem("sai_site_logo",             fresh.siteLogo);
      localStorage.setItem("sai_site_favicon",          fresh.siteFavicon);
      localStorage.setItem("sai_cloudinary_enabled",    fresh.cloudinaryEnabled ? "true" : "false");

      const hasCustomTheme = document.documentElement.getAttribute("data-theme-custom") === "true";
      if (!hasCustomTheme) {
        localStorage.setItem("sai_theme_color",           fresh.themeColor);
        localStorage.setItem("sai_theme_secondary_color", fresh.themeSecondaryColor);
        localStorage.setItem("sai_sidebar_bg",            fresh.sidebarBg);
        localStorage.setItem("sai_sidebar_font",          fresh.sidebarFontColor);
        localStorage.setItem("sai_navbar_bg",             fresh.navbarBg);
        localStorage.setItem("sai_navbar_font",            fresh.navbarFontColor);
        localStorage.setItem("sai_main_bg",               fresh.mainBg);
        localStorage.setItem("sai_main_font",             fresh.mainFontColor);
        localStorage.setItem("sai_active_tab_bg",         fresh.activeTabBg);
        localStorage.setItem("sai_active_tab_color",      fresh.activeTabColor);
        localStorage.setItem("sai_cta_bg",                fresh.ctaBg);
        localStorage.setItem("sai_cta_hover_bg",          fresh.ctaHoverBg);
        localStorage.setItem("sai_font_family",           fresh.fontFamily);
      }
      applySiteSettings();
    } catch (err) {
      console.warn("Could not fetch site settings from API:", err.message);
    }
  }, []);

  useEffect(() => {
    // Fetch on mount
    refreshSettings();

    // Sync when admin saves settings from another tab (same browser)
    const handleStorageEvent = () => refreshSettings();
    window.addEventListener("siteSettingsUpdated", handleStorageEvent);
    window.addEventListener("storage", handleStorageEvent);

    // BroadcastChannel for reliable cross-tab sync
    let bc;
    try {
      bc = new BroadcastChannel("sai_settings_sync");
      bc.onmessage = () => refreshSettings();
    } catch {
      // Not available in all environments
    }

    return () => {
      window.removeEventListener("siteSettingsUpdated", handleStorageEvent);
      window.removeEventListener("storage", handleStorageEvent);
      if (bc) bc.close();
    };
  }, [refreshSettings]);

  return (
    <SiteSettingsContext.Provider value={{ settings, refreshSettings }}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

// access current settings object
export function useSiteSettings() {
  const ctx = useContext(SiteSettingsContext);
  return ctx ? ctx.settings : DEFAULTS;
}

// helper to reload site settings
export function useRefreshSiteSettings() {
  const ctx = useContext(SiteSettingsContext);
  return ctx ? ctx.refreshSettings : async () => {};
}

// broadcast update event to other open tabs
export function broadcastSettingsUpdate() {
  try {
    const bc = new BroadcastChannel("sai_settings_sync");
    bc.postMessage({ type: "siteSettingsUpdated" });
    bc.close();
  } catch {
    // Ignore
  }
  window.dispatchEvent(new Event("siteSettingsUpdated"));
}
