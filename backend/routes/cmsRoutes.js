// Express routing definitions for cms endpoints.
// Maps HTTP methods and URL paths to their respective controller functions.

import express from "express";
import * as cmsController from "../controllers/cmsController.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// Existing CMS content endpoints (backward compatibility)
router.get("/cms/content", cmsController.getCmsContent);
router.post("/cms/content", auth, cmsController.updateCmsContent);
router.post("/cms/upload", auth, cmsController.upload.single("file"), cmsController.uploadCmsImage);

// A. Services API
router.get("/public/services", cmsController.getPublicServices);
router.post("/admin/cms/services", auth, cmsController.createService);
router.put("/admin/cms/services/:id", auth, cmsController.updateService);
router.delete("/admin/cms/services/:id", auth, cmsController.deleteService);

// B. Careers API
router.get("/public/careers", cmsController.getPublicCareers);
router.post("/admin/cms/careers", auth, cmsController.createCareer);
router.put("/admin/cms/careers/:id", auth, cmsController.updateCareer);
router.delete("/admin/cms/careers/:id", auth, cmsController.deleteCareer);

// C. About Us & Company Stats API
router.get("/public/about", cmsController.getPublicAbout);
router.put("/admin/cms/about", auth, cmsController.updatePublicAbout);

// D. Case Studies / Projects API
router.get("/public/case-studies", cmsController.getPublicCaseStudies);
router.post("/admin/cms/case-studies", auth, cmsController.createCaseStudy);
router.put("/admin/cms/case-studies/:id", auth, cmsController.updateCaseStudy);
router.delete("/admin/cms/case-studies/:id", auth, cmsController.deleteCaseStudy);

export default router;
