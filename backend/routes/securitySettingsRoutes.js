// Express routing definitions for securitySettings endpoints.
// Maps HTTP methods and URL paths to their respective controller functions.

import { Router } from "express";
import auth from "../middleware/auth.js";
import role from "../middleware/role.js";
import {
  getSecuritySettings,
  updateSecuritySettings,
} from "../controllers/securitySettingsController.js";

const router = Router();

// Route to handle GET / requests
router.get("/", auth, role("ADMIN"), getSecuritySettings);
// Route to handle PUT / requests
router.put("/", auth, role("ADMIN"), updateSecuritySettings);

export default router;
