// Express routing definitions for document endpoints.
// Maps HTTP methods and URL paths to their respective controller functions.

import express from "express";
import * as documentController from "../controllers/documentController.js";
import auth from "../middleware/auth.js";

import permission from "../middleware/permission.js";

const router = express.Router();

router.use(auth, permission("documents"));

// Route to handle GET / requests
router.get("/", documentController.getDocuments);
// Route to handle GET /download/:id requests
router.get("/download/:id", documentController.downloadDocument);
// requireStorage checks whether the configured storage provider is available
// upload.single("file") parses the incoming multipart/form-data field named "file"
router.post(
  "/",
  documentController.requireStorage,
  documentController.upload.single("file"),
  documentController.createDocument
);
// Route to handle PUT /:id requests
router.put("/:id", documentController.upload.single("file"), documentController.updateDocument);
// Route to handle DELETE /:id requests
router.delete("/:id", documentController.deleteDocument);

export default router;
