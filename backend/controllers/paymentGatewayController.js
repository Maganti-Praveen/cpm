// Controller logic for managing paymentGateway operations.
// Processes incoming requests, performs validation, and communicates with services.

import prisma from "../config/prisma.js";
import path from "path";
import fs from "fs";
import multer from "multer";
import {
  isCloudinaryConfigured,
  uploadToCloudinary,
  deleteFromCloudinary,
} from "../services/cloudinaryService.js";

// We use memory storage so the file buffer can be piped to Cloudinary.
const memoryStorage = multer.memoryStorage();

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
function saveToDisk(fileBuffer, originalname) {
  const dir = "uploads/payment-gateways";
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const ext = path.extname(originalname);
  const filename = `qrcode-${Date.now()}${ext}`;
  const filePath = path.join(dir, filename);
  fs.writeFileSync(filePath, fileBuffer);
  return `/uploads/payment-gateways/${filename}`;
}

// get all payment gateways (for settings page)
export const getAllGateways = async (req, res) => {
  try {
    const gateways = await prisma.paymentGateway.findMany({
      orderBy: [{ type: "asc" }, { id: "asc" }],
    });

    res.json({ success: true, data: gateways });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// get enabled gateways for payment flow
export const getEnabledGateways = async (req, res) => {
  try {
    const gateways = await prisma.paymentGateway.findMany({
      where: { enabled: true },
      orderBy: [{ type: "asc" }, { id: "asc" }],
    });

    // Strip sensitive config keys for non-admin consumers
    const sanitized = gateways.map((gw) => ({
      id: gw.id,
      name: gw.name,
      label: gw.label,
      type: gw.type,
      enabled: gw.enabled,
      mode: gw.mode,
      config:
        gw.type === "manual"
          ? gw.config
          : {},
    }));

    res.json({ success: true, data: sanitized });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// update gateway status, mode, and configurations
export const updateGateway = async (req, res) => {
  try {
    const { id } = req.params;
    let { enabled, mode, config } = req.body;

    const existing = await prisma.paymentGateway.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: "Gateway not found" });
    }

    const updateData = {};

    if (typeof enabled === "boolean") {
      updateData.enabled = enabled;
    } else if (typeof enabled === "string") {
      updateData.enabled = enabled === "true";
    }

    if (mode) updateData.mode = mode;

    if (typeof config === "string") {
      try {
        config = JSON.parse(config);
      } catch {
        config = null;
      }
    }

    // Merge config — preserve existing keys, override with new ones
    if (config && typeof config === "object") {
      const existingConfig =
        existing.config && typeof existing.config === "object" ? existing.config : {};

      // If qrCodeUrl is cleared, delete the old file/resource
      if (existingConfig.qrCodeUrl && (config.qrCodeUrl === "" || config.qrCodeUrl === null)) {
        const oldUrl = existingConfig.qrCodeUrl;
        if (oldUrl.startsWith("http")) {
          try {
            const urlParts = oldUrl.split("/upload/");
            if (urlParts.length > 1) {
              let publicId = urlParts[1];
              publicId = publicId.replace(/^v\d+\//, "");
              publicId = publicId.replace(/\.[^/.]+$/, "");
              await deleteFromCloudinary(publicId, "image");
            }
          } catch (err) {
            console.warn("Could not delete cleared QR code from Cloudinary:", err.message);
          }
        } else {
          try {
            const oldPath = path.join(process.cwd(), oldUrl);
            if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
          } catch (err) {
            console.warn("Could not delete cleared QR code from disk:", err.message);
          }
        }
      }

      updateData.config = { ...existingConfig, ...config };
    }

    // Handle QR code upload for manual gateways
    if (req.file) {
      const oldConfig =
        existing.config && typeof existing.config === "object" ? existing.config : {};
      if (oldConfig.qrCodeUrl) {
        if (oldConfig.qrCodeUrl.startsWith("http")) {
          try {
            const urlParts = oldConfig.qrCodeUrl.split("/upload/");
            if (urlParts.length > 1) {
              let publicId = urlParts[1];
              publicId = publicId.replace(/^v\d+\//, "");
              publicId = publicId.replace(/\.[^/.]+$/, "");
              await deleteFromCloudinary(publicId, "image");
            }
          } catch (err) {
            console.warn("Could not delete old QR code from Cloudinary:", err.message);
          }
        } else {
          try {
            const oldPath = path.join(process.cwd(), oldConfig.qrCodeUrl);
            if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
          } catch (err) {
            console.warn("Could not delete old QR code from disk:", err.message);
          }
        }
      }

      const cloudinaryOn = await isCloudinaryConfigured();
      let qrCodeUrl = "";
      if (cloudinaryOn) {
        const result = await uploadToCloudinary(req.file.buffer, {
          folder: "sai-crp/payment-gateways",
          publicId: `qrcode-${Date.now()}`,
          resourceType: "image",
        });
        qrCodeUrl = result.url;
      } else {
        qrCodeUrl = saveToDisk(req.file.buffer, req.file.originalname);
      }

      updateData.config = {
        ...(updateData.config || existing.config || {}),
        qrCodeUrl,
      };
    }

    const updated = await prisma.paymentGateway.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error("Payment gateway update error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
