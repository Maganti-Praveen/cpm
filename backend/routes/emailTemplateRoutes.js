// Express routing definitions for emailTemplate endpoints.
// Maps HTTP methods and URL paths to their respective controller functions.

import { Router } from "express";
import auth from "../middleware/auth.js";
import role from "../middleware/role.js";
import {
  getTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  previewTemplate,
  seedDefaultTemplates,
} from "../controllers/emailTemplateController.js";

import permission from "../middleware/permission.js";

const router = Router();

router.use(auth, role("ADMIN"), permission("email_config"));

// Route to handle GET / requests
router.get("/", getTemplates);
// Route to handle POST / requests
router.post("/", createTemplate);
// Route to handle POST /seed requests
router.post("/seed", seedDefaultTemplates);
// Route to handle GET /:id requests
router.get("/:id", getTemplate);
// Route to handle PUT /:id requests
router.put("/:id", updateTemplate);
// Route to handle DELETE /:id requests
router.delete("/:id", deleteTemplate);
// Route to handle POST /:id/preview requests
router.post("/:id/preview", previewTemplate);

export default router;
