// Middleware handler for managing auth operations.
// Intercepts and filters HTTP requests before they reach route handlers.

import jwt from "jsonwebtoken";
import prisma from "../config/prisma.js";

/**
 * Middleware that authenticates request tokens (JWT).
 * Extracts token from authorization headers or query parameters, verifies it,
 * checks if the user exists/is active, and binds the user object to `req.user`.
 * 
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 * @returns {Promise<void>}
 */
const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    let token = null;

    // Extract Bearer token from headers, or fallback to query parameter token
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else if (req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }

    // Verify token using JWT secret
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch user and include theme settings
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { theme: true },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    // Prevent suspended users from accessing APIs
    if (user.status === "Suspended") {
      return res.status(401).json({
        success: false,
        message: "Your account has been suspended. Please contact your administrator.",
      });
    }

    // Bind user to req object for downstream handlers
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }
};

export default auth;
