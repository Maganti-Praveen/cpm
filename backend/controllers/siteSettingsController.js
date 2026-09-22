// Controller logic for managing siteSettings operations.
// Processes incoming requests, performs validation, and communicates with services.

import prisma from "../config/prisma.js";
import path from "path";
import fs from "fs";
import multer from "multer";
import sharp from "sharp";
import {
  isCloudinaryConfigured,
  uploadToCloudinary,
  testCloudinaryConnection,
} from "../services/cloudinaryService.js";
import { testS3Connection } from "../storage/s3Storage.js";
import { getCache, setCache, invalidateSiteSettings } from "../utils/cache.js";
import { parsePermissions } from "../utils/permissionParser.js";

// multer file upload setup
// We use memory storage so the buffer can be piped to Cloudinary.
// If Cloudinary is NOT configured, we fall back to saving to disk.
const memoryStorage = multer.memoryStorage();

// Use memory storage — we decide at request-time where the file goes
export const upload = multer({
  storage: memoryStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed"));
    }
    cb(null, true);
  },
});

// fallback helper to save file to local disk
function saveToDisk(fileBuffer, fieldname, originalname) {
  const dir = "uploads/site-settings";
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const ext = path.extname(originalname);
  const filename = `${fieldname}-${Date.now()}${ext}`;
  const filePath = path.join(dir, filename);
  fs.writeFileSync(filePath, fileBuffer);
  return `/uploads/site-settings/${filename}`;
}

// fetch site settings
// Public — no auth required. Returns current branding so all portals can read it.
export const getSiteSettings = async (req, res) => {
  try {
    const cacheKey = "site:settings";
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      return res.json({
        success: true,
        data: cachedData
      });
    }

    let settings = await prisma.siteSettings.findUnique({
      where: { singletonId: 1 },
    });

    // Auto-create if the singleton row doesn't exist yet
    if (!settings) {
      settings = await prisma.siteSettings.create({
        data: { singletonId: 1 },
      });
    }

    const base = `${req.protocol}://${req.get("host")}`;
    const cloudinaryEnabled = !!(
      settings.cloudinaryCloudName &&
      settings.cloudinaryApiKey &&
      settings.cloudinaryApiSecret
    );

    // Build logo/favicon URLs — Cloudinary URLs are already absolute
    const buildUrl = (val) => {
      if (!val) return null;
      if (val.startsWith("http")) return val; // Cloudinary URL
      return `${base}${val}`; // Local disk path
    };

    const responseData = {
      siteTitle:           settings.siteTitle,
      metaTitle:           settings.metaTitle,
      metaDescription:     settings.metaDescription,
      logoUrl:             buildUrl(settings.logoUrl),
      faviconUrl:          buildUrl(settings.faviconUrl),
      themeColor:          settings.themeColor,
      themeSecondaryColor: settings.themeSecondaryColor,
      sidebarBg:           settings.sidebarBg,
      sidebarFontColor:    settings.sidebarFontColor,
      navbarBg:            settings.navbarBg,
      navbarFontColor:     settings.navbarFontColor,
      mainBg:              settings.mainBg,
      mainFontColor:       settings.mainFontColor,
      activeTabBg:         settings.activeTabBg,
      activeTabColor:      settings.activeTabColor,
      ctaBg:               settings.ctaBg,
      ctaHoverBg:          settings.ctaHoverBg,
      fontFamily:          settings.fontFamily,
      cloudinaryEnabled,
    };

    await setCache(cacheKey, responseData, 3600);

    res.json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// get cloudinary storage status
// Authenticated — quick check if Cloudinary is set up
export const getCloudinaryStatus = async (req, res) => {
  try {
    const enabled = await isCloudinaryConfigured();
    res.json({ success: true, data: { enabled } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// fetch cloudinary api configuration
// Admin only — returns current Cloudinary config (secret masked)
export const getCloudinaryConfig = async (req, res) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({ success: false, message: "Admin access required" });
    }

    const isMainAdmin = req.user.isSuperAdmin === true;
    if (!isMainAdmin) {
      const permissions = parsePermissions(req.user);
      if (!permissions.settings_cloud) {
        return res.status(403).json({ success: false, message: "Access denied. Required permission: settings_cloud" });
      }
    }

    const settings = await prisma.siteSettings.findUnique({
      where: { singletonId: 1 },
      select: {
        storageProvider: true,
        cloudinaryCloudName: true,
        cloudinaryApiKey: true,
        cloudinaryApiSecret: true,
        s3Bucket: true,
        s3Region: true,
        s3AccessKeyId: true,
        s3SecretAccessKey: true,
        s3Endpoint: true,
      },
    });

    res.json({
      success: true,
      data: {
        storageProvider:     process.env.STORAGE_PROVIDER || settings?.storageProvider || "local",
        cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME || settings?.cloudinaryCloudName || "",
        cloudinaryApiKey:    process.env.CLOUDINARY_API_KEY || settings?.cloudinaryApiKey || "",
        cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET || settings?.cloudinaryApiSecret || "",
        s3Bucket:            process.env.S3_BUCKET || process.env.AWS_S3_BUCKET || settings?.s3Bucket || "",
        s3Region:            process.env.S3_REGION || process.env.AWS_REGION || settings?.s3Region || "",
        s3AccessKeyId:       process.env.S3_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID || settings?.s3AccessKeyId || "",
        s3SecretAccessKey:   process.env.S3_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY || settings?.s3SecretAccessKey || "",
        s3Endpoint:          process.env.S3_ENDPOINT || settings?.s3Endpoint || "",
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateCloudinaryConfig = async (req, res) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({ success: false, message: "Admin access required" });
    }

    const isMainAdmin = req.user.isSuperAdmin === true;
    if (!isMainAdmin) {
      const permissions = parsePermissions(req.user);
      if (!permissions.settings_cloud) {
        return res.status(403).json({ success: false, message: "Access denied. Required permission: settings_cloud" });
      }
    }

    const {
      storageProvider,
      cloudinaryCloudName,
      cloudinaryApiKey,
      cloudinaryApiSecret,
      s3Bucket,
      s3Region,
      s3AccessKeyId,
      s3SecretAccessKey,
      s3Endpoint,
    } = req.body;

    await prisma.siteSettings.upsert({
      where: { singletonId: 1 },
      update: {
        storageProvider:     storageProvider || "local",
        cloudinaryCloudName: cloudinaryCloudName || null,
        cloudinaryApiKey:    cloudinaryApiKey || null,
        cloudinaryApiSecret: cloudinaryApiSecret || null,
        s3Bucket:            s3Bucket || null,
        s3Region:            s3Region || null,
        s3AccessKeyId:       s3AccessKeyId || null,
        s3SecretAccessKey:   s3SecretAccessKey || null,
        s3Endpoint:          s3Endpoint || null,
      },
      create: {
        singletonId: 1,
        storageProvider:     storageProvider || "local",
        cloudinaryCloudName: cloudinaryCloudName || null,
        cloudinaryApiKey:    cloudinaryApiKey || null,
        cloudinaryApiSecret: cloudinaryApiSecret || null,
        s3Bucket:            s3Bucket || null,
        s3Region:            s3Region || null,
        s3AccessKeyId:       s3AccessKeyId || null,
        s3SecretAccessKey:   s3SecretAccessKey || null,
        s3Endpoint:          s3Endpoint || null,
      },
    });

    await invalidateSiteSettings();

    res.json({
      success: true,
      message: "Storage configuration saved successfully.",
      data: { storageProvider: storageProvider || "local" },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const testS3Credentials = async (req, res) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({ success: false, message: "Admin access required" });
    }

    const isMainAdmin = req.user.isSuperAdmin === true;
    if (!isMainAdmin) {
      const permissions = parsePermissions(req.user);
      if (!permissions.settings_cloud) {
        return res.status(403).json({ success: false, message: "Access denied. Required permission: settings_cloud" });
      }
    }

    const { s3Bucket, s3Region, s3AccessKeyId, s3SecretAccessKey, s3Endpoint } = req.body;

    if (!s3Bucket || !s3Region || !s3AccessKeyId || !s3SecretAccessKey) {
      return res.status(400).json({
        success: false,
        message: "Bucket name, Region, Access Key ID, and Secret Access Key are required to test the S3 connection.",
      });
    }

    const result = await testS3Connection(
      s3Bucket,
      s3Region,
      s3AccessKeyId,
      s3SecretAccessKey,
      s3Endpoint
    );

    if (result.success) {
      res.json({ success: true, message: result.message });
    } else {
      res.status(400).json({ success: false, message: result.message });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// test cloudinary credentials
// Admin only — test Cloudinary credentials without saving
export const testCloudinaryCredentials = async (req, res) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({ success: false, message: "Admin access required" });
    }

    const isMainAdmin = req.user.isSuperAdmin === true;
    if (!isMainAdmin) {
      const permissions = parsePermissions(req.user);
      if (!permissions.settings_cloud) {
        return res.status(403).json({ success: false, message: "Access denied. Required permission: settings_cloud" });
      }
    }

    const { cloudinaryCloudName, cloudinaryApiKey, cloudinaryApiSecret } = req.body;

    if (!cloudinaryCloudName || !cloudinaryApiKey || !cloudinaryApiSecret) {
      return res.status(400).json({
        success: false,
        message: "All three Cloudinary fields are required to test the connection.",
      });
    }

    const result = await testCloudinaryConnection(
      cloudinaryCloudName,
      cloudinaryApiKey,
      cloudinaryApiSecret
    );

    if (result.success) {
      res.json({ success: true, message: "Connection successful! Credentials are valid." });
    } else {
      res.status(400).json({ success: false, message: result.message });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// update site settings and files
// Admin only. Accepts multipart/form-data with optional logo + favicon files.
export const updateSiteSettings = async (req, res) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({ success: false, message: "Admin access required" });
    }

    const isMainAdmin = req.user.isSuperAdmin === true;
    if (!isMainAdmin) {
      const permissions = parsePermissions(req.user);
      if (!permissions.settings_site) {
        return res.status(403).json({ success: false, message: "Access denied. Required permission: settings_site" });
      }
    }
    const {
      siteTitle,
      metaTitle,
      metaDescription,
      themeColor,
      themeSecondaryColor,
      sidebarBg,
      sidebarFontColor,
      navbarBg,
      navbarFontColor,
      mainBg,
      mainFontColor,
      activeTabBg,
      activeTabColor,
      ctaBg,
      ctaHoverBg,
      fontFamily,
      clearLogo,
      clearFavicon,
    } = req.body;

    // Fetch current record to get old file paths for deletion
    const current = await prisma.siteSettings.findUnique({
      where: { singletonId: 1 },
    });

    const cloudinaryOn = await isCloudinaryConfigured();

    let logoUrl     = current?.logoUrl     ?? null;
    let faviconUrl  = current?.faviconUrl  ?? null;

    // Handle logo upload
    if (req.files?.logo?.[0]) {
      const logoFile = req.files.logo[0];

      // Delete old logo file from disk (if it was a local path)
      if (current?.logoUrl && !current.logoUrl.startsWith("http")) {
        const oldPath = path.join(process.cwd(), current.logoUrl);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }

      let logoBuffer = logoFile.buffer;
      let logoFilename = logoFile.originalname;
      try {
        logoBuffer = await sharp(logoFile.buffer).webp({ quality: 80 }).toBuffer();
        const nameWithoutExt = logoFile.originalname.substring(0, logoFile.originalname.lastIndexOf('.')) || logoFile.originalname;
        logoFilename = `${nameWithoutExt}.webp`;
      } catch (err) {
        console.error("Error optimizing logo with sharp:", err.message);
      }

      if (cloudinaryOn) {
        const result = await uploadToCloudinary(logoBuffer, {
          folder: "sai-crp/site-settings",
          publicId: `logo-${Date.now()}`,
          resourceType: "image",
        });
        logoUrl = result.url;
      } else {
        logoUrl = saveToDisk(logoBuffer, "logo", logoFilename);
      }
    } else if (clearLogo === "true") {
      if (current?.logoUrl && !current.logoUrl.startsWith("http")) {
        const oldPath = path.join(process.cwd(), current.logoUrl);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      logoUrl = null;
    }

    // Handle favicon upload
    if (req.files?.favicon?.[0]) {
      const faviconFile = req.files.favicon[0];

      if (current?.faviconUrl && !current.faviconUrl.startsWith("http")) {
        const oldPath = path.join(process.cwd(), current.faviconUrl);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }

      let faviconBuffer = faviconFile.buffer;
      let faviconFilename = faviconFile.originalname;
      try {
        faviconBuffer = await sharp(faviconFile.buffer).webp({ quality: 80 }).toBuffer();
        const nameWithoutExt = faviconFile.originalname.substring(0, faviconFile.originalname.lastIndexOf('.')) || faviconFile.originalname;
        faviconFilename = `${nameWithoutExt}.webp`;
      } catch (err) {
        console.error("Error optimizing favicon with sharp:", err.message);
      }

      if (cloudinaryOn) {
        const result = await uploadToCloudinary(faviconBuffer, {
          folder: "sai-crp/site-settings",
          publicId: `favicon-${Date.now()}`,
          resourceType: "image",
        });
        faviconUrl = result.url;
      } else {
        faviconUrl = saveToDisk(faviconBuffer, "favicon", faviconFilename);
      }
    } else if (clearFavicon === "true") {
      if (current?.faviconUrl && !current.faviconUrl.startsWith("http")) {
        const oldPath = path.join(process.cwd(), current.faviconUrl);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      faviconUrl = null;
    }

    const updated = await prisma.siteSettings.upsert({
      where:  { singletonId: 1 },
      update: {
        siteTitle:           siteTitle           ?? current?.siteTitle,
        metaTitle:           metaTitle           ?? current?.metaTitle,
        metaDescription:     metaDescription     ?? current?.metaDescription,
        themeColor:          themeColor          ?? current?.themeColor,
        themeSecondaryColor: themeSecondaryColor ?? current?.themeSecondaryColor,
        sidebarBg:           sidebarBg           ?? current?.sidebarBg,
        sidebarFontColor:    sidebarFontColor    ?? current?.sidebarFontColor,
        navbarBg:            navbarBg            ?? current?.navbarBg,
        navbarFontColor:     navbarFontColor     ?? current?.navbarFontColor,
        mainBg:              mainBg              ?? current?.mainBg,
        mainFontColor:       mainFontColor       ?? current?.mainFontColor,
        activeTabBg:         activeTabBg         ?? current?.activeTabBg,
        activeTabColor:      activeTabColor      ?? current?.activeTabColor,
        ctaBg:               ctaBg               ?? current?.ctaBg,
        ctaHoverBg:          ctaHoverBg          ?? current?.ctaHoverBg,
        fontFamily:          fontFamily          ?? current?.fontFamily,
        logoUrl,
        faviconUrl,
      },
      create: {
        singletonId:         1,
        siteTitle:           siteTitle           || "Sai CRP",
        metaTitle:           metaTitle           || "Sai IT Services - Project Management Portal",
        metaDescription:     metaDescription     || "Sai IT Services Client Relationship Portal",
        themeColor:          themeColor          || "#4F46E5",
        themeSecondaryColor: themeSecondaryColor || "#6366F1",
        sidebarBg:           sidebarBg           || "#1E1B4B",
        sidebarFontColor:    sidebarFontColor    || "#E0E7FF",
        navbarBg:            navbarBg            || "#FFFFFF",
        navbarFontColor:     navbarFontColor     || "#475569",
        mainBg:              mainBg              || "#F8FAFC",
        mainFontColor:       mainFontColor       || "#0F172A",
        activeTabBg:         activeTabBg         || "#4F46E5",
        activeTabColor:      activeTabColor      || "#FFFFFF",
        ctaBg:               ctaBg               || "#4F46E5",
        ctaHoverBg:          ctaHoverBg          || "#3730A3",
        fontFamily:          fontFamily          || "Inter",
        logoUrl,
        faviconUrl,
      },
    });

    const base = `${req.protocol}://${req.get("host")}`;
// Function to handle buildUrl operations
    const buildUrl = (val) => {
      if (!val) return null;
      if (val.startsWith("http")) return val;
      return `${base}${val}`;
    };

    await invalidateSiteSettings();

    res.json({
      success: true,
      data: {
        siteTitle:           updated.siteTitle,
        metaTitle:           updated.metaTitle,
        metaDescription:     updated.metaDescription,
        logoUrl:             buildUrl(updated.logoUrl),
        faviconUrl:          buildUrl(updated.faviconUrl),
        themeColor:          updated.themeColor,
        themeSecondaryColor: updated.themeSecondaryColor,
        sidebarBg:           updated.sidebarBg,
        sidebarFontColor:    updated.sidebarFontColor,
        navbarBg:            updated.navbarBg,
        navbarFontColor:     updated.navbarFontColor,
        mainBg:              updated.mainBg,
        mainFontColor:       updated.mainFontColor,
        activeTabBg:         updated.activeTabBg,
        activeTabColor:      updated.activeTabColor,
        ctaBg:               updated.ctaBg,
        ctaHoverBg:          updated.ctaHoverBg,
        fontFamily:          updated.fontFamily,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
