// Utility helper functions for managing notifier.
// Provides common reusable methods used across the backend application.

import prisma from "../config/prisma.js";
import { webpush } from "../config/webPush.js";
import { getWss } from "./wssStore.js";

/**
 * Determines the frontend redirect link based on notification type
 */
const getLinkForNotification = (type, linkId) => {
  if (!type) return "/";
  const normalized = type.toLowerCase();
  if (normalized.includes("task")) return "/tasks";
  if (normalized.includes("ticket")) return "/tickets";
  if (normalized.includes("project")) return "/projects";
  if (normalized.includes("invoice")) return "/invoices";
  if (normalized.includes("message")) return "/messages";
  return "/";
};

/**
 * Sends a push notification to all registered subscriptions of a user
 */
const sendPushNotification = async (userId, payload) => {
  try {
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId: Number(userId) }
    });

    if (!subscriptions || subscriptions.length === 0) return;

    const payloadString = JSON.stringify(payload);

    await Promise.all(
      subscriptions.map(async (sub) => {
        try {
          const pushSubscriptionObject = {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.keysP256dh,
              auth: sub.keysAuth
            }
          };
          await webpush.sendNotification(pushSubscriptionObject, payloadString);
        } catch (error) {
          // Prune subscriptions that are expired or revoked
          if (error.statusCode === 410 || error.statusCode === 404) {
            console.log(`[Notifier] Pruning expired push subscription: ${sub.endpoint}`);
            await prisma.pushSubscription.delete({
              where: { id: sub.id }
            }).catch(dbErr => console.error("Failed to delete expired subscription:", dbErr.message));
          } else {
            console.error(`[Notifier] Push notification failed for user ${userId}:`, error.message);
          }
        }
      })
    );
  } catch (error) {
    console.error(`[Notifier] sendPushNotification failed for user ${userId}:`, error.message);
  }
};

/**
 * Creates a notification for a specific user and sends a push notification
 */
export const createNotification = async ({ userId, title, message, type, linkId }) => {
  try {
    if (!userId) return null;
    
    const dbNotification = await prisma.notification.create({
      data: {
        userId: Number(userId),
        title,
        message,
        type,
        linkId: linkId ? Number(linkId) : null
      }
    });

    // Send push notification asynchronously (non-blocking)
    const link = getLinkForNotification(type, linkId);
    sendPushNotification(userId, { title, message, link }).catch(err => 
      console.error("[Notifier] createNotification push error:", err.message)
    );

    // Real-time WebSocket delivery: push notification event to the specific connected client
    try {
      const wss = getWss();
      if (wss) {
        const packet = JSON.stringify({ type: "notification", title, message, notifType: type, linkId: linkId || null });
        wss.clients.forEach((client) => {
          if (client.readyState === 1 && client.userId === Number(userId)) {
            client.send(packet);
          }
        });
        console.log(`[Notifier] WS notification sent to user ${userId}`);
      }
    } catch (wsErr) {
      console.error("[Notifier] WS delivery error:", wsErr.message);
    }

    return dbNotification;
  } catch (error) {
    console.error("Failed to create notification:", error.message);
    return null;
  }
};

/**
 * Creates a notification for all admin users and sends push notifications
 */
export const notifyAdmins = async ({ title, message, type, linkId }) => {
  try {
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" }
    });
    
    if (!admins || admins.length === 0) return [];
    
    const notifications = await Promise.all(
      admins.map(admin => 
        prisma.notification.create({
          data: {
            userId: admin.id,
            title,
            message,
            type,
            linkId: linkId ? Number(linkId) : null
          }
        })
      )
    );

    // Send push notifications to all admins asynchronously (non-blocking)
    const link = getLinkForNotification(type, linkId);
    admins.forEach(admin => {
      sendPushNotification(admin.id, { title, message, link }).catch(err =>
        console.error(`[Notifier] notifyAdmins push error for admin ${admin.id}:`, err.message)
      );
    });

    // Real-time WebSocket broadcast: push a notification event to all connected admin clients
    try {
      const wss = getWss();
      if (wss) {
        const adminIds = new Set(admins.map(a => a.id));
        const packet = JSON.stringify({ type: "notification", title, message, notifType: type, linkId: linkId || null });
        wss.clients.forEach((client) => {
          if (client.readyState === 1 && adminIds.has(client.userId)) {
            client.send(packet);
          }
        });
        console.log(`[Notifier] WS notification broadcast sent to ${adminIds.size} admin(s)`);
      }
    } catch (wsErr) {
      console.error("[Notifier] WS broadcast error:", wsErr.message);
    }

    return notifications;
  } catch (error) {
    console.error("Failed to notify admins:", error.message);
    return [];
  }
};
