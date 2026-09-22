// Controller logic for managing notification operations.
// Processes incoming requests, performs validation, and communicates with services.

import prisma from "../config/prisma.js";
import { publicKey } from "../config/webPush.js";

let lastCleanupTime = 0;
const CLEANUP_INTERVAL = 30 * 60 * 1000; // 30 minutes

// Fetch notifications for the logged-in user
export const getNotifications = async (req, res) => {
  try {
    const now = Date.now();
    if (now - lastCleanupTime > CLEANUP_INTERVAL) {
      lastCleanupTime = now;
      const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);
      prisma.notification.deleteMany({
        where: {
          read: true,
          createdAt: { lt: oneDayAgo }
        }
      }).catch(err => console.error("Failed to auto-cleanup old notifications:", err.message));
    }

    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 20;
    const skip = req.query.skip ? parseInt(req.query.skip, 10) : 0;

    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "desc" },
      take: isNaN(limit) ? 20 : limit,
      skip: isNaN(skip) ? 0 : skip
    });

    res.status(200).json({
      success: true,
      data: notifications
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Mark a specific notification as read
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.notification.updateMany({
      where: {
        id: parseInt(id),
        userId: req.user.id
      },
      data: { read: true }
    });

    res.status(200).json({
      success: true,
      message: "Notification marked as read."
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Mark all notifications for the user as read
export const markAllAsRead = async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: {
        userId: req.user.id,
        read: false
      },
      data: { read: true }
    });

    res.status(200).json({
      success: true,
      message: "All notifications marked as read."
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Delete a specific notification
export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      return res.status(400).json({ success: false, message: "Invalid notification ID format" });
    }

    const existing = await prisma.notification.findUnique({
      where: { id: numericId }
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: "Notification not found." });
    }

    if (existing.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: "Unauthorized to delete this notification." });
    }

    await prisma.notification.delete({
      where: { id: numericId }
    });

    res.status(200).json({
      success: true,
      message: "Notification deleted successfully."
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Clear all read notifications for the user
export const clearReadNotifications = async (req, res) => {
  try {
    const cleared = await prisma.notification.deleteMany({
      where: {
        userId: req.user.id,
        read: true
      }
    });

    res.status(200).json({
      success: true,
      message: `Cleared ${cleared.count} read notifications.`
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Clear all notifications for the user
export const clearAllNotifications = async (req, res) => {
  try {
    // Delete all notification logs belonging to the authenticated user ID
    const cleared = await prisma.notification.deleteMany({
      where: {
        userId: req.user.id
      }
    });

    // Return the total count of cleared notifications in response
    res.status(200).json({
      success: true,
      message: `Cleared all ${cleared.count} notifications.`
    });
  } catch (error) {
    // Return error message on database execution failures
    res.status(400).json({ success: false, message: error.message });
  }
};

// Fetch VAPID public key
export const getVapidPublicKey = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: publicKey
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Subscribe user browser to push notifications
export const subscribePush = async (req, res) => {
  try {
    const { endpoint, keys } = req.body;

    if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
      return res.status(400).json({ success: false, message: "Endpoint and keys are required." });
    }

    // Save or update subscription
    await prisma.pushSubscription.upsert({
      where: { endpoint },
      update: {
        userId: req.user.id,
        keysP256dh: keys.p256dh,
        keysAuth: keys.auth
      },
      create: {
        userId: req.user.id,
        endpoint,
        keysP256dh: keys.p256dh,
        keysAuth: keys.auth
      }
    });

    res.status(200).json({
      success: true,
      message: "Successfully subscribed to push notifications."
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Unsubscribe user browser from push notifications
export const unsubscribePush = async (req, res) => {
  try {
    const { endpoint } = req.body;

    if (!endpoint) {
      return res.status(400).json({ success: false, message: "Endpoint is required." });
    }

    await prisma.pushSubscription.deleteMany({
      where: {
        endpoint,
        userId: req.user.id
      }
    });

    res.status(200).json({
      success: true,
      message: "Successfully unsubscribed from push notifications."
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
