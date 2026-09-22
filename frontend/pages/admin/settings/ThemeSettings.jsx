// Visual visual configuration selector customising logos, layouts, and brand color presets.
// Applies styling modifications.


import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../../context/ThemeContext";
import { useToast } from "../../../context/ToastContext";
import * as themeService from "../../../services/themeService";
import { adjustColorBrightness } from "../../../utils/siteSettingsHelper";
import {
  ArrowLeft,
  Palette,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Settings,
  X,
  Edit2,
  Check,
  Save,
  Undo
} from "lucide-react";

export default function ThemeSettings({ isTab = false }) {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { themes, activeTheme, defaultTheme, refreshThemes, applyTheme, saveTheme } = useTheme();

  // Preset Configurations Mapping
  const PRESETS = {
    default: {
      name: "Default Indigo",
      sidebarBg: "#1E1B4B",
      sidebarFont: "#E0E7FF",
      activeTabBg: "#6366F1",
      activeTabFont: "#FFFFFF",
      navbarBg: "#FFFFFF",
      navbarFont: "#475569",
      mainCanvasBg: "#F8FAFC",
      mainFontColor: "#0F172A",
      primaryButtonBg: "#4F46E5",
      buttonHoverBg: "#3730A3",
      footerBg: "#1E1B4B",
      footerFont: "#E0E7FF",
      fontFamily: "Inter",
      iconColor: "#6366F1",
      paginationBg: "#4F46E5",
      paginationFont: "#FFFFFF"
    },
    emerald: {
      name: "Midnight Emerald",
      sidebarBg: "#064E3B",
      sidebarFont: "#D1FAE5",
      activeTabBg: "#10B981",
      activeTabFont: "#FFFFFF",
      navbarBg: "#FFFFFF",
      navbarFont: "#374151",
      mainCanvasBg: "#F8FAFC",
      mainFontColor: "#111827",
      primaryButtonBg: "#059669",
      buttonHoverBg: "#047857",
      footerBg: "#064E3B",
      footerFont: "#D1FAE5",
      fontFamily: "Outfit",
      iconColor: "#10B981",
      paginationBg: "#059669",
      paginationFont: "#FFFFFF"
    },
    deepIndigo: {
      name: "Deep Indigo",
      sidebarBg: "#0B1120",
      sidebarFont: "#F1F5F9",
      activeTabBg: "#7C3AED",
      activeTabFont: "#FFFFFF",
      navbarBg: "#111827",
      navbarFont: "#F8FAFC",
      mainCanvasBg: "#0F172A",
      mainFontColor: "#F8FAFC",
      primaryButtonBg: "#4338CA",
      buttonHoverBg: "#312E81",
      footerBg: "#0B1120",
      footerFont: "#F1F5F9",
      fontFamily: "Inter",
      iconColor: "#7C3AED",
      paginationBg: "#4338CA",
      paginationFont: "#FFFFFF"
    },
    nordicDark: {
      name: "Nordic Dark",
      sidebarBg: "#0B1120",
      sidebarFont: "#F1F5F9",
      activeTabBg: "#0EA5E9",
      activeTabFont: "#FFFFFF",
      navbarBg: "#111827",
      navbarFont: "#F8FAFC",
      mainCanvasBg: "#0F172A",
      mainFontColor: "#F8FAFC",
      primaryButtonBg: "#0284C7",
      buttonHoverBg: "#0369A1",
      footerBg: "#0B1120",
      footerFont: "#F1F5F9",
      fontFamily: "Space Grotesk",
      iconColor: "#0EA5E9",
      paginationBg: "#0284C7",
      paginationFont: "#FFFFFF"
    }
  };

  // Form states for editing
  const [selectedThemeId, setSelectedThemeId] = useState("");
  const [themeName, setThemeName] = useState("");
  const [sidebarBg, setSidebarBg] = useState("");
  const [sidebarFont, setSidebarFont] = useState("");
  const [activeTabBg, setActiveTabBg] = useState("");
  const [activeTabFont, setActiveTabFont] = useState("");
  const [navbarBg, setNavbarBg] = useState("");
  const [navbarFont, setNavbarFont] = useState("");
  const [mainCanvasBg, setMainCanvasBg] = useState("");
  const [mainFontColor, setMainFontColor] = useState("");
  const [primaryButtonBg, setPrimaryButtonBg] = useState("");
  const [buttonHoverBg, setButtonHoverBg] = useState("");
  const [footerBg, setFooterBg] = useState("");
  const [footerFont, setFooterFont] = useState("");
  const [selectedPreset, setSelectedPreset] = useState("");
  const [fontFamily, setFontFamily] = useState("Inter");
  const [iconColor, setIconColor] = useState("");
  const [paginationBg, setPaginationBg] = useState("");
  const [paginationFont, setPaginationFont] = useState("");

  const [saving, setSaving] = useState(false);
  const [mockCtaHovered, setMockCtaHovered] = useState(false);

  // Load database theme details into state inputs
  const loadThemeToStates = useCallback((theme) => {
    if (!theme) return;
    setSelectedThemeId(theme.id);
    setThemeName(theme.name);
    setSidebarBg(theme.sidebarBg);
    setSidebarFont(theme.sidebarFont);
    setActiveTabBg(theme.activeTabBg);
    setActiveTabFont(theme.activeTabFont);
    setNavbarBg(theme.navbarBg);
    setNavbarFont(theme.navbarFont);
    setMainCanvasBg(theme.mainCanvasBg);
    setMainFontColor(theme.mainFontColor);
    setPrimaryButtonBg(theme.primaryButtonBg);
    setButtonHoverBg(theme.buttonHoverBg);
    setFooterBg(theme.footerBg || "#1E1B4B");
    setFooterFont(theme.footerFont || "#E0E7FF");
    setFontFamily(theme.fontFamily || "Inter");
    setIconColor(theme.iconColor || "#4F46E5");
    setPaginationBg(theme.paginationBg || "#4F46E5");
    setPaginationFont(theme.paginationFont || "#FFFFFF");

    // Match preset template name if possible
    const matchKey = Object.keys(PRESETS).find(
      (key) => PRESETS[key].name.toLowerCase() === theme.name.toLowerCase()
    ) || "";
    setSelectedPreset(matchKey);
  }, []);

  // Initialize theme states on load
  useEffect(() => {
    if (themes && themes.length > 0 && !selectedThemeId) {
      const initialTheme = activeTheme || defaultTheme || themes[0];
      loadThemeToStates(initialTheme);
    }
  }, [themes, activeTheme, defaultTheme, selectedThemeId, loadThemeToStates]);

  // Store original CSS variable values on mount, and restore on unmount/cancel
  useEffect(() => {
    const originalStyles = {};
    ['--primary-color', '--accent-color', '--sidebar-bg', '--sidebar-font', '--navbar-bg', '--main-canvas-bg', '--primary-button-bg'].forEach(prop => {
      originalStyles[prop] = document.documentElement.style.getPropertyValue(prop);
    });

    return () => {
      if (activeTheme) {
        applyTheme(activeTheme);
      } else {
        Object.entries(originalStyles).forEach(([prop, val]) => {
          if (val) {
            document.documentElement.style.setProperty(prop, val);
          } else {
            document.documentElement.style.removeProperty(prop);
          }
        });
      }
    };
  }, [activeTheme, applyTheme]);

  const handleCancelPreview = () => {
    if (activeTheme) {
      loadThemeToStates(activeTheme);
      applyTheme(activeTheme);
      showToast("Theme preview reverted", "info");
    }
  };

  const handleThemeSelectChange = (themeId) => {
    const theme = themes.find((t) => t.id === themeId);
    if (theme) {
      loadThemeToStates(theme);
    }
  };

  // Preset template select helper
  const applyPresetColors = (key) => {
    setSelectedPreset(key);
    const target = PRESETS[key];
    if (target) {
      // Match the preset to its database theme so save writes to the correct record
      const dbTheme = getDbThemeByPresetName(target.name);
      if (dbTheme) {
        setSelectedThemeId(dbTheme.id);
      }
      setThemeName(target.name);
      setSidebarBg(target.sidebarBg);
      setSidebarFont(target.sidebarFont);
      setActiveTabBg(target.activeTabBg);
      setActiveTabFont(target.activeTabFont);
      setNavbarBg(target.navbarBg);
      setNavbarFont(target.navbarFont);
      setMainCanvasBg(target.mainCanvasBg);
      setMainFontColor(target.mainFontColor);
      setPrimaryButtonBg(target.primaryButtonBg);
      setButtonHoverBg(target.buttonHoverBg);
      setFooterBg(target.footerBg);
      setFooterFont(target.footerFont);
      setFontFamily(target.fontFamily);
      setIconColor(target.iconColor);
      setPaginationBg(target.paginationBg);
      setPaginationFont(target.paginationFont);
    }
  };

  // Save updated theme
  const handleSaveTheme = async (e) => {
    e.preventDefault();
    if (!themeName.trim()) {
      showToast("Theme name is required", "error");
      return;
    }
    if (!selectedThemeId) {
      showToast("No theme selected", "error");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: themeName,
        sidebarBg,
        sidebarFont,
        activeTabBg,
        activeTabFont,
        navbarBg,
        navbarFont,
        mainCanvasBg,
        mainFontColor,
        primaryButtonBg,
        buttonHoverBg,
        footerBg,
        footerFont,
        fontFamily,
        iconColor,
        paginationBg,
        paginationFont,
      };

      const res = await themeService.updateTheme(selectedThemeId, payload);
      if (res.data?.success) {
        // 1. Set as system default
        await themeService.setDefaultTheme(selectedThemeId);

        // 2. Apply theme visually immediately using fresh API response
        applyTheme(res.data.data);

        // 3. Refresh themes list to get fresh data in context
        await refreshThemes();

        // 4. Save as user's personal preference (dispatches loadUser to update Redux)
        await saveTheme(selectedThemeId);

        showToast("Theme updated and applied successfully!", "success");
      } else {
        showToast(res.data?.message || "Failed to update theme", "error");
      }
    } catch (err) {
      showToast(err.response?.data?.message || err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleCtaBgChange = (newColor) => {
    setPrimaryButtonBg(newColor);
    setActiveTabBg(newColor);
    try {
      const hoverColor = adjustColorBrightness(newColor, -20);
      setButtonHoverBg(hoverColor);
    } catch (e) {
      console.warn("Failed to calculate hover color:", e);
    }
  };

  const getDbThemeByPresetName = (name) => {
    if (!themes) return null;
    return themes.find((t) => t.name.toLowerCase() === name.toLowerCase());
  };

  const applyLivePreview = useCallback(() => {
    if (!sidebarBg) return;
    document.documentElement.setAttribute("data-theme-custom", "true");
    document.documentElement.style.setProperty("--sidebar-bg", sidebarBg);
    document.documentElement.style.setProperty("--sidebar-text", sidebarFont);
    document.documentElement.style.setProperty("--navbar-bg", navbarBg);
    document.documentElement.style.setProperty("--navbar-text", navbarFont);
    document.documentElement.style.setProperty("--page-bg", mainCanvasBg);
    document.documentElement.style.setProperty("--page-text", mainFontColor);
    document.documentElement.style.setProperty("--primary-btn", primaryButtonBg);
    document.documentElement.style.setProperty("--primary-btn-hover", buttonHoverBg);
    document.documentElement.style.setProperty("--secondary-btn", activeTabBg);
    document.documentElement.style.setProperty("--icon-color", iconColor || primaryButtonBg || "#4F46E5");
    document.documentElement.style.setProperty("--pagination-bg", paginationBg || primaryButtonBg || "#4F46E5");
    document.documentElement.style.setProperty("--pagination-font", paginationFont || "#FFFFFF");

    const getBrightness = (hex) => {
      if (!hex || !hex.startsWith("#")) return 255;
      try {
        const R = parseInt(hex.substring(1, 3), 16) || 0;
        const G = parseInt(hex.substring(3, 5), 16) || 0;
        const B = parseInt(hex.substring(5, 7), 16) || 0;
        return Math.sqrt(0.299 * (R * R) + 0.587 * (G * G) + 0.114 * (B * B));
      } catch (e) {
        return 255;
      }
    };
    
    const isDarkCanvas = getBrightness(mainCanvasBg) < 130;
    let cardBg = "#FFFFFF";
    let cardText = mainFontColor;
    let inputBg = "#FFFFFF";
    let inputText = mainFontColor;
    let tableHeaderBg = "#F8FAFC";
    let tableHeaderText = "#475569";
    let borderColor = "#E2E8F0";

    if (isDarkCanvas) {
      const navbarBrightness = navbarBg ? getBrightness(navbarBg) : 255;
      if (navbarBrightness < 130) {
        cardBg = navbarBg;
      } else {
        cardBg = mainCanvasBg === "#000000" ? "#121212" : adjustColorBrightness(mainCanvasBg, 15);
      }
      cardText = mainFontColor;
      inputBg = mainCanvasBg === "#000000" ? "#1A1A1A" : adjustColorBrightness(mainCanvasBg, 8);
      inputText = mainFontColor;
      tableHeaderBg = mainCanvasBg === "#000000" ? "#222222" : adjustColorBrightness(mainCanvasBg, 22);
      tableHeaderText = adjustColorBrightness(mainFontColor, -15);
      borderColor = "rgba(255, 255, 255, 0.15)";
    }

    document.documentElement.style.setProperty("--card-bg", cardBg);
    document.documentElement.style.setProperty("--card-text", cardText);
    document.documentElement.style.setProperty("--input-bg", inputBg);
    document.documentElement.style.setProperty("--input-text", inputText);
    document.documentElement.style.setProperty("--table-header-bg", tableHeaderBg);
    document.documentElement.style.setProperty("--table-header-text", tableHeaderText);
    document.documentElement.style.setProperty("--border-color", borderColor);

    // Keep compatibility variables in sync
    document.documentElement.style.setProperty("--sai-sidebar-bg", sidebarBg);
    document.documentElement.style.setProperty("--sai-sidebar-font", sidebarFont);
    document.documentElement.style.setProperty("--sai-active-tab-bg", activeTabBg);
    document.documentElement.style.setProperty("--sai-active-tab-color", activeTabFont);
    document.documentElement.style.setProperty("--sai-navbar-bg", navbarBg);
    document.documentElement.style.setProperty("--sai-navbar-font", navbarFont);
    document.documentElement.style.setProperty("--sai-main-bg", mainCanvasBg);
    document.documentElement.style.setProperty("--sai-main-font", mainFontColor);
    document.documentElement.style.setProperty("--sai-cta-bg", primaryButtonBg);
    document.documentElement.style.setProperty("--sai-cta-hover-bg", buttonHoverBg);
    document.documentElement.style.setProperty("--sai-icon-color", iconColor || primaryButtonBg || "#4F46E5");
    document.documentElement.style.setProperty("--sai-pagination-bg", paginationBg || primaryButtonBg || "#4F46E5");
    document.documentElement.style.setProperty("--sai-pagination-font", paginationFont || "#FFFFFF");
  }, [
    sidebarBg, sidebarFont, activeTabBg, activeTabFont, navbarBg, navbarFont,
    mainCanvasBg, mainFontColor, primaryButtonBg, buttonHoverBg, iconColor,
    paginationBg, paginationFont
  ]);

  // Trigger preview on input change
  useEffect(() => {
    applyLivePreview();
  }, [
    sidebarBg, sidebarFont, activeTabBg, activeTabFont, navbarBg, navbarFont,
    mainCanvasBg, mainFontColor, primaryButtonBg, buttonHoverBg, iconColor,
    paginationBg, paginationFont, applyLivePreview
  ]);

  // Restore saved theme on unmount
  useEffect(() => {
    return () => {
      if (activeTheme) {
        applyTheme(activeTheme);
      }
    };
  }, [activeTheme, applyTheme]);

  const handleResetToThemeDefaults = () => {
    const currentTheme = themes.find((t) => t.id === selectedThemeId);
    if (currentTheme) {
      loadThemeToStates(currentTheme);
    }
  };

  return (
    <div className={isTab ? "" : "w-full bg-[#F8FAFC] min-h-[85vh] font-sans antialiased text-[#0F172A]"}>
      
      {/* Header Area */}
      {!isTab && (
        <div className="mb-8 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/admin/settings")}
              className="flex items-center justify-center w-9 h-9 rounded-lg border border-[#CBD5E1] hover:bg-[#F1F5F9] transition-colors cursor-pointer bg-white"
            >
              <ArrowLeft size={16} className="text-[#64748B]" />
            </button>
            <div className="text-left">
              <h1 className="text-[1.75rem] font-bold text-[#0F172A] font-display flex items-center gap-3">
                <Palette className="w-7 h-7 text-[#4F46E5]" />
                Theme Settings
              </h1>
              <p className="text-sm text-[#475569] font-normal mt-1">
                Manage portal themes, colors, and configure system-wide styling defaults.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm flex flex-col relative text-left">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <Palette className="w-6 h-6 text-[#4F46E5]" />
            <h3 className="text-lg font-bold text-slate-900 font-display">
              Theme Configurations & Customizer
            </h3>
          </div>
        </div>
          <form onSubmit={handleSaveTheme} className="space-y-6">

            {/* Theme Presets Grid */}
            <div className="space-y-4 mb-8">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Theme Identities</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.keys(PRESETS).map((key) => {
                  const preset = PRESETS[key];
                  const dbTheme = getDbThemeByPresetName(preset.name);
                  const isDbDefault = dbTheme?.isDefault;
                  const isCurrentPreview = selectedPreset === key;
                  const isActiveTheme = activeTheme?.name === preset.name;

                  return (
                    <div
                      key={key}
                      className={`themed-card flex flex-col relative overflow-hidden transition-all duration-300 border-2 cursor-pointer ${
                        isActiveTheme
                          ? "border-[var(--primary-btn,#4F46E5)] ring-2 ring-[var(--primary-btn,#4F46E5)]/20"
                          : isCurrentPreview
                          ? "border-[#4F46E5] ring-2 ring-[#4F46E5]/10"
                          : "border-slate-200"
                      }`}
                      onClick={() => applyPresetColors(key)}
                    >
                      {/* ── Mini UI Preview (Figma-style) ── */}
                      <div className="flex overflow-hidden" style={{ height: "88px" }}>
                        {/* Mini Sidebar */}
                        <div className="flex flex-col gap-1 px-1.5 pt-2 shrink-0" style={{ width: "36px", backgroundColor: preset.sidebarBg }}>
                          <div className="w-4 h-1.5 rounded-full mx-auto mb-1 opacity-60" style={{ backgroundColor: preset.sidebarFont }} />
                          <div className="w-full h-3 rounded" style={{ backgroundColor: preset.activeTabBg }} />
                          <div className="w-full h-2 rounded opacity-40" style={{ backgroundColor: preset.sidebarFont }} />
                          <div className="w-full h-2 rounded opacity-40" style={{ backgroundColor: preset.sidebarFont }} />
                          <div className="w-full h-2 rounded opacity-25" style={{ backgroundColor: preset.sidebarFont }} />
                        </div>
                        {/* Mini Content */}
                        <div className="flex-1 flex flex-col" style={{ backgroundColor: preset.mainCanvasBg }}>
                          {/* Mini Navbar */}
                          <div className="flex items-center justify-between px-2 shrink-0" style={{ height: "18px", backgroundColor: preset.navbarBg, borderBottom: `1px solid ${preset.sidebarBg}22` }}>
                            <div className="w-6 h-1.5 rounded-full opacity-60" style={{ backgroundColor: preset.navbarFont }} />
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: preset.primaryButtonBg }} />
                          </div>
                          {/* Mini Cards row */}
                          <div className="flex gap-1 p-1.5 flex-1">
                            <div className="flex-1 rounded flex flex-col gap-0.5 p-1" style={{ backgroundColor: preset.navbarBg }}>
                              <div className="w-full h-1 rounded-full opacity-50" style={{ backgroundColor: preset.mainFontColor }} />
                              <div className="w-2/3 h-1 rounded-full opacity-30" style={{ backgroundColor: preset.mainFontColor }} />
                              <div className="w-full h-1.5 rounded mt-0.5" style={{ backgroundColor: preset.primaryButtonBg }} />
                            </div>
                            <div className="flex-1 rounded flex flex-col gap-0.5 p-1" style={{ backgroundColor: preset.navbarBg }}>
                              <div className="w-full h-1 rounded-full opacity-50" style={{ backgroundColor: preset.mainFontColor }} />
                              <div className="w-1/2 h-1 rounded-full opacity-30" style={{ backgroundColor: preset.mainFontColor }} />
                              <div className="w-full h-1.5 rounded mt-0.5 opacity-60" style={{ backgroundColor: preset.activeTabBg }} />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* ── Card Footer ── */}
                      <div className="px-3 py-2.5 flex flex-col gap-2" style={{ borderTop: `1px solid rgba(0,0,0,0.07)` }}>
                        <div className="flex items-start justify-between gap-1">
                          <div>
                            <h3 className="font-display font-extrabold text-xs text-slate-800 leading-tight">{preset.name}</h3>
                            <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
                              {preset.mainCanvasBg === "#0F172A" || preset.mainCanvasBg === "#111827" ? "Dark Mode" : "Light Mode"}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            {isActiveTheme && (
                              <span className="flex items-center gap-0.5 text-[8px] font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wider text-white shadow-xs" style={{ backgroundColor: preset.primaryButtonBg }}>
                                <Check className="w-2 h-2" strokeWidth={3} /> Active
                              </span>
                            )}
                            {isDbDefault && (
                              <span className="text-[8px] font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wider border" style={{ color: preset.primaryButtonBg, borderColor: preset.primaryButtonBg + "44", backgroundColor: preset.primaryButtonBg + "11" }}>
                                Default
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); applyPresetColors(key); }}
                            className="px-2 py-1 text-[9px] font-extrabold rounded border cursor-pointer transition-colors uppercase tracking-wider"
                            style={{ background: "transparent", borderColor: preset.primaryButtonBg + "66", color: preset.primaryButtonBg }}
                          >
                            Preview
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              applyPresetColors(key);
                              const formElement = document.getElementById("theme-customization-form");
                              if (formElement) formElement.scrollIntoView({ behavior: "smooth" });
                            }}
                            className="px-2 py-1 text-[9px] font-extrabold rounded border cursor-pointer transition-colors uppercase tracking-wider"
                            style={{ background: "transparent", borderColor: "#94a3b8", color: "#64748b" }}
                          >
                            Edit
                          </button>
                          {dbTheme && !isDbDefault && (
                            <button
                              type="button"
                              onClick={async (e) => {
                                e.stopPropagation();
                                setSaving(true);
                                try {
                                  const res = await themeService.setDefaultTheme(dbTheme.id);
                                  if (res.data?.success) {
                                    showToast(`${preset.name} is now the default system theme!`, "success");
                                    await refreshThemes();
                                  }
                                } catch (err) {
                                  showToast("Failed to update default theme", "error");
                                } finally {
                                  setSaving(false);
                                }
                              }}
                              className="px-2 py-1 text-[9px] font-extrabold rounded cursor-pointer transition-colors uppercase tracking-wider border-none ml-auto text-white shadow-xs"
                              style={{ backgroundColor: preset.primaryButtonBg }}
                            >
                              Set Default
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                  );
                })}
              </div>
            </div>

            <div id="theme-customization-form" />

            {/* Widescreen Live Preview Simulator */}
            <div className="space-y-2 mb-6">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Live Preview</h4>
              {/* Dynamic google fonts link inside preview */}
              {fontFamily && fontFamily !== "Inter" && fontFamily !== "system-ui" && (
                <link
                  rel="stylesheet"
                  href={`https://fonts.googleapis.com/css2?family=${fontFamily.replace(/\s+/g, '+')}:wght@300;400;500;600;700;800&display=swap`}
                />
              )}
              <div
                className="w-full min-h-[250px] h-[300px] border border-slate-200 rounded-xl bg-slate-100 flex overflow-hidden relative shadow-inner animate-fade-in"
                style={{ 
                  fontFamily: fontFamily === "system-ui" 
                    ? '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' 
                    : `'${fontFamily}', sans-serif` 
                }}
              >
                {/* Mock Sidebar */}
                <div
                  className="w-40 shrink-0 flex flex-col p-3 border-r border-slate-200 transition-colors duration-300 text-left justify-between"
                  style={{ backgroundColor: sidebarBg, color: sidebarFont }}
                >
                  <div>
                    <div className="flex items-center gap-1.5 mb-4 opacity-90">
                      <div className="w-5 h-5 rounded bg-indigo-500/20 flex items-center justify-center shrink-0">
                        <span className="font-extrabold text-[11px]">S</span>
                      </div>
                      <span className="font-bold text-[11px] truncate">Portal Shell</span>
                    </div>

                    <nav className="space-y-1.5">
                      <div
                        className="h-5 rounded flex items-center px-2 text-[9px] font-semibold transition-colors duration-300 animate-scale-up"
                        style={{ backgroundColor: activeTabBg, color: activeTabFont }}
                      >
                        Dashboard
                      </div>
                      <div className="h-5 rounded bg-transparent flex items-center px-2 text-[9px] opacity-70">
                        Projects
                      </div>
                      <div className="h-5 rounded bg-transparent flex items-center px-2 text-[9px] opacity-70">
                        Tasks
                      </div>
                    </nav>
                  </div>

                  <div className="pt-2 border-t border-slate-100/10 opacity-80 flex items-center gap-1.5">
                    <div className="w-4.5 h-4.5 rounded-full bg-slate-100/20 flex items-center justify-center font-bold text-[8px]">
                      AD
                    </div>
                    <span className="text-[8px] font-semibold truncate">Administrator</span>
                  </div>
                </div>

                {/* Mock Main Content Area */}
                <div
                  className="flex-1 flex flex-col overflow-hidden transition-colors duration-300"
                  style={{ backgroundColor: mainCanvasBg }}
                >
                  {/* Mock Top Navbar */}
                  <div
                    className="h-10 border-b border-slate-200/20 px-4 flex items-center justify-between transition-colors duration-300 shadow-xs"
                    style={{ backgroundColor: navbarBg, color: navbarFont }}
                  >
                    <div className="w-24 h-5 rounded border border-slate-200/80 bg-slate-50 flex items-center px-2 text-[8px] opacity-60 text-slate-455">
                      Search...
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4.5 h-4.5 rounded-full bg-slate-200 shrink-0" />
                      <div className="w-4.5 h-4.5 rounded-full bg-slate-200 shrink-0" />
                    </div>
                  </div>

                  {/* Mock Canvas */}
                  <div
                    className="flex-1 p-4 text-left transition-colors duration-300 space-y-3"
                    style={{ color: mainFontColor }}
                  >
                    <div className="space-y-1 text-left">
                      <h5 className="text-[8px] font-bold uppercase tracking-wider opacity-60">Overview</h5>
                      <h2 className="text-[12px] font-bold leading-tight">Welcome, Administrator</h2>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-left">
                      <div className="bg-white p-2 rounded border border-slate-200 shadow-xs flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-[7px] font-bold opacity-60 uppercase text-slate-400">Projects</span>
                          <span className="text-[11px] font-extrabold text-slate-800">12 Active</span>
                        </div>
                        <svg className="w-4 h-4 shrink-0" style={{ color: iconColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                        </svg>
                      </div>
                      <div className="bg-white p-2 rounded border border-slate-200 shadow-xs flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-[7px] font-bold opacity-60 uppercase text-slate-400">Tasks</span>
                          <span className="text-[11px] font-extrabold text-slate-800">48 Pending</span>
                        </div>
                        <svg className="w-4 h-4 shrink-0" style={{ color: iconColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                      </div>
                    </div>

                    <div className="bg-white p-2 rounded border border-slate-200 shadow-xs flex items-center justify-between gap-2 text-left">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          style={{
                            backgroundColor: mockCtaHovered ? buttonHoverBg : primaryButtonBg,
                            color: "#FFFFFF",
                            transition: "all 0.2s"
                          }}
                          onMouseEnter={() => setMockCtaHovered(true)}
                          onMouseLeave={() => setMockCtaHovered(false)}
                          className="px-2 py-0.5 rounded text-[7px] font-bold shadow-xs border-none cursor-pointer"
                        >
                          Trigger CTA
                        </button>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-[6px] text-slate-400 mr-1 font-semibold">Page:</span>
                        <div
                          style={{
                            backgroundColor: paginationBg,
                            color: paginationFont
                          }}
                          className="w-3.5 h-3.5 rounded text-[7px] flex items-center justify-center font-extrabold shadow-xs"
                        >
                          1
                        </div>
                        <div className="w-3.5 h-3.5 rounded border border-slate-200 bg-slate-50 text-slate-600 text-[7px] flex items-center justify-center font-semibold">
                          2
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Mock Footer */}
                  <div
                    className="h-8 border-t border-slate-200/20 px-4 flex items-center justify-between transition-colors duration-300 text-[8px] shrink-0"
                    style={{ backgroundColor: footerBg, color: footerFont }}
                  >
                    <span>&copy; 2026 Portal. All rights reserved.</span>
                    <span>Help & Privacy</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Customizer controls grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-5 border-t border-slate-100">
              
              {/* Presets & Font Column */}
              <div className="space-y-4 text-left">
                <h4 className="text-[11px] font-bold text-[#475569] uppercase tracking-wider border-b border-slate-100 pb-1">
                  Presets & Font
                </h4>

                {/* Theme Name customization */}
                <div className="space-y-1.5">
                  <label htmlFor="theme-custom-name" className="text-[11px] font-bold text-slate-650 block">
                    Theme Design Name
                  </label>
                  <input
                    id="theme-custom-name"
                    type="text"
                    value={themeName}
                    onChange={(e) => setThemeName(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded text-[11px] bg-slate-50 focus:outline-none focus:bg-white font-semibold"
                    placeholder="Theme Name"
                  />
                </div>

                {/* Overall Font Family */}
                <div className="space-y-1.5">
                  <label htmlFor="theme-font-select" className="text-[11px] font-bold text-slate-650 block">
                    Overall Font Family
                  </label>
                  <select
                    id="theme-font-select"
                    value={fontFamily}
                    onChange={(e) => setFontFamily(e.target.value)}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded text-[11px] bg-slate-50 focus:outline-none focus:bg-white font-semibold cursor-pointer"
                  >
                    <option value="system-ui">Default System UI</option>
                    <option value="Inter">Inter (Modern Sans-serif)</option>
                    <option value="Outfit">Outfit (Geometrical)</option>
                    <option value="Space Grotesk">Space Grotesk (Neo-grotesque)</option>
                    <option value="Playfair Display">Playfair Display (Elegant Serif)</option>
                    <option value="Fira Code">Fira Code (Monospace)</option>
                  </select>
                </div>
              </div>

              {/* Sidebar Styling */}
              <div className="space-y-4">
                <h4 className="text-[11px] font-bold text-[#475569] uppercase tracking-wider border-b border-slate-100 pb-1">
                  Sidebar Styling
                </h4>

                {/* Sidebar Background */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-650 flex items-center justify-between">
                    <span>Background</span>
                    <span className="font-mono text-[9px] text-slate-400">{sidebarBg}</span>
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={sidebarBg}
                      onChange={(e) => setSidebarBg(e.target.value)}
                      className="w-7 h-7 rounded border border-slate-200 cursor-pointer p-0 overflow-hidden shrink-0"
                     aria-label="W-7 h-7 rounded border border-slate-200 cursor-pointer p-0 overflow-hidden shrink-0"/>
                    <input
                      type="text"
                      value={sidebarBg}
                      onChange={(e) => setSidebarBg(e.target.value)}
                      className="w-full px-2 py-1 border border-slate-200 rounded text-[11px] bg-slate-50 focus:outline-none focus:bg-white font-mono font-semibold"
                     aria-label="W-full px-2 py-1 border border-slate-200 rounded text-[11px] bg-slate-50 focus:outline-none focus:bg-white font-mono font-semibold"/>
                  </div>
                </div>

                {/* Sidebar Font Color */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-650 flex items-center justify-between">
                    <span>Font Color</span>
                    <span className="font-mono text-[9px] text-slate-400">{sidebarFont}</span>
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={sidebarFont}
                      onChange={(e) => setSidebarFont(e.target.value)}
                      className="w-7 h-7 rounded border border-slate-200 cursor-pointer p-0 overflow-hidden shrink-0"
                     aria-label="W-7 h-7 rounded border border-slate-200 cursor-pointer p-0 overflow-hidden shrink-0"/>
                    <input
                      type="text"
                      value={sidebarFont}
                      onChange={(e) => setSidebarFont(e.target.value)}
                      className="w-full px-2 py-1 border border-slate-200 rounded text-[11px] bg-slate-50 focus:outline-none focus:bg-white font-mono font-semibold"
                     aria-label="W-full px-2 py-1 border border-slate-200 rounded text-[11px] bg-slate-50 focus:outline-none focus:bg-white font-mono font-semibold"/>
                  </div>
                </div>

                {/* Active Tab Background */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-650 flex items-center justify-between">
                    <span>Active Tab Bg</span>
                    <span className="font-mono text-[9px] text-slate-400">{activeTabBg}</span>
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={activeTabBg}
                      onChange={(e) => setActiveTabBg(e.target.value)}
                      className="w-7 h-7 rounded border border-slate-200 cursor-pointer p-0 overflow-hidden shrink-0"
                     aria-label="W-7 h-7 rounded border border-slate-200 cursor-pointer p-0 overflow-hidden shrink-0"/>
                    <input
                      type="text"
                      value={activeTabBg}
                      onChange={(e) => setActiveTabBg(e.target.value)}
                      className="w-full px-2 py-1 border border-slate-200 rounded text-[11px] bg-slate-50 focus:outline-none focus:bg-white font-mono font-semibold"
                     aria-label="W-full px-2 py-1 border border-slate-200 rounded text-[11px] bg-slate-50 focus:outline-none focus:bg-white font-mono font-semibold"/>
                  </div>
                </div>

                {/* Active Tab Font Color */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-650 flex items-center justify-between">
                    <span>Active Tab Font</span>
                    <span className="font-mono text-[9px] text-slate-400">{activeTabFont}</span>
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={activeTabFont}
                      onChange={(e) => setActiveTabFont(e.target.value)}
                      className="w-7 h-7 rounded border border-slate-200 cursor-pointer p-0 overflow-hidden shrink-0"
                     aria-label="W-7 h-7 rounded border border-slate-200 cursor-pointer p-0 overflow-hidden shrink-0"/>
                    <input
                      type="text"
                      value={activeTabFont}
                      onChange={(e) => setActiveTabFont(e.target.value)}
                      className="w-full px-2 py-1 border border-slate-200 rounded text-[11px] bg-slate-50 focus:outline-none focus:bg-white font-mono font-semibold"
                     aria-label="W-full px-2 py-1 border border-slate-200 rounded text-[11px] bg-slate-50 focus:outline-none focus:bg-white font-mono font-semibold"/>
                  </div>
                </div>

              </div>

              {/* Navbar & Page BG */}
              <div className="space-y-4">
                <h4 className="text-[11px] font-bold text-[#475569] uppercase tracking-wider border-b border-slate-100 pb-1">
                  Navbar & Page BG
                </h4>

                {/* Navbar Background */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-650 flex items-center justify-between">
                    <span>Navbar Bg</span>
                    <span className="font-mono text-[9px] text-slate-400">{navbarBg}</span>
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={navbarBg}
                      onChange={(e) => setNavbarBg(e.target.value)}
                      className="w-7 h-7 rounded border border-slate-200 cursor-pointer p-0 overflow-hidden shrink-0"
                     aria-label="W-7 h-7 rounded border border-slate-200 cursor-pointer p-0 overflow-hidden shrink-0"/>
                    <input
                      type="text"
                      value={navbarBg}
                      onChange={(e) => setNavbarBg(e.target.value)}
                      className="w-full px-2 py-1 border border-slate-200 rounded text-[11px] bg-slate-50 focus:outline-none focus:bg-white font-mono font-semibold"
                     aria-label="W-full px-2 py-1 border border-slate-200 rounded text-[11px] bg-slate-50 focus:outline-none focus:bg-white font-mono font-semibold"/>
                  </div>
                </div>

                {/* Navbar Font Color */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-650 flex items-center justify-between">
                    <span>Navbar Font Color</span>
                    <span className="font-mono text-[9px] text-slate-455">{navbarFont}</span>
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={navbarFont}
                      onChange={(e) => setNavbarFont(e.target.value)}
                      className="w-7 h-7 rounded border border-slate-200 cursor-pointer p-0 overflow-hidden shrink-0"
                     aria-label="W-7 h-7 rounded border border-slate-200 cursor-pointer p-0 overflow-hidden shrink-0"/>
                    <input
                      type="text"
                      value={navbarFont}
                      onChange={(e) => setNavbarFont(e.target.value)}
                      className="w-full px-2 py-1 border border-slate-200 rounded text-[11px] bg-slate-50 focus:outline-none focus:bg-white font-mono font-semibold"
                     aria-label="W-full px-2 py-1 border border-slate-200 rounded text-[11px] bg-slate-50 focus:outline-none focus:bg-white font-mono font-semibold"/>
                  </div>
                </div>

                {/* Main Canvas Bg */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-650 flex items-center justify-between">
                    <span>Main Canvas Bg</span>
                    <span className="font-mono text-[9px] text-slate-450">{mainCanvasBg}</span>
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={mainCanvasBg}
                      onChange={(e) => setMainCanvasBg(e.target.value)}
                      className="w-7 h-7 rounded border border-slate-200 cursor-pointer p-0 overflow-hidden shrink-0"
                     aria-label="W-7 h-7 rounded border border-slate-200 cursor-pointer p-0 overflow-hidden shrink-0"/>
                    <input
                      type="text"
                      value={mainCanvasBg}
                      onChange={(e) => setMainCanvasBg(e.target.value)}
                      className="w-full px-2 py-1 border border-slate-200 rounded text-[11px] bg-slate-50 focus:outline-none focus:bg-white font-mono font-semibold"
                     aria-label="W-full px-2 py-1 border border-slate-200 rounded text-[11px] bg-slate-50 focus:outline-none focus:bg-white font-mono font-semibold"/>
                  </div>
                </div>

                {/* Main Font Color */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-650 flex items-center justify-between">
                    <span>Main Font Color</span>
                    <span className="font-mono text-[9px] text-slate-450">{mainFontColor}</span>
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={mainFontColor}
                      onChange={(e) => setMainFontColor(e.target.value)}
                      className="w-7 h-7 rounded border border-slate-200 cursor-pointer p-0 overflow-hidden shrink-0"
                     aria-label="W-7 h-7 rounded border border-slate-200 cursor-pointer p-0 overflow-hidden shrink-0"/>
                    <input
                      type="text"
                      value={mainFontColor}
                      onChange={(e) => setMainFontColor(e.target.value)}
                      className="w-full px-2 py-1 border border-slate-200 rounded text-[11px] bg-slate-50 focus:outline-none focus:bg-white font-mono font-semibold"
                     aria-label="W-full px-2 py-1 border border-slate-200 rounded text-[11px] bg-slate-50 focus:outline-none focus:bg-white font-mono font-semibold"/>
                  </div>
                </div>

                {/* Icon Color */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-650 flex items-center justify-between">
                    <span>Icon Color</span>
                    <span className="font-mono text-[9px] text-slate-450">{iconColor}</span>
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={iconColor}
                      onChange={(e) => setIconColor(e.target.value)}
                      className="w-7 h-7 rounded border border-slate-200 cursor-pointer p-0 overflow-hidden shrink-0"
                     aria-label="W-7 h-7 rounded border border-slate-200 cursor-pointer p-0 overflow-hidden shrink-0"/>
                    <input
                      type="text"
                      value={iconColor}
                      onChange={(e) => setIconColor(e.target.value)}
                      className="w-full px-2 py-1 border border-slate-200 rounded text-[11px] bg-slate-50 focus:outline-none focus:bg-white font-mono font-semibold"
                     aria-label="W-full px-2 py-1 border border-slate-200 rounded text-[11px] bg-slate-50 focus:outline-none focus:bg-white font-mono font-semibold"/>
                  </div>
                </div>
              </div>

              {/* Buttons & CTAs (and Footer) */}
              <div className="space-y-4">
                <h4 className="text-[11px] font-bold text-[#475569] uppercase tracking-wider border-b border-slate-100 pb-1">
                  Buttons & CTAs
                </h4>

                {/* Primary Button */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-650 flex items-center justify-between">
                    <span>Primary CTA Bg</span>
                    <span className="font-mono text-[9px] text-slate-450">{primaryButtonBg}</span>
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={primaryButtonBg}
                      onChange={(e) => handleCtaBgChange(e.target.value)}
                      className="w-7 h-7 rounded border border-slate-200 cursor-pointer p-0 overflow-hidden shrink-0"
                     aria-label="W-7 h-7 rounded border border-slate-200 cursor-pointer p-0 overflow-hidden shrink-0"/>
                    <input
                      type="text"
                      value={primaryButtonBg}
                      onChange={(e) => handleCtaBgChange(e.target.value)}
                      className="w-full px-2 py-1 border border-slate-200 rounded text-[11px] bg-slate-50 focus:outline-none focus:bg-white font-mono font-semibold"
                     aria-label="W-full px-2 py-1 border border-slate-200 rounded text-[11px] bg-slate-50 focus:outline-none focus:bg-white font-mono font-semibold"/>
                  </div>
                </div>

                {/* Hover Button */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-650 flex items-center justify-between">
                    <span>CTA Hover Bg</span>
                    <span className="font-mono text-[9px] text-slate-455">{buttonHoverBg}</span>
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={buttonHoverBg}
                      onChange={(e) => setButtonHoverBg(e.target.value)}
                      className="w-7 h-7 rounded border border-slate-200 cursor-pointer p-0 overflow-hidden shrink-0"
                     aria-label="W-7 h-7 rounded border border-slate-200 cursor-pointer p-0 overflow-hidden shrink-0"/>
                    <input
                      type="text"
                      value={buttonHoverBg}
                      onChange={(e) => setButtonHoverBg(e.target.value)}
                      className="w-full px-2 py-1 border border-slate-200 rounded text-[11px] bg-slate-50 focus:outline-none focus:bg-white font-mono font-semibold"
                     aria-label="W-full px-2 py-1 border border-slate-200 rounded text-[11px] bg-slate-50 focus:outline-none focus:bg-white font-mono font-semibold"/>
                  </div>
                </div>

                {/* Pagination Background */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-650 flex items-center justify-between">
                    <span>Pagination Bg</span>
                    <span className="font-mono text-[9px] text-slate-450">{paginationBg}</span>
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={paginationBg}
                      onChange={(e) => setPaginationBg(e.target.value)}
                      className="w-7 h-7 rounded border border-slate-200 cursor-pointer p-0 overflow-hidden shrink-0"
                     aria-label="W-7 h-7 rounded border border-slate-200 cursor-pointer p-0 overflow-hidden shrink-0"/>
                    <input
                      type="text"
                      value={paginationBg}
                      onChange={(e) => setPaginationBg(e.target.value)}
                      className="w-full px-2 py-1 border border-slate-200 rounded text-[11px] bg-slate-50 focus:outline-none focus:bg-white font-mono font-semibold"
                     aria-label="W-full px-2 py-1 border border-slate-200 rounded text-[11px] bg-slate-50 focus:outline-none focus:bg-white font-mono font-semibold"/>
                  </div>
                </div>

                {/* Pagination Font */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-650 flex items-center justify-between">
                    <span>Pagination Font</span>
                    <span className="font-mono text-[9px] text-slate-450">{paginationFont}</span>
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={paginationFont}
                      onChange={(e) => setPaginationFont(e.target.value)}
                      className="w-7 h-7 rounded border border-slate-200 cursor-pointer p-0 overflow-hidden shrink-0"
                     aria-label="W-7 h-7 rounded border border-slate-200 cursor-pointer p-0 overflow-hidden shrink-0"/>
                    <input
                      type="text"
                      value={paginationFont}
                      onChange={(e) => setPaginationFont(e.target.value)}
                      className="w-full px-2 py-1 border border-slate-200 rounded text-[11px] bg-slate-50 focus:outline-none focus:bg-white font-mono font-semibold"
                     aria-label="W-full px-2 py-1 border border-slate-200 rounded text-[11px] bg-slate-50 focus:outline-none focus:bg-white font-mono font-semibold"/>
                  </div>
                </div>

                {/* Footer Background */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <label className="text-[11px] font-bold text-slate-650 flex items-center justify-between">
                    <span>Footer Bg</span>
                    <span className="font-mono text-[9px] text-slate-400">{footerBg}</span>
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={footerBg}
                      onChange={(e) => setFooterBg(e.target.value)}
                      className="w-7 h-7 rounded border border-slate-200 cursor-pointer p-0 overflow-hidden shrink-0"
                     aria-label="W-7 h-7 rounded border border-slate-200 cursor-pointer p-0 overflow-hidden shrink-0"/>
                    <input
                      type="text"
                      value={footerBg}
                      onChange={(e) => setFooterBg(e.target.value)}
                      className="w-full px-2 py-1 border border-slate-200 rounded text-[11px] bg-slate-50 focus:outline-none focus:bg-white font-mono font-semibold"
                     aria-label="W-full px-2 py-1 border border-slate-200 rounded text-[11px] bg-slate-50 focus:outline-none focus:bg-white font-mono font-semibold"/>
                  </div>
                </div>

                {/* Footer Font Color */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-650 flex items-center justify-between">
                    <span>Footer Font</span>
                    <span className="font-mono text-[9px] text-slate-455">{footerFont}</span>
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={footerFont}
                      onChange={(e) => setFooterFont(e.target.value)}
                      className="w-7 h-7 rounded border border-slate-200 cursor-pointer p-0 overflow-hidden shrink-0"
                     aria-label="W-7 h-7 rounded border border-slate-200 cursor-pointer p-0 overflow-hidden shrink-0"/>
                    <input
                      type="text"
                      value={footerFont}
                      onChange={(e) => setFooterFont(e.target.value)}
                      className="w-full px-2 py-1 border border-slate-200 rounded text-[11px] bg-slate-50 focus:outline-none focus:bg-white font-mono font-semibold"
                     aria-label="W-full px-2 py-1 border border-slate-200 rounded text-[11px] bg-slate-50 focus:outline-none focus:bg-white font-mono font-semibold"/>
                  </div>
                </div>
              </div>

            </div>

            {/* Save and Cancel actions */}
            <div className="mt-8 pt-4 border-t border-slate-100 flex justify-between items-center">
              <button
                type="button"
                onClick={handleResetToThemeDefaults}
                className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                <Undo className="w-4 h-4" />
                Reset Theme Defaults
              </button>
              
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCancelPreview}
                  className="px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Cancel Preview
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-[#4F46E5] hover:bg-[#3730A3] text-white text-xs font-bold rounded-lg shadow-sm transition-all duration-200 cursor-pointer uppercase tracking-wider flex items-center gap-1.5"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {saving ? "Saving..." : "Save Theme"}
                </button>
              </div>
            </div>

          </form>
        </div>
    </div>
  );
}
