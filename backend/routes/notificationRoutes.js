// Express routing definitions for notification endpoints.
// Maps HTTP methods and URL paths to their respective controller functions.

import express from "express";
import * as notificationController from "../controllers/notificationController.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// Apply auth middleware to protect all notification endpoints
router.use(auth);

// Route to handle GET / requests
router.get("/", notificationController.getNotifications);
// Route to handle PUT /read-all requests
router.put("/read-all", notificationController.markAllAsRead);
// Route to handle GET /vapid-public-key requests
router.get("/vapid-public-key", notificationController.getVapidPublicKey);
// Route to handle POST /subscribe requests
router.post("/subscribe", notificationController.subscribePush);
// Route to handle POST /unsubscribe requests
router.post("/unsubscribe", notificationController.unsubscribePush);
// Route to handle PUT /:id/read requests
router.put("/:id/read", notificationController.markAsRead);
// Route to handle DELETE /clear-read requests
router.delete("/clear-read", notificationController.clearReadNotifications);
// Route to handle DELETE /clear-all requests
router.delete("/clear-all", notificationController.clearAllNotifications);
// Route to handle DELETE /:id requests
router.delete("/:id", notificationController.deleteNotification);

export default router;
