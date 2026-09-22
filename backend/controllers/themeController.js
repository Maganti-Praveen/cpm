// Controller logic for managing theme operations.
// Processes incoming requests, performs validation, and communicates with services.

import prisma from "../config/prisma.js";
import { getCache, setCache, invalidateThemes } from "../utils/cache.js";
import { parsePermissions } from "../utils/permissionParser.js";

// GET /api/themes
export const getThemes = async (req, res) => {
  try {
    const cacheKey = "themes:list";
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      return res.json({ success: true, data: cachedData });
    }

    const themes = await prisma.theme.findMany({
      orderBy: { name: "asc" },
    });

    await setCache(cacheKey, themes, 3600);

    res.json({ success: true, data: themes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/themes
export const createTheme = async (req, res) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({ success: false, message: "Admin access required" });
    }

    const isMainAdmin = req.user.isSuperAdmin === true;
    if (!isMainAdmin) {
      const permissions = parsePermissions(req.user);
      if (!permissions.settings_theme) {
        return res.status(403).json({ success: false, message: "Access denied. Required permission: settings_theme" });
      }
    }

    const {
      name,
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
      isDefault,
    } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: "Theme name is required" });
    }

    // If setting this theme as default, make all other themes non-default
    if (isDefault) {
      await prisma.theme.updateMany({
        data: { isDefault: false },
      });
    }

    const theme = await prisma.theme.create({
      data: {
        name,
        sidebarBg: sidebarBg || "#1E1B4B",
        sidebarFont: sidebarFont || "#E0E7FF",
        activeTabBg: activeTabBg || "#4F46E5",
        activeTabFont: activeTabFont || "#FFFFFF",
        navbarBg: navbarBg || "#FFFFFF",
        navbarFont: navbarFont || "#475569",
        mainCanvasBg: mainCanvasBg || "#F8FAFC",
        mainFontColor: mainFontColor || "#0F172A",
        primaryButtonBg: primaryButtonBg || "#4F46E5",
        buttonHoverBg: buttonHoverBg || "#3730A3",
        footerBg: footerBg || "#1E1B4B",
        footerFont: footerFont || "#E0E7FF",
        fontFamily: fontFamily || "Inter",
        iconColor: iconColor || "#4F46E5",
        paginationBg: paginationBg || "#4F46E5",
        paginationFont: paginationFont || "#FFFFFF",
        isDefault: !!isDefault,
      },
    });

    if (isDefault) {
      await prisma.siteSettings.upsert({
        where: { singletonId: 1 },
        update: { defaultThemeId: theme.id },
        create: { singletonId: 1, defaultThemeId: theme.id },
      });
    }

    await invalidateThemes();

    res.status(201).json({ success: true, message: "Theme created successfully", data: theme });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/themes/:id
export const updateTheme = async (req, res) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({ success: false, message: "Admin access required" });
    }

    const isMainAdmin = req.user.isSuperAdmin === true;
    if (!isMainAdmin) {
      const permissions = parsePermissions(req.user);
      if (!permissions.settings_theme) {
        return res.status(403).json({ success: false, message: "Access denied. Required permission: settings_theme" });
      }
    }

    const { id } = req.params;
    const {
      name,
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
      isDefault,
    } = req.body;

    const existingTheme = await prisma.theme.findUnique({
      where: { id },
    });

    if (!existingTheme) {
      return res.status(404).json({ success: false, message: "Theme not found" });
    }

    // If toggled isDefault to true, unset others
    if (isDefault && !existingTheme.isDefault) {
      await prisma.theme.updateMany({
        data: { isDefault: false },
      });
    }

    const theme = await prisma.theme.update({
      where: { id: existingTheme.id },
      data: {
        name: name || existingTheme.name,
        sidebarBg: sidebarBg || existingTheme.sidebarBg,
        sidebarFont: sidebarFont || existingTheme.sidebarFont,
        activeTabBg: activeTabBg || existingTheme.activeTabBg,
        activeTabFont: activeTabFont || existingTheme.activeTabFont,
        navbarBg: navbarBg || existingTheme.navbarBg,
        navbarFont: navbarFont || existingTheme.navbarFont,
        mainCanvasBg: mainCanvasBg || existingTheme.mainCanvasBg,
        mainFontColor: mainFontColor || existingTheme.mainFontColor,
        primaryButtonBg: primaryButtonBg || existingTheme.primaryButtonBg,
        buttonHoverBg: buttonHoverBg || existingTheme.buttonHoverBg,
        footerBg: footerBg || existingTheme.footerBg,
        footerFont: footerFont || existingTheme.footerFont,
        fontFamily: fontFamily !== undefined ? fontFamily : existingTheme.fontFamily,
        iconColor: iconColor || existingTheme.iconColor || "#4F46E5",
        paginationBg: paginationBg || existingTheme.paginationBg || "#4F46E5",
        paginationFont: paginationFont || existingTheme.paginationFont || "#FFFFFF",
        isDefault: isDefault !== undefined ? !!isDefault : existingTheme.isDefault,
      },
    });

    if (theme.isDefault) {
      await prisma.siteSettings.upsert({
        where: { singletonId: 1 },
        update: { defaultThemeId: theme.id },
        create: { singletonId: 1, defaultThemeId: theme.id },
      });
    }

    await invalidateThemes();

    res.json({ success: true, message: "Theme updated successfully", data: theme });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/themes/default/:id
export const setDefaultTheme = async (req, res) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({ success: false, message: "Admin access required" });
    }

    const isMainAdmin = req.user.isSuperAdmin === true;
    if (!isMainAdmin) {
      const permissions = parsePermissions(req.user);
      if (!permissions.settings_theme) {
        return res.status(403).json({ success: false, message: "Access denied. Required permission: settings_theme" });
      }
    }

    const { id } = req.params;

    const existingTheme = await prisma.theme.findUnique({
      where: { id },
    });

    if (!existingTheme) {
      return res.status(404).json({ success: false, message: "Theme not found" });
    }

    // Set all themes isDefault to false
    await prisma.theme.updateMany({
      data: { isDefault: false },
    });

    // Set this theme as isDefault: true
    const theme = await prisma.theme.update({
      where: { id },
      data: { isDefault: true },
    });

    // Update SiteSettings
    await prisma.siteSettings.upsert({
      where: { singletonId: 1 },
      update: { defaultThemeId: theme.id },
      create: { singletonId: 1, defaultThemeId: theme.id },
    });

    await invalidateThemes();

    res.json({ success: true, message: `Theme '${theme.name}' set as system default`, data: theme });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Trigger hot reload
