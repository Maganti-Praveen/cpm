// Express routing definitions for deliverable endpoints.
// Maps HTTP methods and URL paths to their respective controller functions.

import express from "express";
import * as deliverableController from "../controllers/deliverableController.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.use(auth);

// Route to handle GET / requests
router.get("/", deliverableController.getDeliverables);
// Route to handle POST / requests
router.post("/", deliverableController.requireCloudinary, deliverableController.upload.single("file"), deliverableController.createDeliverable);
// Route to handle PUT /:id requests
router.put("/:id", deliverableController.updateDeliverable);
// Route to handle DELETE /:id requests
router.delete("/:id", deliverableController.deleteDeliverable);

export default router;
