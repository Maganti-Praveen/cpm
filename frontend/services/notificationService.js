// Coordinates user-specific alerts, system notices, and notice counters.
// Fetches outstanding message indicators and updates read statuses.


import API from "./api";

/**
 * Fetch 20 recent notifications for current user
 */
export const getNotifications = async () => {
  try {
    // Requests latest notifications collection from client database
    const res = await API.get("/notifications");
    return res.data;
  } catch (err) {
    console.error("Failed to fetch notifications:", err.message);
    return { success: false, data: [] };
  }
};

/**
 * Mark a single notification as read
 */
export const markAsRead = async (id) => {
  try {
    // Updates read state tracking values for specified notification
    const res = await API.put(`/notifications/${id}/read`);
    return res.data;
  } catch (err) {
    console.error(`Failed to mark notification ${id} as read:`, err.message);
    return { success: false };
  }
};

/**
 * Mark all notifications as read
 */
export const markAllAsRead = async () => {
  try {
    const res = await API.put("/notifications/read-all");
    return res.data;
  } catch (err) {
    console.error("Failed to mark all notifications as read:", err.message);
    return { success: false };
  }
};

/**
 * Clear all read notifications for current user
 */
export const clearReadNotifications = async () => {
  try {
    const res = await API.delete("/notifications/clear-read");
    return res.data;
  } catch (err) {
    console.error("Failed to clear read notifications:", err.message);
    return { success: false };
  }
};

/**
 * Clear all notifications (read and unread) for current user
 */
export const clearAllNotifications = async () => {
  try {
    const res = await API.delete("/notifications/clear-all");
    return res.data;
  } catch (err) {
    console.error("Failed to clear all notifications:", err.message);
    return { success: false };
  }
};

/**
 * Delete a single notification by ID
 */
export const deleteNotification = async (id) => {
  try {
    const res = await API.delete(`/notifications/${id}`);
    return res.data;
  } catch (err) {
    console.error(`Failed to delete notification ${id}:`, err.message);
    return { success: false };
  }
};

