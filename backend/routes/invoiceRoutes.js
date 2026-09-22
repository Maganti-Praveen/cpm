// Express routing definitions for invoice endpoints.
// Maps HTTP methods and URL paths to their respective controller functions.

import express from "express";
import * as invoiceController from "../controllers/invoiceController.js";
import auth from "../middleware/auth.js";

import permission from "../middleware/permission.js";

const router = express.Router();

// Apply auth middleware to protect all invoice endpoints
router.use(auth, permission("invoices"));

// Route to handle GET / requests
router.get("/", invoiceController.getInvoices);
// Route to handle GET /:id requests
router.get("/:id", invoiceController.getInvoiceById);
// Route to handle POST / requests
router.post("/", invoiceController.createInvoice);
// Route to handle PUT /:id requests
router.put("/:id", invoiceController.updateInvoice);
// Route to handle DELETE /:id requests
router.delete("/:id", invoiceController.deleteInvoice);

export default router;
