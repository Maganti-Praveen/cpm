// Express routing definitions for search endpoints.
// Maps HTTP methods and URL paths to their respective controller functions.

import express from "express";
import * as searchController from "../controllers/searchController.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// Require auth for all search requests
router.use(auth);

// Route to handle GET / requests
router.get("/", searchController.performGlobalSearch);

export default router;
