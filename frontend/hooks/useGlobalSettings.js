// Pulls current branding configurations and colors from SiteSettingsContext.
// Helps components avoid duplicate settings fetches or reading directly from localStorage.

import { useSiteSettings, useRefreshSiteSettings } from "../context/SiteSettingsContext";

// returns current site settings
export function useGlobalSettings() {
  return useSiteSettings();
}

// Re-export for Settings.jsx direct-call refresh
export { useRefreshSiteSettings };
