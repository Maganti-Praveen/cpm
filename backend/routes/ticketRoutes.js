// Express routing definitions for ticket endpoints.
// Maps HTTP methods and URL paths to their respective controller functions.

import express from "express";
import * as ticketController from "../controllers/ticketController.js";
import auth from "../middleware/auth.js";

import permission from "../middleware/permission.js";

const router = express.Router();

// Protect all support ticket routes
router.use(auth, permission("support"));

// Route to handle GET / requests
router.get("/", ticketController.getTickets);
// Route to handle POST / requests
router.post("/", ticketController.createTicket);
// Route to handle GET /:id requests
router.get("/:id", ticketController.getTicketById);
// Route to handle POST /:id/reply requests
router.post("/:id/reply", ticketController.replyToTicket);
// Route to handle PUT /:id requests
router.put("/:id", ticketController.updateTicket);
// Route to handle DELETE /:id requests
router.delete("/:id", ticketController.deleteTicket);

export default router;
