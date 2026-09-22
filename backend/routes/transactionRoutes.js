// Express routing definitions for transaction endpoints.
// Maps HTTP methods and URL paths to their respective controller functions.

import express from "express";
import * as transactionController from "../controllers/transactionController.js";
import auth from "../middleware/auth.js";

import permission from "../middleware/permission.js";

const router = express.Router();

// Apply auth middleware to protect all transaction endpoints
router.use(auth, permission("transactions"));

// Route to handle POST / requests
router.post("/", transactionController.createTransaction);
// Route to handle GET / requests
router.get("/", transactionController.getTransactions);
// Route to handle PUT /:id/verify requests
router.put("/:id/verify", transactionController.verifyManualPayment);

export default router;
