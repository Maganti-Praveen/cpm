// Express routing definitions for dashboard endpoints.
// Maps HTTP methods and URL paths to their respective controller functions.

import express from "express";
import * as dashboardController from "../controllers/dashboardController.js";
import auth from "../middleware/auth.js";
import role from "../middleware/role.js";

const router = express.Router();

// Admin dashboard summary — admin-only (staff/client have their own dashboards)
router.use(auth, role("ADMIN"));

// Route to handle GET /summary requests
router.get("/summary", dashboardController.getDashboardSummary);

export default router;
