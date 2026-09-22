// Express routing definitions for theme endpoints.
// Maps HTTP methods and URL paths to their respective controller functions.

import express from "express";
import * as themeController from "../controllers/themeController.js";
import auth from "../middleware/auth.js";
import permission from "../middleware/permission.js";

const router = express.Router();

// GET /api/themes - Fetch available themes (public so welcome/login pages can apply theming)
router.get("/", themeController.getThemes);

// Protect remaining theme management endpoints for admin only
router.use(auth);

// POST /api/themes - Only admin can create theme
router.post("/", permission("settings_theme"), themeController.createTheme);

// PUT /api/themes/:id - Only admin can update theme
router.put("/:id", permission("settings_theme"), themeController.updateTheme);

// PUT /api/themes/default/:id - Only admin can set default theme
router.put("/default/:id", permission("settings_theme"), themeController.setDefaultTheme);

export default router;
