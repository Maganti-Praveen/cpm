// Express routing definitions for auth endpoints.
// Maps HTTP methods and URL paths to their respective controller functions.

import express from "express";
import * as authController from "../controllers/authController.js";
import auth from "../middleware/auth.js";
import role from "../middleware/role.js";
import validate from "../middleware/validate.js";
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  verifyOtpSchema,
  resetPasswordSchema,
} from "../validators/authSchemas.js";

const router = express.Router();

// Note: General User Management (get, update, delete, bulk operations) is handled under /api/users
// Auth routes cover session lifecycle (login, register, reset, self profile check)

// Only admins can register new users (prevents public privilege escalation)
router.post("/register", auth, role("ADMIN"), validate(registerSchema), authController.register);
/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Authenticate user session
 *     description: Log in using email and password. Returns active session token.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin@gmail.com
 *               password:
 *                 type: string
 *                 example: admin123
 *     responses:
 *       200:
 *         description: Login successful. Returns access token.
 *       400:
 *         description: Validation or login credentials error.
 */
router.post("/login", validate(loginSchema), authController.login);

/**
 * Route to handle POST /verify-2fa requests.
 * Verifies two-factor authentication OTP provided by user.
 */
router.post("/verify-2fa", authController.verify2FA);

/**
 * Route to handle POST /resend-2fa requests.
 * Resends 2FA code to user's registered email with a 60s rate-limiting timer.
 */
router.post("/resend-2fa", authController.resend2FA);

/**
 * Route to handle POST /forgot-password requests.
 * Requests a password reset OTP for a specific email address.
 */
router.post("/forgot-password", validate(forgotPasswordSchema), authController.forgotPassword);

/**
 * Route to handle POST /verify-otp requests.
 * Validates the password reset OTP code.
 */
router.post("/verify-otp", validate(verifyOtpSchema), authController.verifyOTP);

/**
 * Route to handle POST /reset-password requests.
 * Resets user's password using a validated OTP.
 */
router.post("/reset-password", validate(resetPasswordSchema), authController.resetPassword);

/**
 * Route to handle GET /profile requests.
 * Retrieves profile information for the authenticated user.
 */
router.get("/profile", auth, authController.getProfile);

/**
 * Route to handle PUT /profile requests.
 * Updates profile details for the authenticated user.
 */
router.put("/profile", auth, authController.updateProfile);

/**
 * Route to handle POST /refresh-token requests.
 * Refreshes the active session token using a refresh token cookie.
 */
router.post("/refresh-token", authController.refreshToken);

/**
 * Route to handle POST /logout requests.
 * Terminates user session and clears authentication cookies.
 */
router.post("/logout", authController.logoutUser);

export default router;