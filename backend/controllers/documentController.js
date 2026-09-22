// Controller logic for managing document operations.
// Processes incoming requests, performs validation, and communicates with services.

import prisma from "../config/prisma.js";
import { logActivity } from "../utils/activityLogger.js";
import path from "path";
import fs from "fs";
import multer from "multer";

import { getStorageProvider } from "../storage/storageFactory.js";

import {
  deleteFromCloudinary,
  isCloudinaryConfigured,
} from "../services/cloudinaryService.js";
import { getCache, setCache, invalidateDocuments } from "../utils/cache.js";

// multer memory configuration
const memoryStorage = multer.memoryStorage();
export const upload = multer({
  storage: memoryStorage,
  limits: { fileSize: 25 * 1024 * 1024 },  // 25 MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.zip', '.png', '.jpg', '.jpeg'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowed.includes(ext)) {
      return cb(new Error('File type not allowed'), false);
    }
    cb(null, true);
  }
});


// verify storage is configured before upload
export const requireStorage = async (req, res, next) => {
  let provider = process.env.STORAGE_PROVIDER;

  if (provider) {
    provider = provider.trim().toLowerCase();
    if (provider === "aws") {
      provider = "s3";
    }
  }

  if (!provider) {
    try {
      const settings = await prisma.siteSettings.findUnique({
        where: { singletonId: 1 },
        select: { storageProvider: true }
      });
      provider = settings?.storageProvider || "local";
    } catch (err) {
      provider = "local";
    }
  }

  if (provider) {
    provider = provider.trim().toLowerCase();
    if (provider === "aws") {
      provider = "s3";
    }
  }

  if (provider === "local") {
    return next();
  }

  if (provider === "cloudinary") {
    const configured = await isCloudinaryConfigured();

    if (!configured) {
      const role = req.user?.role;

      if (role === "ADMIN") {
        return res.status(403).json({
          success: false,
          redirectToSettings: true,
          message:
            "Cloud storage is not configured. Please set up Cloudinary credentials.",
        });
      }

      return res.status(403).json({
        success: false,
        contactAdmin: true,
        message:
          "File upload is currently unavailable. Please contact your administrator.",
      });
    }

    return next();
  }

  if (provider === "s3") {
    try {
      const envBucket = process.env.S3_BUCKET || process.env.AWS_S3_BUCKET;
      const envRegion = process.env.S3_REGION || process.env.AWS_REGION;
      const envAccessKeyId = process.env.S3_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
      const envSecretAccessKey = process.env.S3_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;

      let configured = false;

      if (envBucket && envRegion && envAccessKeyId && envSecretAccessKey) {
        configured = true;
      } else {
        const settings = await prisma.siteSettings.findUnique({
          where: { singletonId: 1 },
          select: {
            s3Bucket: true,
            s3Region: true,
            s3AccessKeyId: true,
            s3SecretAccessKey: true,
          },
        });

        configured = !!(
          settings &&
          settings.s3Bucket &&
          settings.s3Region &&
          settings.s3AccessKeyId &&
          settings.s3SecretAccessKey
        );
      }

      if (!configured) {
        const role = req.user?.role;
        if (role === "ADMIN") {
          return res.status(403).json({
            success: false,
            redirectToSettings: true,
            message: "AWS S3 storage is not configured. Please set up S3 credentials in settings.",
          });
        }
        return res.status(403).json({
          success: false,
          contactAdmin: true,
          message: "File upload is currently unavailable. Please contact your administrator.",
        });
      }
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }

    return next();
  }

  return res.status(400).json({
    success: false,
    message: "Invalid storage provider",
  });
};

// Fetch documents with RBAC filters
export const getDocuments = async (req, res) => {
  try {
    const { projectId } = req.query;
    const userId = req.user.id;
    const role = req.user.role;

    const cacheKey = `documents:list:${role}:${userId}:${projectId || 'all'}`;
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      return res.status(200).json({
        success: true,
        data: cachedData
      });
    }

    let whereClause = {};

    if (projectId) {
      whereClause.projectId = parseInt(projectId);
    }

    // Apply RBAC filters
    if (role === "STAFF") {
      whereClause.project = {
        team: {
          some: {
            id: userId
          }
        }
      };
    } else if (role === "CLIENT") {
      whereClause.project = {
        clientId: userId
      };
    }

    const documents = await prisma.document.findMany({
      where: whereClause,
      include: {
        project: {
          include: {
            client: {
              select: {
                fullName: true,
                company: true
              }
            },
            team: {
              select: {
                fullName: true
              }
            }
          }
        },
        uploadedBy: {
          select: {
            fullName: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    const base = `${req.protocol}://${req.get("host")}`;

    const formatted = documents.map(d => ({
      id: d.id,
      title: d.title,
      description: d.description || "",
      type: d.type,
      fileUrl: d.fileUrl
        ? (d.fileUrl.startsWith("http") ? d.fileUrl : `${base}${d.fileUrl}`)
        : "",
      linkUrl: d.linkUrl || "",
      projectId: d.projectId,
      projectName: d.project.name,
      clientName: d.project.client ? `${d.project.client.fullName} (${d.project.client.company || 'N/A'})` : "N/A",
      staffMembers: d.project.team && d.project.team.length > 0 ? d.project.team.map(t => t.fullName).join(", ") : "None",
      uploader: d.uploadedBy?.fullName || "System",
      date: d.createdAt.toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric'
      })
    }));

    await setCache(cacheKey, formatted, 3600);

    res.status(200).json({
      success: true,
      data: formatted
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create a document record (handles FILE and LINK upload types)
export const createDocument = async (req, res) => {
  try {
    const { title, description, type, projectId, linkUrl } = req.body;
    const userId = req.user.id;
    const role = req.user.role;

    if (!projectId) {
      return res.status(400).json({ success: false, message: "projectId is required" });
    }

    let finalType = type;
    if (!finalType) {
      if (req.file) {
        finalType = "FILE";
      } else if (linkUrl) {
        finalType = "LINK";
      } else {
        return res.status(400).json({ success: false, message: "Type is required (FILE or LINK)" });
      }
    }

    let finalTitle = title;
    if (!finalTitle) {
      if (finalType === "FILE" && req.file) {
        finalTitle = req.file.originalname;
      } else {
        return res.status(400).json({ success: false, message: "Title is required" });
      }
    }

    const pId = parseInt(projectId);

    // Verify if user has access to project
    if (role === "STAFF") {
      const proj = await prisma.project.findFirst({
        where: {
          id: pId,
          team: { some: { id: userId } }
        }
      });
      if (!proj) {
        return res.status(403).json({ success: false, message: "Forbidden: You are not assigned to this project" });
      }
    } else if (role === "CLIENT") {
      const proj = await prisma.project.findFirst({
        where: {
          id: pId,
          clientId: userId
        }
      });
      if (!proj) {
        return res.status(403).json({ success: false, message: "Forbidden: You do not own this project" });
      }
    }

    let fileUrl = null;
    let finalLinkUrl = null;

    if (finalType === "FILE") {
      if (!req.file) {
        return res.status(400).json({ success: false, message: "No file uploaded for FILE type" });
      }

      // Upload to Cloudinary (requireCloudinary middleware already verified it's configured)
     const storage = getStorageProvider();
fileUrl = await storage.uploadFile(req.file);
    } else if (finalType === "LINK") {
      if (!linkUrl) {
        return res.status(400).json({ success: false, message: "linkUrl is required for LINK type" });
      }
      finalLinkUrl = linkUrl;
    }

    const doc = await prisma.document.create({
      data: {
        title: finalTitle,
        description,
        type: finalType,
        fileUrl,
        linkUrl: finalLinkUrl,
        projectId: pId,
        uploadedById: userId
      },
      include: {
        uploadedBy: true,
        project: {
          include: {
            client: {
              select: {
                fullName: true,
                company: true
              }
            },
            team: {
              select: {
                fullName: true
              }
            }
          }
        }
      }
    });

    await logActivity(pId, `${doc.uploadedBy.fullName} uploaded document: ${doc.title}`, `Type: ${doc.type}`, "upload");

    const base = `${req.protocol}://${req.get("host")}`;

    await invalidateDocuments();

    res.status(201).json({
      success: true,
      data: {
        id: doc.id,
        title: doc.title,
        description: doc.description || "",
        type: doc.type,
        fileUrl: doc.fileUrl
          ? (doc.fileUrl.startsWith("http") ? doc.fileUrl : `${base}${doc.fileUrl}`)
          : "",
        linkUrl: doc.linkUrl || "",
        projectId: doc.projectId,
        projectName: doc.project.name,
        clientName: doc.project.client ? `${doc.project.client.fullName} (${doc.project.client.company || 'N/A'})` : "N/A",
        staffMembers: doc.project.team && doc.project.team.length > 0 ? doc.project.team.map(t => t.fullName).join(", ") : "None",
        uploader: doc.uploadedBy.fullName,
        date: doc.createdAt.toLocaleDateString('en-US', {
          month: 'short',
          day: '2-digit',
          year: 'numeric'
        })
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Update a document record
export const updateDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, type, linkUrl, projectId } = req.body;
    const userId = req.user.id;
    const role = req.user.role;

    const existingDoc = await prisma.document.findUnique({
      where: { id: parseInt(id) },
      include: { project: true }
    });

    if (!existingDoc) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }

    // Verify ownership/RBAC permissions to modify
    if (role === "STAFF") {
      const proj = await prisma.project.findFirst({
        where: {
          id: existingDoc.projectId,
          team: { some: { id: userId } }
        }
      });
      if (!proj) {
        return res.status(403).json({ success: false, message: "Forbidden: You are not assigned to this project" });
      }
    } else if (role === "CLIENT") {
      return res.status(403).json({ success: false, message: "Forbidden: Clients cannot modify documents" });
    }

    let updatedData = {
      title: title || existingDoc.title,
      description: description !== undefined ? description : existingDoc.description,
      type: type || existingDoc.type,
      linkUrl: linkUrl !== undefined ? linkUrl : existingDoc.linkUrl,
      projectId: projectId ? parseInt(projectId) : existingDoc.projectId
    };

    // If type switches to LINK, clear fileUrl, and vice versa
    if (type === "LINK") {
      updatedData.fileUrl = null;
    } else if (type === "FILE" && req.file) {
      const storage = getStorageProvider();
updatedData.fileUrl = await storage.uploadFile(req.file);
      updatedData.linkUrl = null;
    }

    const updatedDoc = await prisma.document.update({
      where: { id: parseInt(id) },
      data: updatedData,
      include: {
        uploadedBy: true,
        project: {
          include: {
            client: {
              select: {
                fullName: true,
                company: true
              }
            },
            team: {
              select: {
                fullName: true
              }
            }
          }
        }
      }
    });

    const base = `${req.protocol}://${req.get("host")}`;

    await invalidateDocuments();

    res.status(200).json({
      success: true,
      data: {
        id: updatedDoc.id,
        title: updatedDoc.title,
        description: updatedDoc.description || "",
        type: updatedDoc.type,
        fileUrl: updatedDoc.fileUrl
          ? (updatedDoc.fileUrl.startsWith("http") ? updatedDoc.fileUrl : `${base}${updatedDoc.fileUrl}`)
          : "",
        linkUrl: updatedDoc.linkUrl || "",
        projectId: updatedDoc.projectId,
        projectName: updatedDoc.project.name,
        clientName: updatedDoc.project.client ? `${updatedDoc.project.client.fullName} (${updatedDoc.project.client.company || 'N/A'})` : "N/A",
        staffMembers: updatedDoc.project.team && updatedDoc.project.team.length > 0 ? updatedDoc.project.team.map(t => t.fullName).join(", ") : "None",
        uploader: updatedDoc.uploadedBy.fullName,
        date: updatedDoc.createdAt.toLocaleDateString('en-US', {
          month: 'short',
          day: '2-digit',
          year: 'numeric'
        })
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Delete a document
export const deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const role = req.user.role;

    const doc = await prisma.document.findUnique({
      where: { id: parseInt(id) }
    });

    if (!doc) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }

    // Only Admin (or staff assigned to project) can delete. Let's restrict to Admin or STAFF assigned
    if (role === "CLIENT") {
      return res.status(403).json({ success: false, message: "Forbidden: Clients cannot delete documents" });
    } else if (role === "STAFF") {
      const proj = await prisma.project.findFirst({
        where: {
          id: doc.projectId,
          team: { some: { id: req.user.id } }
        }
      });
      if (!proj) {
        return res.status(403).json({ success: false, message: "Forbidden: You are not assigned to this project" });
      }
    }

    // Try deleting file using the dynamic storage provider
    if (doc.type === "FILE" && doc.fileUrl) {
      try {
        const storage = getStorageProvider();
        await storage.deleteFile(doc.fileUrl);
      } catch (err) {
        console.warn("Could not delete file:", err.message);
      }
    }

    await logActivity(doc.projectId, `Document Deleted: ${doc.title}`, ``, "info");

    await prisma.document.delete({
      where: { id: parseInt(id) }
    });

    await invalidateDocuments();

    res.status(200).json({
      success: true,
      message: "Document deleted successfully"
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Download / View document file by ID (legacy helper, we can also link directly to /uploads/...)
export const downloadDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await prisma.document.findUnique({
      where: { id: parseInt(id) }
    });
    if (!doc || doc.type !== "FILE" || !doc.fileUrl) {
      return res.status(404).json({ success: false, message: "Document file not found" });
    }

    // If Cloudinary URL, redirect to it
    if (doc.fileUrl.startsWith("http")) {
      return res.redirect(doc.fileUrl);
    }

    const filePath = path.join(process.cwd(), doc.fileUrl);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: "Physical file not found on server" });
    }

    res.sendFile(filePath);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
