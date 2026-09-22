// Express routing definitions for milestone endpoints.
// Maps HTTP methods and URL paths to their respective controller functions.

import express from "express";
import * as milestoneController from "../controllers/milestoneController.js";
import * as projectImportController from "../controllers/projectImportController.js";
import auth from "../middleware/auth.js";
import multer from "multer";
import path from "path";

import permission from "../middleware/permission.js";

const router = express.Router();

// Protect endpoints using auth middleware
router.use(auth, permission("milestones"));

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
router.get("/", milestoneController.getMilestones);
router.get("/import/template", projectImportController.downloadMilestoneTemplate);
router.post("/import", (req, res, next) => {
  upload.single("file")(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
}, projectImportController.importMilestones);

router.post("/bulk-delete", milestoneController.bulkDeleteMilestones);
// Route to handle POST / requests
router.post("/", milestoneController.createMilestone);
// Route to handle PUT /:id requests
router.put("/:id", milestoneController.updateMilestone);
// Route to handle DELETE /:id requests
router.delete("/:id", milestoneController.deleteMilestone);

export default router;

