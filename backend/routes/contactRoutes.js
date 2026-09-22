// Express routing definitions for contact endpoints.
// Maps HTTP methods and URL paths to their respective controller functions.

import express from "express";
import * as contactController from "../controllers/contactController.js";
import auth from "../middleware/auth.js";
import permission from "../middleware/permission.js";

const router = express.Router();

// Route to handle POST / requests
router.post("/", contactController.createContact);

router.use(auth);

// Route to handle GET / requests
router.get("/", permission("contact_reviews"), contactController.getContacts);
router.get("/suspension-inquiries", permission("suspension_reviews"), contactController.getSuspensionInquiries);
router.post("/suspension-inquiries/:id/reactivate", permission("suspension_reviews"), contactController.reactivateSuspendedUser);
// Route to handle PUT /:id requests
router.put("/:id", permission("contact_reviews"), contactController.updateContactStatus);
// Route to handle POST /:id/reply requests
router.post("/:id/reply", permission("contact_reviews"), contactController.replyToContactSubmission);
// Route to handle GET /:id/replies requests
router.get("/:id/replies", permission("contact_reviews"), contactController.getContactReplies);
// Route to handle DELETE /:id requests
router.delete("/:id", permission("contact_reviews"), contactController.deleteContact);

export default router;
