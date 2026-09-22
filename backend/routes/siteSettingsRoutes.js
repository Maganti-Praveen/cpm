// Express routing definitions for siteSettings endpoints.
// Maps HTTP methods and URL paths to their respective controller functions.

import express from "express";
import * as siteSettingsController from "../controllers/siteSettingsController.js";
import auth from "../middleware/auth.js";
import permission from "../middleware/permission.js";

const router = express.Router();

// Public — no auth. All portals (client, staff, public) fetch branding on startup.
router.get("/", siteSettingsController.getSiteSettings);

router.use(auth);

// Admin only — Cloud storage configurations (settings_cloud)
router.get("/cloudinary-status", permission("settings_cloud"), siteSettingsController.getCloudinaryStatus);
router.get("/cloudinary-config", permission("settings_cloud"), siteSettingsController.getCloudinaryConfig);
router.put("/cloudinary-config", permission("settings_cloud"), siteSettingsController.updateCloudinaryConfig);
router.post("/cloudinary-test", permission("settings_cloud"), siteSettingsController.testCloudinaryCredentials);
router.post("/s3-test", permission("settings_cloud"), siteSettingsController.testS3Credentials);

// Admin only — Site Settings updates (settings_site)
router.put(
  "/",
  permission("settings_site"),
  siteSettingsController.upload.fields([
    { name: "logo",    maxCount: 1 },
    { name: "favicon", maxCount: 1 },
  ]),
  siteSettingsController.updateSiteSettings
);

export default router;
