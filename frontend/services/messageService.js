// Service module for chat messages and conversations API endpoints.
// Orchestrates direct user communication logs.

import API from "./api";

// Get list of active system users available for starting chats
export const getAvailableUsers = async () => {
  const res = await API.get("/messages/users");
  return res.data;
};

// Get list of all conversation threads for current user
export const getConversations = async (archived = false) => {
  const res = await API.get("/messages/conversations", {
    params: { archived }
  });
  return res.data;
};

// Retrieve or create a one-to-one conversation thread with a participant user
export const getOrCreateConversation = async (participantId) => {
  const res = await API.post("/messages/conversations", { participantId });
  return res.data;
};

// Retrieve messages list inside a conversation thread
export const getConversationMessages = async (conversationId, pin = null) => {
  const headers = pin ? { "x-chat-pin": pin } : {};
  const res = await API.get(`/messages/conversations/${conversationId}/messages`, { headers });
  return res.data;
};

// Dispatch a chat message inside a conversation thread
export const sendMessage = async (conversationId, content, pin = null) => {
  const headers = pin ? { "x-chat-pin": pin } : {};
  const res = await API.post(`/messages/conversations/${conversationId}/messages`, { content }, { headers });
  return res.data;
};

// Delete a single message in a conversation thread
export const deleteSingleMessage = async (conversationId, messageId, deleteType = "everyone") => {
  const res = await API.delete(`/messages/conversations/${conversationId}/messages/${messageId}`, {
    params: { deleteType }
  });
  return res.data;
};

// Delete multiple messages in a conversation thread
export const deleteMessages = async (conversationId, messageIds, deleteType = "everyone") => {
  const res = await API.delete(`/messages/conversations/${conversationId}/messages`, { data: { messageIds, deleteType } });
  return res.data;
};

// Clear entire conversation chat history
export const clearConversation = async (conversationId, deleteType = "me") => {
  const res = await API.delete(`/messages/conversations/${conversationId}/clear`, {
    params: { deleteType }
  });
  return res.data;
};

// Create a new group conversation
export const createGroup = async (name, participantIds, avatarUrl = "") => {
  const res = await API.post("/messages/groups", { name, participantIds, avatarUrl });
  return res.data;
};

// Update group name or avatar
export const updateGroup = async (groupId, name, avatarUrl) => {
  const res = await API.put(`/messages/groups/${groupId}`, { name, avatarUrl });
  return res.data;
};

// Add members to a group
export const addGroupMembers = async (groupId, memberIds) => {
  const res = await API.post(`/messages/groups/${groupId}/members`, { memberIds });
  return res.data;
};

// Remove a member from a group
export const removeGroupMember = async (groupId, userId) => {
  const res = await API.delete(`/messages/groups/${groupId}/members/${userId}`);
  return res.data;
};

// Leave a group
export const leaveGroup = async (groupId) => {
  const res = await API.post(`/messages/groups/${groupId}/leave`);
  return res.data;
};

// Promote a member to group administrator
export const makeGroupAdmin = async (groupId, targetUserId) => {
  const res = await API.post(`/messages/groups/${groupId}/admins`, { targetUserId });
  return res.data;
};

// Delete a group conversation (admin only)
export const deleteGroup = async (groupId) => {
  const res = await API.delete(`/messages/groups/${groupId}`);
  return res.data;
};

// Demote a group administrator to normal member
export const demoteGroupAdmin = async (groupId, targetUserId) => {
  const res = await API.post(`/messages/groups/${groupId}/admins/demote`, { targetUserId });
  return res.data;
};

// Archive a conversation
export const archiveConversation = async (conversationId) => {
  const res = await API.post(`/messages/conversations/${conversationId}/archive`);
  return res.data;
};

// Unarchive a conversation
export const unarchiveConversation = async (conversationId) => {
  const res = await API.post(`/messages/conversations/${conversationId}/unarchive`);
  return res.data;
};

// Pin a message in a conversation
export const pinMessage = async (conversationId, messageId) => {
  const res = await API.post(`/messages/conversations/${conversationId}/pin/${messageId}`);
  return res.data;
};

// Unpin currently pinned message in a conversation
export const unpinMessage = async (conversationId) => {
  const res = await API.delete(`/messages/conversations/${conversationId}/pin`);
  return res.data;
};

// Pin a conversation thread
export const pinConversation = async (conversationId) => {
  const res = await API.post(`/messages/conversations/${conversationId}/pin-chat`);
  return res.data;
};

// Unpin a conversation thread
export const unpinConversation = async (conversationId) => {
  const res = await API.delete(`/messages/conversations/${conversationId}/pin-chat`);
  return res.data;
};

// Lock a conversation with a 4-digit PIN
export const lockConversation = async (conversationId, pin) => {
  const res = await API.post(`/messages/conversations/${conversationId}/lock`, { pin });
  return res.data;
};

// Unlock a conversation (verifies PIN)
export const unlockConversation = async (conversationId, pin) => {
  const res = await API.post(`/messages/conversations/${conversationId}/unlock`, { pin });
  return res.data;
};

// Remove lock from a conversation
export const removeConversationLock = async (conversationId, pin) => {
  const res = await API.post(`/messages/conversations/${conversationId}/remove-lock`, { pin });
  return res.data;
};

// Reset chat PIN across all locked conversations using account password verification
export const resetChatPin = async (password, newPin) => {
  const res = await API.post("/messages/conversations/reset-pin", { password, newPin });
  return res.data;
};
