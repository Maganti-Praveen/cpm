// Express routing definitions for analytics endpoints.
// Maps HTTP methods and URL paths to their respective controller functions.

import express from "express";
import { getAnalytics } from "../controllers/analyticsController.js";
import auth from "../middleware/auth.js";
import role from "../middleware/role.js";

import permission from "../middleware/permission.js";

const router = express.Router();

// Analytics are admin-only (contains revenue, client counts, staff performance)
router.use(auth, role("ADMIN"), permission("analytics"));

// Route to handle GET /stats requests
router.get("/stats", getAnalytics);

export default router;
