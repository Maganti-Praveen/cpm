// Formats system hex colors and evaluates brightness for accessibility.
// Generates dynamic inline styles to configure site themes.


export const sanitizeHex = (hex, defaultHex) => {
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

export const adjustColorBrightness = (hex, percent) => {
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

// apply saved site settings from localStorage to the DOM

export const applySiteSettings = () => {
  const siteTitle = localStorage.getItem("sai_site_title") || "Sai CRP";
  const metaTitle = localStorage.getItem("sai_meta_title") || "Sai IT Services - Project Management Portal";
  const metaDescription = localStorage.getItem("sai_meta_description") || 
    "Sai IT Services Client Relationship Portal for streamlined client project management, milestones tracking, and document collaboration.";
  const browserFavicon = localStorage.getItem("sai_site_favicon") || "";

  // 1. Update Document Title
  document.title = metaTitle || siteTitle;

  // 2. Update Meta Title Tag
  let metaTitleTag = document.querySelector("meta[name='title']");
  if (!metaTitleTag) {
    metaTitleTag = document.createElement("meta");
    metaTitleTag.name = "title";
    document.head.appendChild(metaTitleTag);
  }
  metaTitleTag.content = metaTitle || siteTitle;

  // 3. Update Meta Description Tag
  let metaDescTag = document.querySelector("meta[name='description']");
  if (!metaDescTag) {
    metaDescTag = document.createElement("meta");
    metaDescTag.name = "description";
    document.head.appendChild(metaDescTag);
  }
  metaDescTag.content = metaDescription;

  // 4. Update Favicon Link Tag
  let faviconTag = document.querySelector("link[rel~='icon']");
  if (!faviconTag) {
    faviconTag = document.createElement("link");
    faviconTag.rel = "icon";
    document.head.appendChild(faviconTag);
  }
  if (browserFavicon) {
    faviconTag.href = browserFavicon;
  } else {
    faviconTag.href = "/logo.webp"; // default fallback (avoid 404 console errors since favicon.ico doesn't exist)
  }

  // Check if a custom theme is active
  const hasCustomTheme = document.documentElement.getAttribute("data-theme-custom") === "true";
  if (hasCustomTheme) {
    return; // Do NOT overwrite theme variables!
  }

  // 5. Compute and Override CSS Theme Custom Properties dynamically
  const primary = sanitizeHex(localStorage.getItem("sai_theme_color"), "#4F46E5");
  const secondary = sanitizeHex(localStorage.getItem("sai_theme_secondary_color"), "#6366F1");

  const primaryDark = adjustColorBrightness(primary, -20);
  const primaryLight = hexToRgba(primary, 0.08);
  const primaryMid = secondary;
  const sidebarActive = localStorage.getItem("sai_active_tab_bg") || primary;
  const sidebarHover = hexToRgba(secondary, 0.15);

  document.documentElement.style.setProperty("--color-primary", primary);
  document.documentElement.style.setProperty("--color-primary-dark", primaryDark);
  document.documentElement.style.setProperty("--color-primary-light", primaryLight);
  document.documentElement.style.setProperty("--color-primary-mid", primaryMid);
  document.documentElement.style.setProperty("--text-link", primary);
  document.documentElement.style.setProperty("--bg-sidebar-active", sidebarActive);
  document.documentElement.style.setProperty("--bg-sidebar-hover", sidebarHover);

  // 6. apply custom theme colors
  const sidebarBg = localStorage.getItem("sai_sidebar_bg") || "#1E1B4B";
  const sidebarFont = localStorage.getItem("sai_sidebar_font") || "#E0E7FF";
  const navbarBg = localStorage.getItem("sai_navbar_bg") || "#FFFFFF";
  const navbarFont = localStorage.getItem("sai_navbar_font") || "#475569";
  const mainBg = localStorage.getItem("sai_main_bg") || "#F8FAFC";
  const mainFont = localStorage.getItem("sai_main_font") || "#0F172A";
  const activeTabBg = localStorage.getItem("sai_active_tab_bg") || "#4F46E5";
  const activeTabColor = localStorage.getItem("sai_active_tab_color") || "#FFFFFF";
  const ctaBg = localStorage.getItem("sai_cta_bg") || "#4F46E5";
  const ctaHoverBg = localStorage.getItem("sai_cta_hover_bg") || "#3730A3";
  const fontFamily = localStorage.getItem("sai_font_family") || "Inter";

  document.documentElement.style.setProperty("--sai-sidebar-bg", sidebarBg);
  document.documentElement.style.setProperty("--sai-sidebar-font", sidebarFont);
  document.documentElement.style.setProperty("--sai-navbar-bg", navbarBg);
  document.documentElement.style.setProperty("--sai-navbar-font", navbarFont);
  document.documentElement.style.setProperty("--sai-main-bg", mainBg);
  document.documentElement.style.setProperty("--sai-main-font", mainFont);
  document.documentElement.style.setProperty("--sai-active-tab-bg", activeTabBg);
  document.documentElement.style.setProperty("--sai-active-tab-color", activeTabColor);
  document.documentElement.style.setProperty("--sai-cta-bg", ctaBg);
  document.documentElement.style.setProperty("--sai-cta-hover-bg", ctaHoverBg);
  
  const footerBg = localStorage.getItem("sai_footer_bg") || "#1E1B4B";
  const footerFont = localStorage.getItem("sai_footer_font") || "#E0E7FF";
  document.documentElement.style.setProperty("--sai-footer-bg", footerBg);
  document.documentElement.style.setProperty("--sai-footer-font", footerFont);
  
  const saiSidebarHover = adjustColorBrightness(sidebarBg, -15);
  document.documentElement.style.setProperty("--sai-sidebar-hover", saiSidebarHover);

  // Dynamically load Google Font families
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
      link.rel = "preload";
      link.as = "style";
      link.href = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/\s+/g, '+')}:wght@300;400;500;600;700;800&display=swap`;
      link.onload = function() {
        this.onload = null;
        this.rel = "stylesheet";
      };
      document.head.appendChild(link);
    }
  }
  document.documentElement.style.setProperty("--sai-font-family", fontValue);
};
