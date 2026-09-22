// This file provides helper functions to parse sub-admin module authorization mapping.
// It simplifies permission objects decoding from stringified metadata columns or objects.

/**
 * Parses user permissions from a string or object format.
 * @param {object} user - The user object containing permissions.
 * @returns {object} A key-value map of permissions.
 */
export function parsePermissions(user) {
  // Returns empty fallback object if no permissions column is populated
  if (!user || !user.permissions) return {};
  
  // Decodes stringified JSON value if stored as string column type
  if (typeof user.permissions === "string") {
    try {
      return JSON.parse(user.permissions);
    } catch (_) {
      return {};
    }
  }
  
  // Directly returns permission object if already parsed or object format
  if (typeof user.permissions === "object") {
    return user.permissions;
  }
  
  return {};
}
