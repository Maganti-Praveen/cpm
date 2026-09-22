// Express routing definitions for emailSettings endpoints.
// Maps HTTP methods and URL paths to their respective controller functions.

import { Router } from "express";
import auth from "../middleware/auth.js";
import role from "../middleware/role.js";
import {
  getEmailSettings,
  updateEmailSettings,
  testEmail,
  getEmailStatus,
  getEmailLogs,
} from "../controllers/emailSettingsController.js";

import permission from "../middleware/permission.js";

const router = Router();

router.use(auth, role("ADMIN"), permission("email_config"));

// Route to handle GET / requests
router.get("/", getEmailSettings);
// Route to handle PUT / requests
router.put("/", updateEmailSettings);
// Route to handle POST /test requests
router.post("/test", testEmail);
// Route to handle GET /status requests
router.get("/status", getEmailStatus);
// Route to handle GET /logs requests
router.get("/logs", getEmailLogs);

export default router;
