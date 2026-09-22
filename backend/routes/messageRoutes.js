// Express routing definitions for message endpoints.
// Maps HTTP methods and URL paths to their respective controller functions.

import express from "express";
import * as messageController from "../controllers/messageController.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// Protect all messaging routes
router.use(auth);

// Get users list for starting chat search
router.get("/users", messageController.getAvailableUsers);

// Conversations routes
router.get("/conversations", messageController.getConversations);
router.post("/conversations", messageController.getOrCreateConversation);
router.post("/conversations/reset-pin", messageController.resetChatPinWithPassword);
router.post("/conversations/:id/lock", messageController.lockConversation);
router.post("/conversations/:id/unlock", messageController.unlockConversation);
router.post("/conversations/:id/remove-lock", messageController.removeConversationLock);

// Group management routes
router.post("/groups", messageController.createGroup);
router.put("/groups/:id", messageController.updateGroup);
router.post("/groups/:id/members", messageController.addGroupMembers);
router.delete("/groups/:id/members/:userId", messageController.removeGroupMember);
router.post("/groups/:id/leave", messageController.leaveGroup);
router.post("/groups/:id/admins", messageController.makeGroupAdmin);
router.post("/groups/:id/admins/demote", messageController.demoteGroupAdmin);
router.delete("/groups/:id", messageController.deleteGroup);

// Message-level routes
router.get("/conversations/:id/messages", messageController.getConversationMessages);
router.post("/conversations/:id/messages", messageController.sendMessage);
router.delete("/conversations/:id/messages", messageController.deleteMessages);
router.delete("/conversations/:id/messages/:messageId", messageController.deleteSingleMessage);
router.delete("/conversations/:id/clear", messageController.clearConversation);

// Archive/Pin routes
router.post("/conversations/:id/archive", messageController.archiveConversation);
router.post("/conversations/:id/unarchive", messageController.unarchiveConversation);
router.post("/conversations/:id/pin/:messageId", messageController.pinMessage);
router.delete("/conversations/:id/pin", messageController.unpinMessage);
router.post("/conversations/:id/pin-chat", messageController.pinConversation);
router.delete("/conversations/:id/pin-chat", messageController.unpinConversation);

export default router;
