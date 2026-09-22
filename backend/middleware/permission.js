// Middleware handler for managing permission operations.
// Intercepts and filters HTTP requests before they reach route handlers.

import { parsePermissions } from "../utils/permissionParser.js";

/**
 * Factory middleware to enforce module-specific permissions (RBAC) for administrators.
 * Bypasses checks for Super Admins. Allows non-ADMIN roles to pass through (which should be verified by role middleware).
 * 
 * @param {string} permissionKey - The permission module key to check (e.g., 'staff', 'clients', 'projects').
 * @returns {Function} Express middleware function.
 */
const permission = (permissionKey) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
    }

    // Main super-admin bypasses all checks
    if (req.user.role === "ADMIN" && req.user.isSuperAdmin === true) {
      return next();
    }

    // Sub-admin permission checks
    if (req.user.role === "ADMIN") {
      // Safely parse module privileges using utility helper
      const userPermissions = parsePermissions(req.user);

      if (userPermissions[permissionKey] === true || userPermissions[permissionKey] === "true") {
        return next();
      }

      return res.status(403).json({
        success: false,
        message: `Access denied. Required permission: ${permissionKey}`,
      });
    }

    // For other roles, let role middleware handle or reject
    return next();
  };
};

/**
 * Middleware that restricts access exclusively to Super Admin users.
 * 
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 */
export const superAdminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Not authenticated",
    });
  }

  if (req.user.role === "ADMIN" && req.user.isSuperAdmin === true) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: "Access denied. Super Admin privilege required.",
  });
};

export default permission;
