// Keeps track of user light/dark mode choices.
// Applies styling changes to the document viewport layout.


import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import * as themeService from "../services/themeService";
import { useRefreshSiteSettings } from "../hooks/useGlobalSettings";
import { loadUser } from "../slices/authSlice";

const ThemeContext = createContext(null);

// Color helper functions matching siteSettingsHelper
const sanitizeHex = (hex, defaultHex) => {
  if (!hex) return defaultHex;
  let s = hex.trim();
  if (!s.startsWith("#")) {
    s = "#" + s;
  }
  if (/^#[0-9A-F]{6}$/i.test(s)) {
    return s;
  }
  return defaultHex;
};

const adjustColorBrightness = (hex, percent) => {
  let cleanHex = sanitizeHex(hex, "#4F46E5");
  let R = parseInt(cleanHex.substring(1, 3), 16);
  let G = parseInt(cleanHex.substring(3, 5), 16);
  let B = parseInt(cleanHex.substring(5, 7), 16);

  R = parseInt((R * (100 + percent)) / 100);
  G = parseInt((G * (100 + percent)) / 100);
  B = parseInt((B * (100 + percent)) / 100);

  R = R < 255 ? R : 255;
  G = G < 255 ? G : 255;
  B = B < 255 ? B : 255;

  R = R > 0 ? R : 0;
  G = G > 0 ? G : 0;
  B = B > 0 ? B : 0;

  const rHex = R.toString(16).padStart(2, "0");
  const gHex = G.toString(16).padStart(2, "0");
  const bHex = B.toString(16).padStart(2, "0");

  return `#${rHex}${gHex}${bHex}`;
};

const hexToRgba = (hex, alpha) => {
  let cleanHex = sanitizeHex(hex, "#4F46E5");
  const R = parseInt(cleanHex.substring(1, 3), 16);
  const G = parseInt(cleanHex.substring(3, 5), 16);
  const B = parseInt(cleanHex.substring(5, 7), 16);
  return `rgba(${R}, ${G}, ${B}, ${alpha})`;
};

export function ThemeProvider({ children }) {
  const dispatch = useDispatch();
  const reduxUser = useSelector((state) => state.auth.user);
  const token = useSelector((state) => state.auth.token);
  const refreshSiteSettings = useRefreshSiteSettings();

  const [themes, setThemes] = useState([]);
  const [activeTheme, setActiveTheme] = useState(null);
  const [defaultTheme, setDefaultTheme] = useState(null);
  const [loadingThemes, setLoadingThemes] = useState(true);

  // Fetch themes from backend
  const fetchThemes = useCallback(async () => {
    try {
      setLoadingThemes(true);
      const res = await themeService.getThemes();
      if (res.data?.success) {
        const themesList = res.data.data;
        setThemes(themesList);

        const def = themesList.find((t) => t.isDefault) || themesList[0] || null;
        setDefaultTheme(def);
        return { themesList, def };
      }
    } catch (err) {
      console.warn("Failed to load themes from API:", err.message);
    } finally {
      setLoadingThemes(false);
    }
    return { themesList: [], def: null };
  }, []);

  // Apply theme properties dynamically to DOM and update localStorage cache
  const applyTheme = useCallback((theme) => {
    if (!theme) return;
    
    // Update active theme state immediately so UI (checkmark) reflects the change
    setActiveTheme(theme);

    // Set CSS Variable custom properties
    document.documentElement.style.setProperty("--sai-sidebar-bg", theme.sidebarBg);
    document.documentElement.style.setProperty("--sai-sidebar-font", theme.sidebarFont);
    document.documentElement.style.setProperty("--sai-active-tab-bg", theme.activeTabBg);
    document.documentElement.style.setProperty("--sai-active-tab-color", theme.activeTabFont);
    document.documentElement.style.setProperty("--sai-navbar-bg", theme.navbarBg);
    document.documentElement.style.setProperty("--sai-navbar-font", theme.navbarFont);
    document.documentElement.style.setProperty("--sai-main-bg", theme.mainCanvasBg);
    document.documentElement.style.setProperty("--sai-main-font", theme.mainFontColor);
    document.documentElement.style.setProperty("--sai-cta-bg", theme.primaryButtonBg);
    document.documentElement.style.setProperty("--sai-cta-hover-bg", theme.buttonHoverBg);
    document.documentElement.style.setProperty("--sai-footer-bg", theme.footerBg || "#1E1B4B");
    document.documentElement.style.setProperty("--sai-footer-font", theme.footerFont || "#E0E7FF");
    document.documentElement.style.setProperty("--sai-icon-color", theme.iconColor || theme.primaryButtonBg || "#4F46E5");
    document.documentElement.style.setProperty("--sai-pagination-bg", theme.paginationBg || theme.primaryButtonBg || "#4F46E5");
    document.documentElement.style.setProperty("--sai-pagination-font", theme.paginationFont || "#FFFFFF");

    const primary = sanitizeHex(theme.primaryButtonBg, "#4F46E5");
    const secondary = sanitizeHex(theme.activeTabBg, "#6366F1");
    const primaryDark = theme.buttonHoverBg;
    const primaryLight = hexToRgba(primary, 0.08);
    const primaryMid = theme.activeTabFont;
    const sidebarActive = theme.activeTabBg;
    const sidebarHover = hexToRgba(secondary, 0.15);
    const saiSidebarHover = adjustColorBrightness(theme.sidebarBg, -15);

    // Get RGB components string for dynamic translucent backgrounds/borders
    const getRgbStr = (hexVal) => {
      let cleanHex = sanitizeHex(hexVal, "#4F46E5");
      const R = parseInt(cleanHex.substring(1, 3), 16);
      const G = parseInt(cleanHex.substring(3, 5), 16);
      const B = parseInt(cleanHex.substring(5, 7), 16);
      return `${R}, ${G}, ${B}`;
    };
    const primaryRgb = getRgbStr(theme.primaryButtonBg);
    document.documentElement.style.setProperty("--primary-btn-rgb", primaryRgb);

    document.documentElement.style.setProperty("--color-primary", primary);
    document.documentElement.style.setProperty("--color-primary-dark", primaryDark);
    document.documentElement.style.setProperty("--color-primary-light", primaryLight);
    document.documentElement.style.setProperty("--color-primary-mid", primaryMid);
    document.documentElement.style.setProperty("--text-link", primary);
    document.documentElement.style.setProperty("--bg-sidebar-active", sidebarActive);
    document.documentElement.style.setProperty("--bg-sidebar-hover", sidebarHover);
    document.documentElement.style.setProperty("--sai-sidebar-hover", saiSidebarHover);

    // Compute comprehensive theme variables
    const mainBg = sanitizeHex(theme.mainCanvasBg, "#F8FAFC");
    const mainFont = sanitizeHex(theme.mainFontColor, "#0F172A");

    // Helper to calculate brightness
    const getBrightness = (hex) => {
      let cleanHex = sanitizeHex(hex, "#FFFFFF");
      try {
        const R = parseInt(cleanHex.substring(1, 3), 16);
        const G = parseInt(cleanHex.substring(3, 5), 16);
        const B = parseInt(cleanHex.substring(5, 7), 16);
        return Math.sqrt(0.299 * (R * R) + 0.587 * (G * G) + 0.114 * (B * B));
      } catch (e) {
        return 255;
      }
    };

    const canvasBrightness = getBrightness(mainBg);
    const isDarkCanvas = canvasBrightness < 130;

    let cardBg = "#FFFFFF";
    let cardText = mainFont;
    let inputBg = "#FFFFFF";
    let inputText = mainFont;
    let tableHeaderBg = "#F8FAFC";
    let tableHeaderText = "#475569";
    let borderColor = "#E2E8F0";
    let textSecondary = "#475569";
    let textTertiary = "#94A3B8";

    if (isDarkCanvas) {
      const navbarBrightness = theme.navbarBg ? getBrightness(theme.navbarBg) : 255;
      if (navbarBrightness < 130) {
        cardBg = theme.navbarBg;
      } else {
        cardBg = mainBg === "#000000" ? "#121212" : adjustColorBrightness(mainBg, 15);
      }
      cardText = mainFont;
      inputBg = mainBg === "#000000" ? "#1A1A1A" : adjustColorBrightness(mainBg, 8);
      inputText = mainFont;
      tableHeaderBg = mainBg === "#000000" ? "#222222" : adjustColorBrightness(mainBg, 22);
      tableHeaderText = adjustColorBrightness(mainFont, -15);
      borderColor = hexToRgba(mainFont, 0.15);
      textSecondary = adjustColorBrightness(mainFont, -25);
      textTertiary = adjustColorBrightness(mainFont, -40);
    }

    // Set full dynamic theme variables on document root
    document.documentElement.style.setProperty("--sidebar-bg", theme.sidebarBg);
    document.documentElement.style.setProperty("--sidebar-text", theme.sidebarFont);
    document.documentElement.style.setProperty("--navbar-bg", theme.navbarBg);
    document.documentElement.style.setProperty("--navbar-text", theme.navbarFont);
    document.documentElement.style.setProperty("--page-bg", theme.mainCanvasBg);
    document.documentElement.style.setProperty("--page-text", theme.mainFontColor);
    
    document.documentElement.style.setProperty("--card-bg", cardBg);
    document.documentElement.style.setProperty("--card-text", cardText);
    document.documentElement.style.setProperty("--input-bg", inputBg);
    document.documentElement.style.setProperty("--input-text", inputText);
    
    document.documentElement.style.setProperty("--primary-btn", theme.primaryButtonBg);
    document.documentElement.style.setProperty("--primary-btn-hover", theme.buttonHoverBg);
    document.documentElement.style.setProperty("--secondary-btn", theme.activeTabBg);
    document.documentElement.style.setProperty("--icon-color", theme.iconColor || theme.primaryButtonBg || "#4F46E5");
    document.documentElement.style.setProperty("--pagination-bg", theme.paginationBg || theme.primaryButtonBg || "#4F46E5");
    document.documentElement.style.setProperty("--pagination-font", theme.paginationFont || "#FFFFFF");
    
    document.documentElement.style.setProperty("--table-bg", cardBg);
    document.documentElement.style.setProperty("--table-header", tableHeaderBg);
    document.documentElement.style.setProperty("--table-header-bg", tableHeaderBg);
    document.documentElement.style.setProperty("--table-header-text", tableHeaderText);
    
    document.documentElement.style.setProperty("--border-color", borderColor);
    document.documentElement.style.setProperty("--success", "#10B981");
    document.documentElement.style.setProperty("--warning", "#F59E0B");
    document.documentElement.style.setProperty("--danger", "#EF4444");
    document.documentElement.style.setProperty("--success-color", "#10B981");
    document.documentElement.style.setProperty("--warning-color", "#F59E0B");
    document.documentElement.style.setProperty("--danger-color", "#EF4444");

    document.documentElement.style.setProperty("--text-secondary", textSecondary);
    document.documentElement.style.setProperty("--text-tertiary", textTertiary);
    document.documentElement.style.setProperty("--sai-text-secondary", textSecondary);
    document.documentElement.style.setProperty("--sai-text-tertiary", textTertiary);
    document.documentElement.style.setProperty("--sai-table-header", tableHeaderBg);
    document.documentElement.style.setProperty("--sai-card-bg", cardBg);
    document.documentElement.style.setProperty("--sai-card-text", cardText);
    document.documentElement.style.setProperty("--sai-input-bg", inputBg);
    document.documentElement.style.setProperty("--sai-input-text", inputText);
    document.documentElement.style.setProperty("--sai-border-color", borderColor);

    // Set compatibility layout variables
    document.documentElement.style.setProperty("--bg-sidebar", theme.sidebarBg);
    document.documentElement.style.setProperty("--text-sidebar", theme.sidebarFont);
    document.documentElement.style.setProperty("--bg-sidebar-active", theme.activeTabBg);
    document.documentElement.style.setProperty("--text-sidebar-active", theme.activeTabFont);
    document.documentElement.style.setProperty("--bg-sidebar-hover", saiSidebarHover);
    document.documentElement.style.setProperty("--bg-navbar", theme.navbarBg);
    document.documentElement.style.setProperty("--text-navbar", theme.navbarFont);
    document.documentElement.style.setProperty("--bg-base", theme.mainCanvasBg);
    document.documentElement.style.setProperty("--bg-surface", cardBg);
    document.documentElement.style.setProperty("--bg-subtle", tableHeaderBg);
    document.documentElement.style.setProperty("--text-primary", theme.mainFontColor);
    document.documentElement.style.setProperty("--text-link", theme.primaryButtonBg);

    // Sync to sai_* keys in localStorage to keep existing layout styles immediately compatible
    localStorage.setItem("sai_sidebar_bg", theme.sidebarBg);
    localStorage.setItem("sai_sidebar_font", theme.sidebarFont);
    localStorage.setItem("sai_navbar_bg", theme.navbarBg);
    localStorage.setItem("sai_navbar_font", theme.navbarFont);
    localStorage.setItem("sai_main_bg", theme.mainCanvasBg);
    localStorage.setItem("sai_main_font", theme.mainFontColor);
    localStorage.setItem("sai_active_tab_bg", theme.activeTabBg);
    localStorage.setItem("sai_active_tab_color", theme.activeTabFont);
    localStorage.setItem("sai_cta_bg", theme.primaryButtonBg);
    localStorage.setItem("sai_cta_hover_bg", theme.buttonHoverBg);
    localStorage.setItem("sai_theme_color", theme.primaryButtonBg);
    localStorage.setItem("sai_theme_secondary_color", theme.activeTabBg);
    localStorage.setItem("sai_footer_bg", theme.footerBg || "#1E1B4B");
    localStorage.setItem("sai_footer_font", theme.footerFont || "#E0E7FF");
    localStorage.setItem("sai_icon_color", theme.iconColor || theme.primaryButtonBg || "#4F46E5");
    localStorage.setItem("sai_pagination_bg", theme.paginationBg || theme.primaryButtonBg || "#4F46E5");
    localStorage.setItem("sai_pagination_font", theme.paginationFont || "#FFFFFF");

    const fontFamily = theme.fontFamily || "Inter";
    localStorage.setItem("sai_font_family", fontFamily);

    let fontValue = "system-ui";
    const defaultFonts = ["inter", "plus jakarta sans"];
    if (fontFamily && fontFamily !== "system-ui") {
      if (fontFamily.toLowerCase() === "inter") {
        fontValue = `'Inter', 'Inter Fallback', sans-serif`;
      } else if (fontFamily.toLowerCase() === "plus jakarta sans") {
        fontValue = `'Inter', 'Inter Fallback', sans-serif`;
      } else {
        fontValue = `'${fontFamily}', sans-serif`;
      }
      const fontId = `google-font-${fontFamily.replace(/\s+/g, '-').toLowerCase()}`;
      const isDefault = defaultFonts.includes(fontFamily.toLowerCase());
      
      if (!isDefault && !document.getElementById(fontId)) {
        const link = document.createElement("link");
        link.id = fontId;
        link.rel = "stylesheet";
        link.href = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/\s+/g, '+')}:wght@300;400;500;600;700;800&display=swap`;
        document.head.appendChild(link);
      }
    }
    document.documentElement.style.setProperty("--sai-font-family", fontValue);

    // Automatically set data-theme-custom attribute
    const isCustom = !!reduxUser && reduxUser.themeId === theme.id;
    document.documentElement.setAttribute("data-theme-custom", isCustom ? "true" : "false");
  }, [reduxUser]);

  // Load appropriate theme (user preference or system default)
  const loadTheme = useCallback(
    async (user) => {
      // 1. Fetch available themes if not loaded yet
      let currentThemes = themes;
      let defTheme = defaultTheme;
      if (themes.length === 0) {
        const res = await fetchThemes();
        currentThemes = res.themesList;
        defTheme = res.def;
      }

      // 2. Identify the active theme
      let selectedTheme = null;
      if (user && user.themeId) {
        // Preference inside user profile (full theme details might be fetched in user relation)
        selectedTheme = user.theme || currentThemes.find((t) => t.id === user.themeId);
      }

      // Fallback to default
      if (!selectedTheme) {
        selectedTheme = defTheme;
      }

      if (selectedTheme) {
        setActiveTheme(selectedTheme);
        applyTheme(selectedTheme);
      }
    },
    [themes, defaultTheme, fetchThemes, applyTheme]
  );

  // Save selected theme preference for the user
  const saveTheme = async (themeId) => {
    try {
      const res = await themeService.saveUserTheme(themeId);
      if (res.data?.success) {
        // Refresh redux profile so user.themeId is updated
        dispatch(loadUser());
        
        // Find theme locally and apply immediately
        const theme = themes.find((t) => t.id === themeId);
        if (theme) {
          setActiveTheme(theme);
          applyTheme(theme);
        }
        return { success: true, message: res.data.message };
      }
    } catch (err) {
      return { success: false, message: err.response?.data?.message || err.message };
    }
    return { success: false, message: "Save theme failed" };
  };

  // Fetch themes list on initial mount and when token changes
  useEffect(() => {
    fetchThemes();
  }, [token, fetchThemes]);

  // Load and apply theme dynamically on user changes
  useEffect(() => {
    loadTheme(reduxUser);
  }, [reduxUser, loadTheme]);

  return (
    <ThemeContext.Provider
      value={{
        themes,
        activeTheme,
        defaultTheme,
        loadingThemes,
        refreshThemes: fetchThemes,
        loadTheme,
        applyTheme,
        saveTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
