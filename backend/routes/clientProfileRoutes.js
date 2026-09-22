// Express routing definitions for clientProfile endpoints.
// Maps HTTP methods and URL paths to their respective controller functions.

import express from "express";
import * as clientProfileController from "../controllers/clientProfileController.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// Protect all profile/settings routes
router.use(auth);

// Route to handle GET /profile requests
router.get("/profile", clientProfileController.getClientProfile);
// Route to handle PUT /profile requests
router.put("/profile", clientProfileController.updateClientProfile);
// Route to handle PUT /change-password requests
router.put("/change-password", clientProfileController.changePassword);

export default router;
