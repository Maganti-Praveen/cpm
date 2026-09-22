// Express routing definitions for payment endpoints.
// Maps HTTP methods and URL paths to their respective controller functions.

import express from "express";
import * as paymentController from "../controllers/paymentController.js";
import auth from "../middleware/auth.js";
import role from "../middleware/role.js";

const router = express.Router();

// Razorpay flows (accessible to authenticated clients/users)
router.post("/razorpay/create-order", auth, paymentController.createRazorpayOrder);
// Route to handle POST /razorpay/verify-signature requests
router.post("/razorpay/verify-signature", auth, paymentController.verifyRazorpaySignature);

// Manual Payment proof flow (client uploads proof)
router.put(
  "/manual/pay-proof",
  auth,
  paymentController.upload.single("screenshot"),
  paymentController.payManualWithProof
);

// Admin-only manual payment verification
router.put("/manual/verify/:id", auth, role("ADMIN"), paymentController.verifyManualPayment);

// Simulated automatic payment completion
router.post("/simulate/complete", auth, paymentController.completeSimulatedPayment);

export default router;
