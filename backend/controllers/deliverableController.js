// Controller logic for managing deliverable operations.
// Processes incoming requests, performs validation, and communicates with services.

import prisma from "../config/prisma.js";
import path from "path";
import fs from "fs";
import multer from "multer";
import { logActivity } from "../utils/activityLogger.js";
import {
  isCloudinaryConfigured,
  uploadToCloudinary,
  deleteFromCloudinary,
} from "../services/cloudinaryService.js";
import { getCache, setCache, invalidateDeliverables } from "../utils/cache.js";

// multer config for buffer uploads
const memoryStorage = multer.memoryStorage();
export const upload = multer({
  storage: memoryStorage,
  limits: { fileSize: 30 * 1024 * 1024 } // 30 MB limit
});

// fallback to disk if cloudinary is offline
function saveToDisk(fileBuffer, originalname) {
  const dir = "uploads/deliverables";
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const ext = path.extname(originalname);
  const baseName = path.basename(originalname, ext).replace(/\s+/g, "_");
  const filename = `${baseName}-${Date.now()}${ext}`;
  fs.writeFileSync(path.join(dir, filename), fileBuffer);
  return `/uploads/deliverables/${filename}`;
}

// verify cloudinary is configured before upload
export const requireCloudinary = async (req, res, next) => {
  const configured = await isCloudinaryConfigured();
  if (!configured) {
    const role = req.user?.role;
    if (role === "ADMIN") {
      return res.status(403).json({
        success: false,
        redirectToSettings: true,
        message: "Cloud storage is not configured. Please set up Cloudinary credentials in Site Settings → Cloud Storage.",
      });
    } else {
      return res.status(403).json({
        success: false,
        contactAdmin: true,
        message: "File upload is currently unavailable. Please contact your administrator.",
      });
    }
  }
  next();
};

// Fetch deliverables for a project
export const getDeliverables = async (req, res) => {
  try {
    const { projectId } = req.query;
    if (!projectId) {
      return res.status(400).json({ success: false, message: "projectId required" });
    }

    const cacheKey = `deliverables:list:${projectId}`;
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      return res.status(200).json({
        success: true,
        data: cachedData
      });
    }

    const deliverables = await prisma.deliverable.findMany({
      where: { projectId: parseInt(projectId) },
      orderBy: { createdAt: "desc" }
    });

    const base = `${req.protocol}://${req.get("host")}`;

    // Normalise URLs — Cloudinary URLs are already absolute
    const mapped = deliverables.map(d => ({
      ...d,
      url: d.url
        ? (d.url.startsWith("http") ? d.url : `${base}${d.url}`)
        : null,
    }));

    await setCache(cacheKey, mapped, 3600);

    res.status(200).json({
      success: true,
      data: mapped
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create / Submit a deliverable
export const createDeliverable = async (req, res) => {
  try {
    const { projectId, stage, dueDate } = req.body;
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }
    if (!projectId) {
      return res.status(400).json({ success: false, message: "projectId required" });
    }

    const sizeInBytes = req.file.size;
    let sizeStr = `${(sizeInBytes / 1024).toFixed(1)} KB`;
    if (sizeInBytes > 1024 * 1024) {
      sizeStr = `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
    }

    // Upload to Cloudinary or fallback to disk
    let fileUrl;
    const cloudinaryOn = await isCloudinaryConfigured();
    if (cloudinaryOn) {
      const result = await uploadToCloudinary(req.file.buffer, {
        folder: "sai-crp/deliverables",
        resourceType: "auto",
      });
      fileUrl = result.url;
    } else {
      fileUrl = saveToDisk(req.file.buffer, req.file.originalname);
    }

    const deliverable = await prisma.deliverable.create({
      data: {
        name: req.file.originalname,
        size: sizeStr,
        stage: stage || "Review Phase",
        status: "Awaiting Review",
        dueDate: dueDate ? new Date(dueDate) : null,
        url: fileUrl,
        projectId: parseInt(projectId)
      }
    });

    await logActivity(projectId, `Deliverable Submitted: ${deliverable.name}`, `Stage: ${deliverable.stage}`, "upload");

    await invalidateDeliverables();

    res.status(201).json({
      success: true,
      data: deliverable
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Update deliverable status (Approve / Reject)
export const updateDeliverable = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // Approved, Rejected, Awaiting Review

    const deliverable = await prisma.deliverable.update({
      where: { id: parseInt(id) },
      data: { status }
    });

    await logActivity(deliverable.projectId, `Deliverable Reviewed: ${deliverable.name}`, `Status: ${deliverable.status}`, deliverable.status === "Approved" ? "completed" : "info");

    await invalidateDeliverables();

    res.status(200).json({
      success: true,
      data: deliverable
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Delete a deliverable
export const deleteDeliverable = async (req, res) => {
  try {
    const { id } = req.params;

    const del = await prisma.deliverable.findUnique({
      where: { id: parseInt(id) }
    });

    if (!del) {
      return res.status(404).json({ success: false, message: "Deliverable not found" });
    }

    // Attempt file deletion — Cloudinary or disk
    if (del.url) {
      if (del.url.startsWith("http")) {
        // Cloudinary URL
        try {
          const urlParts = del.url.split("/upload/");
          if (urlParts.length > 1) {
            let publicId = urlParts[1];
            publicId = publicId.replace(/^v\d+\//, "");
            publicId = publicId.replace(/\.[^/.]+$/, "");
            
            const ext = path.extname(del.name || "").toLowerCase();
            const isImage = [".png", ".jpg", ".jpeg", ".gif", ".bmp", ".webp", ".svg"].includes(ext);
            const resourceType = isImage ? "image" : "raw";
            
            await deleteFromCloudinary(publicId, resourceType);
          }
        } catch (err) {
          console.warn("Could not delete deliverable from Cloudinary:", err.message);
        }
      } else {
        // Local disk file
        try {
          const filePath = del.url.startsWith("/") ? del.url.substring(1) : del.url;
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (err) {
          console.warn("Could not delete deliverable file from disk:", err.message);
        }
      }
    }

    await logActivity(del.projectId, `Deliverable Deleted: ${del.name}`, ``, "info");

    await prisma.deliverable.delete({
      where: { id: parseInt(id) }
    });

    await invalidateDeliverables();

    res.status(200).json({
      success: true,
      message: "Deliverable deleted successfully"
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
