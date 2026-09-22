// Express routing definitions for user endpoints.
// Maps HTTP methods and URL paths to their respective controller functions.

import express from "express";
import * as authController from "../controllers/authController.js";
import * as userImportController from "../controllers/userImportController.js";
import auth from "../middleware/auth.js";
import role from "../middleware/role.js";
import permission from "../middleware/permission.js";
import multer from "multer";
import path from "path";

const router = express.Router();

// Multer configuration for user imports
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

// Apply auth middleware
router.use(auth);

// PUT /api/users/theme - Authenticated users save their own theme preference
router.put("/theme", authController.saveUserTheme);

// Admin-only user management routes
router.get("/", role("ADMIN"), authController.getUsers);
router.put("/:id", role("ADMIN"), authController.updateUser);
router.delete("/:id", role("ADMIN"), authController.deleteUser);
router.post("/bulk-delete", role("ADMIN"), authController.bulkDeleteUsers);

// Bulk Import templates and upload routes
router.get("/import/client/template", role("ADMIN"), permission("clients"), userImportController.downloadClientTemplate);
router.get("/import/staff/template", role("ADMIN"), permission("staff"), userImportController.downloadStaffTemplate);

router.post("/import/client", role("ADMIN"), permission("clients"), (req, res, next) => {
  upload.single("file")(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
}, userImportController.importClients);

router.post("/import/staff", role("ADMIN"), permission("staff"), (req, res, next) => {
  upload.single("file")(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
}, userImportController.importStaff);

export default router;
