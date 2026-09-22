// Express routing definitions for auditLog endpoints.
// Maps HTTP methods and URL paths to their respective controller functions.

import express from "express";
import { getAuditLogs } from "../controllers/auditLogController.js";
import auth from "../middleware/auth.js";
import role from "../middleware/role.js";
import permission from "../middleware/permission.js";

const router = express.Router();

router.use(auth, role("ADMIN"), permission("audit_logs"));
// Route to handle GET / requests
router.get("/", getAuditLogs);

export default router;
