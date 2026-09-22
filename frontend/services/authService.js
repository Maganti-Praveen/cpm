/**
 * Handles network requests for user registration, authentication sessions, and password recovery.
 * Coordinates two-factor verification code checks and user profile updates with backend endpoints.
 */

import API from "./api";

/**
 * Registers a new user (admin access only).
 * @param {Object} data - User details.
 */
export const registerUser = (data) => API.post("/auth/register", data);

/**
 * Log in a user with email and password.
 * @param {Object} data - User credentials.
 */
export const loginUser = (data) => API.post("/auth/login", data);

/**
 * Retrieves the profile of the current authenticated user.
 */
export const getProfile = () => API.get("/auth/profile");

/**
 * Updates the profile of the current authenticated user.
 * @param {Object} data - Updated profile details.
 */
export const updateProfile = (data) => API.put("/auth/profile", data);

/**
 * Verifies the 2FA OTP code.
 * @param {Object} data - { email, otp }
 */
export const verify2FA = (data) => API.post("/auth/verify-2fa", data);

/**
 * Resends the 2FA OTP code to the user's email.
 * @param {Object} data - { email }
 */
export const resend2FA = (data) => API.post("/auth/resend-2fa", data);

/**
 * Retrieves users from the backend based on query filters.
 * @param {Object} params - Search filter query parameters.
 */
export const getUsers = (params) => API.get("/users", { params });

/**
 * Updates a user's details by ID.
 * @param {number|string} id - Target user ID.
 * @param {Object} data - Updated details.
 */
export const updateUser = (id, data) => API.put(`/users/${id}`, data);

/**
 * Deletes a user by ID.
 * @param {number|string} id - Target user ID.
 */
export const deleteUser = (id) => API.delete(`/users/${id}`);

/**
 * Performs bulk deletion of users.
 * @param {Array<number|string>} ids - List of user IDs.
 */
export const bulkDeleteUsers = (ids) => API.post("/users/bulk-delete", { ids });

/**
 * Initiates the forgot password flow by requesting an OTP.
 * @param {Object} data - { email }
 */
export const forgotPassword = (data) => API.post("/auth/forgot-password", data);

/**
 * Verifies the forgot password OTP.
 * @param {Object} data - { email, otp }
 */
export const verifyOTP = (data) => API.post("/auth/verify-otp", data);

/**
 * Resets the password using a verified OTP.
 * @param {Object} data - { email, otp, password }
 */
export const resetPassword = (data) => API.post("/auth/reset-password", data);

/**
 * Logs out the current user and clears session tokens.
 */
export const logoutUser = () => API.post("/auth/logout");

/**
 * Refreshes the authentication session token.
 */
export const refreshToken = () => API.post("/auth/refresh-token");

/**
 * Downloads the CSV/Excel template for bulk importing clients.
 */
export const downloadClientImportTemplate = () => API.get("/users/import/client/template", { responseType: "blob" });

/**
 * Uploads a file containing clients to import.
 * @param {File} file - CSV or Excel file.
 */
export const importClients = (file) => {
  const formData = new FormData();
  formData.append("file", file);
  return API.post("/users/import/client", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
};

/**
 * Downloads the CSV/Excel template for bulk importing staff.
 */
export const downloadStaffImportTemplate = () => API.get("/users/import/staff/template", { responseType: "blob" });

/**
 * Uploads a file containing staff members to import.
 * @param {File} file - CSV or Excel file.
 */
export const importStaff = (file) => {
  const formData = new FormData();
  formData.append("file", file);
  return API.post("/users/import/staff", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
};
