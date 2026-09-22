// Express routing definitions for project endpoints.
// Maps HTTP methods and URL paths to their respective controller functions.

import express from "express";
import * as projectController from "../controllers/projectController.js";
import * as projectImportController from "../controllers/projectImportController.js";
import auth from "../middleware/auth.js";
import multer from "multer";
import path from "path";

import permission from "../middleware/permission.js";

const router = express.Router();

// Apply auth middleware to protect all project endpoints
router.use(auth, permission("projects"));

// Multer memory storage configuration for file security
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === ".xlsx" || ext === ".csv") {
      cb(null, true);
    } else {
      cb(new Error("Only .xlsx and .csv files are supported"), false);
    }
  }
});

// Route to handle GET / requests
router.get("/", projectController.getProjects);
router.get("/import/template", projectImportController.downloadTemplate);
router.post("/import", (req, res, next) => {
  upload.single("file")(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
}, projectImportController.importProjects);
router.delete("/bulk-delete", projectController.bulkDeleteProjects);
router.put("/bulk-update", projectController.bulkUpdateProjects);

// Route to handle GET /:id requests
router.get("/:id", projectController.getProjectById);
// Route to handle POST / requests
router.post("/", projectController.createProject);
// Route to handle PUT /:id requests
router.put("/:id", projectController.updateProject);
// Route to handle DELETE /:id requests
router.delete("/:id", projectController.deleteProject);

export default router;

