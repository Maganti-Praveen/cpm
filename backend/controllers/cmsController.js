// Controller logic for managing cms operations.
// Processes incoming requests, performs validation, and communicates with services.

import prisma from "../config/prisma.js";
import path from "path";
import fs from "fs";
import multer from "multer";
import sharp from "sharp";
import {
  isCloudinaryConfigured,
  uploadToCloudinary,
} from "../services/cloudinaryService.js";
import { getCache, setCache, invalidateCms } from "../utils/cache.js";
import {
  ENTERPRISE_SERVICES,
  CAREER_OPENINGS,
  COMPANY_ABOUT_DATA,
  ENTERPRISE_CASE_STUDIES,
} from "../utils/defaultCmsData.js";

// multer memory storage setup
const memoryStorage = multer.memoryStorage();
export const upload = multer({
  storage: memoryStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/") && !file.mimetype.startsWith("video/")) {
      return cb(new Error("Only image and video files are allowed"));
    }
    cb(null, true);
  },
});

// local storage saving fallback
function saveToDisk(fileBuffer, originalname) {
  const dir = "uploads/cms";
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const ext = path.extname(originalname);
  const filename = `cms-${Date.now()}${ext}`;
  const filePath = path.join(dir, filename);
  fs.writeFileSync(filePath, fileBuffer);
  return `/uploads/cms/${filename}`;
}

// GET /api/cms/content
export const getCmsContent = async (req, res) => {
  try {
    const cacheKey = "cms:content";
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      return res.json({
        success: true,
        data: cachedData
      });
    }

    const rawData = await prisma.publicPageContent.findMany();
    
    // Structure records into a nested map: data[page][section][key] = value
    const structured = {};
    rawData.forEach(item => {
      if (!structured[item.page]) structured[item.page] = {};
      if (!structured[item.page][item.section]) structured[item.page][item.section] = {};
      
      let parsedValue = item.value;
      // If value is a JSON string representing list data, parse it (optional helper for UI simplicity)
      if (item.value.startsWith("[") || item.value.startsWith("{")) {
        try {
          parsedValue = JSON.parse(item.value);
        } catch (e) {
          // Keep as string if parsing fails
        }
      }
      
      structured[item.page][item.section][item.key] = parsedValue;
    });

    await setCache(cacheKey, structured, 3600);

    res.json({
      success: true,
      data: structured
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/cms/content
// Expects body: { updates: [ { page, section, key, value } ] }
export const updateCmsContent = async (req, res) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({ success: false, message: "Admin access required" });
    }

    const { updates } = req.body;
    if (!Array.isArray(updates)) {
      return res.status(400).json({ success: false, message: "updates must be an array" });
    }

    // Process updates concurrently
    await Promise.all(
      updates.map(item => {
        // Stringify value if it's an object/array
        const stringifiedValue = typeof item.value === "object" ? JSON.stringify(item.value) : String(item.value);
        
        return prisma.publicPageContent.upsert({
          where: {
            page_section_key: {
              page: item.page,
              section: item.section,
              key: item.key
            }
          },
          update: { value: stringifiedValue },
          create: {
            page: item.page,
            section: item.section,
            key: item.key,
            value: stringifiedValue
          }
        });
      })
    );

    await invalidateCms();

    res.json({
      success: true,
      message: "Public page content updated successfully!"
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/cms/upload
// Receives an image/video file and returns absolute URL
export const uploadCmsImage = async (req, res) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({ success: false, message: "Admin access required" });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    let file = req.file;
    const cloudinaryOn = await isCloudinaryConfigured();
    let fileUrl = "";

    // Convert images to WebP and optimize/resize
    if (file.mimetype.startsWith("image/")) {
      try {
        let pipeline = sharp(file.buffer);
        const metadata = await pipeline.metadata();
        
        // Resize to a maximum width of 1200px (retaining aspect ratio) if larger
        if (metadata.width > 1200) {
          pipeline = pipeline.resize({ width: 1200, withoutEnlargement: true });
        }
        
        // Convert to webp with 80% quality
        const webpBuffer = await pipeline.webp({ quality: 80 }).toBuffer();
        
        // Construct new file object name
        const origNameWithoutExt = file.originalname.substring(0, file.originalname.lastIndexOf('.')) || file.originalname;
        
        file = {
          ...file,
          buffer: webpBuffer,
          mimetype: "image/webp",
          originalname: `${origNameWithoutExt}.webp`
        };
      } catch (sharpError) {
        console.error("Error optimizing image with sharp:", sharpError.message);
      }
    }

    if (cloudinaryOn) {
      const folderPath = "sai-crp/cms";
      const result = await uploadToCloudinary(file.buffer, {
        folder: folderPath,
        publicId: `media-${Date.now()}`,
        resourceType: file.mimetype.startsWith("video/") ? "video" : "image"
      });
      fileUrl = result.url;
    } else {
      const diskPath = saveToDisk(file.buffer, file.originalname);
      const base = `${req.protocol}://${req.get("host")}`;
      fileUrl = `${base}${diskPath}`;
    }

    res.json({
      success: true,
      data: {
        url: fileUrl
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== A. SERVICES API ====================

// GET /api/public/services
export const getPublicServices = async (req, res) => {
  try {
    let services = await prisma.cmsService.findMany({
      orderBy: { id: "asc" }
    });

    if (services.length === 0) {
      // Seed default services
      await Promise.all(
        ENTERPRISE_SERVICES.map(srv =>
          prisma.cmsService.create({
            data: {
              slug: srv.slug,
              title: srv.title,
              subtitle: srv.subtitle,
              icon: srv.icon,
              image: srv.image,
              shortDescription: srv.shortDescription,
              fullDescription: srv.fullDescription,
              keyCapabilities: srv.keyCapabilities,
              benefits: srv.benefits,
              techStack: srv.techStack,
              isActive: true
            }
          })
        )
      );

      services = await prisma.cmsService.findMany({
        orderBy: { id: "asc" }
      });
    }

    res.json({ success: true, data: services });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/admin/cms/services
export const createService = async (req, res) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({ success: false, message: "Admin access required" });
    }

    const {
      slug,
      title,
      subtitle,
      icon,
      image,
      shortDescription,
      fullDescription,
      keyCapabilities,
      benefits,
      techStack,
      isActive
    } = req.body;

    const newService = await prisma.cmsService.create({
      data: {
        slug,
        title,
        subtitle,
        icon,
        image: image || "/images/project-fintech.webp",
        shortDescription,
        fullDescription,
        keyCapabilities: keyCapabilities || [],
        benefits: benefits || [],
        techStack: techStack || [],
        isActive: isActive !== undefined ? isActive : true
      }
    });

    res.status(201).json({ success: true, data: newService });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/admin/cms/services/:id
export const updateService = async (req, res) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({ success: false, message: "Admin access required" });
    }

    const id = parseInt(req.params.id);
    const {
      slug,
      title,
      subtitle,
      icon,
      image,
      shortDescription,
      fullDescription,
      keyCapabilities,
      benefits,
      techStack,
      isActive
    } = req.body;

    const updatedService = await prisma.cmsService.update({
      where: { id },
      data: {
        slug,
        title,
        subtitle,
        icon,
        image,
        shortDescription,
        fullDescription,
        keyCapabilities,
        benefits,
        techStack,
        isActive
      }
    });

    res.json({ success: true, data: updatedService });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/admin/cms/services/:id
export const deleteService = async (req, res) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({ success: false, message: "Admin access required" });
    }

    const id = parseInt(req.params.id);
    await prisma.cmsService.delete({
      where: { id }
    });

    res.json({ success: true, message: "Service deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== B. CAREERS API ====================

// GET /api/public/careers
export const getPublicCareers = async (req, res) => {
  try {
    let careers = await prisma.cmsCareer.findMany({
      orderBy: { id: "asc" }
    });

    if (careers.length === 0) {
      // Seed default careers
      await Promise.all(
        CAREER_OPENINGS.map(job =>
          prisma.cmsCareer.create({
            data: {
              title: job.title,
              department: job.department,
              location: job.location,
              type: job.type,
              experience: job.experience,
              description: job.description,
              responsibilities: job.responsibilities,
              requirements: job.requirements,
              contactEmail: job.contactEmail,
              active: job.active
            }
          })
        )
      );

      careers = await prisma.cmsCareer.findMany({
        orderBy: { id: "asc" }
      });
    }

    res.json({ success: true, data: careers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/admin/cms/careers
export const createCareer = async (req, res) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({ success: false, message: "Admin access required" });
    }

    const {
      title,
      department,
      location,
      type,
      experience,
      description,
      responsibilities,
      requirements,
      contactEmail,
      active
    } = req.body;

    const newCareer = await prisma.cmsCareer.create({
      data: {
        title,
        department,
        location,
        type,
        experience,
        description,
        responsibilities: responsibilities || [],
        requirements: requirements || [],
        contactEmail: contactEmail || "careers@saiitservices.com",
        active: active !== undefined ? active : true
      }
    });

    res.status(201).json({ success: true, data: newCareer });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/admin/cms/careers/:id
export const updateCareer = async (req, res) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({ success: false, message: "Admin access required" });
    }

    const id = parseInt(req.params.id);
    const {
      title,
      department,
      location,
      type,
      experience,
      description,
      responsibilities,
      requirements,
      contactEmail,
      active
    } = req.body;

    const updatedCareer = await prisma.cmsCareer.update({
      where: { id },
      data: {
        title,
        department,
        location,
        type,
        experience,
        description,
        responsibilities,
        requirements,
        contactEmail,
        active
      }
    });

    res.json({ success: true, data: updatedCareer });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/admin/cms/careers/:id
export const deleteCareer = async (req, res) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({ success: false, message: "Admin access required" });
    }

    const id = parseInt(req.params.id);
    await prisma.cmsCareer.delete({
      where: { id }
    });

    res.json({ success: true, message: "Career deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== C. ABOUT US & COMPANY STATS API ====================

// GET /api/public/about
export const getPublicAbout = async (req, res) => {
  try {
    let about = await prisma.cmsAboutUs.findUnique({
      where: { id: 1 }
    });

    if (!about) {
      // Seed default about data
      about = await prisma.cmsAboutUs.create({
        data: {
          id: 1,
          title: COMPANY_ABOUT_DATA.title,
          subtitle: COMPANY_ABOUT_DATA.subtitle,
          mission: COMPANY_ABOUT_DATA.mission,
          vision: COMPANY_ABOUT_DATA.vision,
          coreValues: COMPANY_ABOUT_DATA.coreValues,
          milestones: COMPANY_ABOUT_DATA.milestones,
          stats: COMPANY_ABOUT_DATA.stats
        }
      });
    }

    res.json({ success: true, data: about });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/admin/cms/about
export const updatePublicAbout = async (req, res) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({ success: false, message: "Admin access required" });
    }

    const {
      title,
      subtitle,
      mission,
      vision,
      coreValues,
      milestones,
      stats
    } = req.body;

    const updatedAbout = await prisma.cmsAboutUs.upsert({
      where: { id: 1 },
      update: {
        title,
        subtitle,
        mission,
        vision,
        coreValues,
        milestones,
        stats
      },
      create: {
        id: 1,
        title,
        subtitle,
        mission,
        vision,
        coreValues,
        milestones,
        stats
      }
    });

    res.json({ success: true, data: updatedAbout });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== D. CASE STUDIES / PROJECTS API ====================

// GET /api/public/case-studies
export const getPublicCaseStudies = async (req, res) => {
  try {
    let caseStudies = await prisma.cmsCaseStudy.findMany({
      orderBy: { id: "asc" }
    });

    if (caseStudies.length === 0) {
      // Seed default case studies
      await Promise.all(
        ENTERPRISE_CASE_STUDIES.map(cs =>
          prisma.cmsCaseStudy.create({
            data: {
              slug: cs.slug,
              title: cs.title,
              subtitle: cs.subtitle,
              clientName: cs.clientName,
              industry: cs.industry,
              icon: cs.icon,
              image: cs.image,
              shortDescription: cs.shortDescription,
              fullDescription: cs.fullDescription,
              keyResults: cs.keyResults,
              technologiesUsed: cs.technologiesUsed,
              isActive: true
            }
          })
        )
      );

      caseStudies = await prisma.cmsCaseStudy.findMany({
        orderBy: { id: "asc" }
      });
    }

    res.json({ success: true, data: caseStudies });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/admin/cms/case-studies
export const createCaseStudy = async (req, res) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({ success: false, message: "Admin access required" });
    }

    const {
      slug, title, subtitle, clientName, industry, icon, image,
      shortDescription, fullDescription, keyResults, technologiesUsed, isActive
    } = req.body;

    const newCaseStudy = await prisma.cmsCaseStudy.create({
      data: {
        slug,
        title,
        subtitle,
        clientName,
        industry,
        icon,
        image: image || "/images/project-erp.webp",
        shortDescription,
        fullDescription,
        keyResults: keyResults || [],
        technologiesUsed: technologiesUsed || [],
        isActive: isActive !== undefined ? isActive : true
      }
    });

    res.status(201).json({ success: true, data: newCaseStudy });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/admin/cms/case-studies/:id
export const updateCaseStudy = async (req, res) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({ success: false, message: "Admin access required" });
    }

    const id = parseInt(req.params.id);
    const {
      slug, title, subtitle, clientName, industry, icon, image,
      shortDescription, fullDescription, keyResults, technologiesUsed, isActive
    } = req.body;

    const updatedCaseStudy = await prisma.cmsCaseStudy.update({
      where: { id },
      data: {
        slug, title, subtitle, clientName, industry, icon, image,
        shortDescription, fullDescription, keyResults, technologiesUsed, isActive
      }
    });

    res.json({ success: true, data: updatedCaseStudy });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/admin/cms/case-studies/:id
export const deleteCaseStudy = async (req, res) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({ success: false, message: "Admin access required" });
    }

    const id = parseInt(req.params.id);
    await prisma.cmsCaseStudy.delete({
      where: { id }
    });

    res.json({ success: true, message: "Case study deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
