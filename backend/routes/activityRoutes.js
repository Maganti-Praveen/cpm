// Express routing definitions for activity endpoints.
// Maps HTTP methods and URL paths to their respective controller functions.

import express from "express";
import * as activityController from "../controllers/activityController.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.use(auth);

// Route to handle GET / requests
router.get("/", activityController.getActivities);

export default router;
