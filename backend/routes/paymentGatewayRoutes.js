// Express routing definitions for paymentGateway endpoints.
// Maps HTTP methods and URL paths to their respective controller functions.

import express from "express";
import * as paymentGatewayController from "../controllers/paymentGatewayController.js";
import auth from "../middleware/auth.js";
import role from "../middleware/role.js";

const router = express.Router();

// Conditional multer — only process multipart/form-data requests (file uploads).
// JSON requests pass through untouched.
const optionalQrUpload = (req, res, next) => {
  const contentType = req.headers["content-type"] || "";
  if (contentType.includes("multipart/form-data")) {
    return paymentGatewayController.upload.single("qrCode")(req, res, next);
  }
  next();
};

// Admin only — list all gateways (admin page fetches on mount)
router.get("/", auth, role("ADMIN"), paymentGatewayController.getAllGateways);

// Public — list only enabled gateways (for invoice pay-now flow)
router.get("/enabled", paymentGatewayController.getEnabledGateways);

// Admin only — update gateway config (with optional QR code image upload)
router.put(
  "/:id",
  auth,
  role("ADMIN"),
  optionalQrUpload,
  paymentGatewayController.updateGateway
);

export default router;
