// Express routing definitions for client endpoints.
// Maps HTTP methods and URL paths to their respective controller functions.

import express from "express";
import * as clientController from "../controllers/clientController.js";
import auth from "../middleware/auth.js";

import permission from "../middleware/permission.js";

const router = express.Router();

// Protect endpoints using auth middleware
router.use(auth, permission("clients"));

// Route to handle GET / requests
router.get("/", clientController.getClients);
// Route to handle POST / requests
router.post("/", clientController.createClient);

export default router;
