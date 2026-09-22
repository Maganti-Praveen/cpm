// Express routing definitions for task endpoints.
// Maps HTTP methods and URL paths to their respective controller functions.

import express from "express";
import * as taskController from "../controllers/taskController.js";
import * as projectImportController from "../controllers/projectImportController.js";
import auth from "../middleware/auth.js";
import multer from "multer";
import path from "path";

import permission from "../middleware/permission.js";

const router = express.Router();

// Apply auth middleware to protect all task endpoints
router.use(auth, permission("tasks"));

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
router.get("/", taskController.getTasks);
router.get("/import/template", projectImportController.downloadTaskTemplate);
router.post("/import", (req, res, next) => {
  upload.single("file")(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
}, projectImportController.importTasks);

router.post("/bulk-delete", taskController.bulkDeleteTasks);
// Route to handle POST / requests
router.post("/", taskController.createTask);
// Route to handle PUT /:id requests
router.put("/:id", taskController.updateTask);
// Route to handle DELETE /:id requests
router.delete("/:id", taskController.deleteTask);
// Route to handle POST /:taskId/comments requests
router.post("/:taskId/comments", taskController.createComment);

export default router;

