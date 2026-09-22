

// Controller logic for managing chat message operations.
// Processes incoming requests, performs validation, and communicates with services.

import prisma from "../config/prisma.js";
import { createNotification } from "../utils/notifier.js";
import bcrypt from "bcryptjs";

const DELETE_LIMIT_MINUTES = 15; // Configuration variable for deletion time limit (in minutes)

// GET /api/messages/users - Get all active users in the system for starting conversations
export const getAvailableUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: {
        isActive: true,
        id: { not: req.user.id }
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        avatar: true,
        company: true
      },
      orderBy: { fullName: "asc" }
    });
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/messages/conversations - Get list of conversations for logged-in user
export const getConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    const showArchived = req.query.archived === "true";

    const whereClause = {
      participants: {
        some: { id: userId }
      }
    };

    if (showArchived) {
      whereClause.archivedByIds = { has: userId };
    } else {
      whereClause.NOT = { archivedByIds: { has: userId } };
    }

    const conversations = await prisma.conversation.findMany({
      where: whereClause,
      include: {
        locks: true,
        participants: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
            avatar: true,
            company: true
          }
        },
        messages: {
          where: {
            NOT: {
              deletedFor: {
                has: userId
              }
            }
          },
          orderBy: { createdAt: "desc" },
          take: 1,
          include: {
            sender: {
              select: {
                id: true,
                fullName: true
              }
            }
          }
        }
      },
      orderBy: { updatedAt: "desc" }
    });

    // Calculate unread counts for each conversation
    const conversationsWithUnread = await Promise.all(
      conversations.map(async (convo) => {
        const unreadCount = await prisma.message.count({
          where: {
            conversationId: convo.id,
            isRead: false,
            senderId: { not: userId },
            NOT: {
              deletedFor: {
                has: userId
              }
            }
          }
        });

        // Get other participant (assuming 1-to-1 conversation)
        const otherParticipant = convo.type === "GROUP" ? null : (convo.participants.find(p => p.id !== userId) || null);

        let pinnedMessage = null;
        if (convo.pinnedMessageId) {
          pinnedMessage = await prisma.message.findUnique({
            where: { id: convo.pinnedMessageId },
            include: {
              sender: {
                select: { id: true, fullName: true, avatar: true }
              }
            }
          });
        }

        return {
          id: convo.id,
          type: convo.type || "DM",
          name: convo.name || null,
          avatarUrl: convo.avatarUrl || null,
          creatorId: convo.creatorId || null,
          adminIds: convo.adminIds || [],
          archivedByIds: convo.archivedByIds || [],
          pinnedByIds: convo.pinnedByIds || [],
          pinnedMessageId: convo.pinnedMessageId || null,
          pinnedMessage,
          participants: convo.participants,
          createdAt: convo.createdAt,
          updatedAt: convo.updatedAt,
          otherParticipant,
          lastMessage: convo.messages[0] || null,
          unreadCount,
          isLocked: convo.locks && convo.locks.length > 0
        };
      })
    );

    // Filter active conversations: DMs must have other participant, groups are always active
    const activeConversations = conversationsWithUnread.filter(c => c.type === "GROUP" || c.otherParticipant !== null);

    // De-duplicate conversations: DMs only by otherParticipant.id, GROUPs are always unique by id
    const seenParticipants = new Set();
    const uniqueConversations = [];
    for (const convo of activeConversations) {
      if (convo.type === "GROUP") {
        uniqueConversations.push(convo);
      } else {
        if (!seenParticipants.has(convo.otherParticipant.id)) {
          seenParticipants.add(convo.otherParticipant.id);
          uniqueConversations.push(convo);
        }
      }
    }

    res.status(200).json({ success: true, data: uniqueConversations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/messages/conversations - Get or create a conversation with a participant
export const getOrCreateConversation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { participantId } = req.body;

    if (!participantId) {
      return res.status(400).json({ success: false, message: "Participant ID is required." });
    }

    const targetId = Number(participantId);

    if (userId === targetId) {
      return res.status(400).json({ success: false, message: "You cannot start a conversation with yourself." });
    }

    // Find if there is an existing DM conversation (NOT a group chat)
    const existingConvo = await prisma.conversation.findFirst({
      where: {
        AND: [
          { type: { not: "GROUP" } },
          { participants: { some: { id: userId } } },
          { participants: { some: { id: targetId } } }
        ]
      },
      include: {
        participants: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
            avatar: true,
            company: true
          }
        }
      }
    });

    if (existingConvo) {
      const otherParticipant = existingConvo.participants.find(p => p.id !== userId);

      let pinnedMessage = null;
      if (existingConvo.pinnedMessageId) {
        pinnedMessage = await prisma.message.findUnique({
          where: { id: existingConvo.pinnedMessageId },
          include: {
            sender: {
              select: { id: true, fullName: true, avatar: true }
            }
          }
        });
      }

      const lock = await prisma.conversationLock.findUnique({
        where: {
          conversationId: existingConvo.id
        }
      });
      return res.status(200).json({
        success: true,
        data: {
          id: existingConvo.id,
          type: existingConvo.type || "DM",
          name: existingConvo.name || null,
          avatarUrl: existingConvo.avatarUrl || null,
          creatorId: existingConvo.creatorId || null,
          adminIds: existingConvo.adminIds || [],
          archivedByIds: existingConvo.archivedByIds || [],
          pinnedByIds: existingConvo.pinnedByIds || [],
          pinnedMessageId: existingConvo.pinnedMessageId || null,
          pinnedMessage,
          createdAt: existingConvo.createdAt,
          updatedAt: existingConvo.updatedAt,
          otherParticipant,
          isLocked: !!lock
        }
      });
    }

    // Create new conversation
    const newConvo = await prisma.conversation.create({
      data: {
        participants: {
          connect: [
            { id: userId },
            { id: targetId }
          ]
        }
      },
      include: {
        participants: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
            avatar: true,
            company: true
          }
        }
      }
    });

    const otherParticipant = newConvo.participants.find(p => p.id !== userId);

    res.status(201).json({
      success: true,
      data: {
        id: newConvo.id,
        type: newConvo.type || "DM",
        name: newConvo.name || null,
        avatarUrl: newConvo.avatarUrl || null,
        creatorId: newConvo.creatorId || null,
        adminIds: newConvo.adminIds || [],
        archivedByIds: newConvo.archivedByIds || [],
        pinnedByIds: newConvo.pinnedByIds || [],
        pinnedMessageId: null,
        pinnedMessage: null,
        createdAt: newConvo.createdAt,
        updatedAt: newConvo.updatedAt,
        otherParticipant,
        isLocked: false
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/messages/conversations/:id/messages - Get all messages in a conversation
export const getConversationMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const conversationId = Number(req.params.id);

    // Verify user is participant of the conversation
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        participants: { some: { id: userId } }
      }
    });

    if (!conversation) {
      return res.status(403).json({ success: false, message: "Access denied or conversation not found." });
    }

    // Verify conversation lock
    const lock = await prisma.conversationLock.findUnique({
      where: {
        conversationId
      }
    });

    if (lock) {
      const pinHeader = req.headers["x-chat-pin"];
      if (!pinHeader) {
        return res.status(401).json({ success: false, message: "PIN required for locked conversation." });
      }
      const isMatch = await bcrypt.compare(pinHeader, lock.pin);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: "Invalid PIN. Access denied." });
      }
    }

    // Mark messages sent by the other participant in this conversation as read
    await prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
        isRead: false,
        NOT: {
          deletedFor: {
            has: userId
          }
        }
      },
      data: {
        isRead: true
      }
    });

    // Retrieve the full message list
    const messages = await prisma.message.findMany({
      where: { 
        conversationId,
        NOT: {
          deletedFor: {
            has: userId
          }
        }
      },
      include: {
        sender: {
          select: {
            id: true,
            fullName: true,
            role: true,
            avatar: true
          }
        }
      },
      orderBy: { createdAt: "asc" }
    });

    res.status(200).json({ success: true, data: messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/messages/conversations/:id/messages - Send a message in a conversation
export const sendMessage = async (req, res) => {
  try {
    const userId = req.user.id;
    const conversationId = Number(req.params.id);
    const { content } = req.body;

    if (!content || content.trim() === "") {
      return res.status(400).json({ success: false, message: "Message content cannot be empty." });
    }

    // Verify user is participant of the conversation
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        participants: { some: { id: userId } }
      }
    });

    if (!conversation) {
      return res.status(403).json({ success: false, message: "Access denied or conversation not found." });
    }

    // Verify conversation lock
    const lock = await prisma.conversationLock.findUnique({
      where: {
        conversationId
      }
    });

    if (lock) {
      const pinHeader = req.headers["x-chat-pin"];
      if (!pinHeader) {
        return res.status(401).json({ success: false, message: "PIN required for locked conversation." });
      }
      const isMatch = await bcrypt.compare(pinHeader, lock.pin);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: "Invalid PIN. Access denied." });
      }
    }

    // Create the message record
    const message = await prisma.message.create({
      data: {
        content,
        conversationId,
        senderId: userId
      },
      include: {
        sender: {
          select: {
            id: true,
            fullName: true,
            role: true,
            avatar: true
          }
        }
      }
    });

    // Update conversation updatedAt timestamp to float it to the top
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() }
    });

    // Send notification to the recipient(s) of the message
    try {
      const convo = await prisma.conversation.findUnique({
        where: { id: conversationId },
        select: {
          type: true,
          name: true,
          participants: {
            select: { id: true }
          }
        }
      });
      if (convo) {
        if (convo.type === "GROUP") {
          const otherParticipants = convo.participants.filter(p => p.id !== userId);
          for (const recipient of otherParticipants) {
            await createNotification({
              userId: recipient.id,
              title: `New message in group "${convo.name || "Group"}" from ${message.sender.fullName}`,
              message: content.length > 60 ? `${content.substring(0, 60)}...` : content,
              type: "message",
              linkId: conversationId
            });
          }
        } else {
          const recipient = convo.participants.find(p => p.id !== userId);
          if (recipient) {
            await createNotification({
              userId: recipient.id,
              title: `New message from ${message.sender.fullName}`,
              message: content.length > 60 ? `${content.substring(0, 60)}...` : content,
              type: "message",
              linkId: conversationId
            });
          }
        }
      }
    } catch (notifError) {
      console.error("Failed to dispatch message notification:", notifError.message || notifError);
    }

    res.status(201).json({ success: true, data: message });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/messages/conversations/:id/messages - Bulk delete messages in a conversation
export const deleteMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const conversationId = Number(req.params.id);
    const { messageIds, deleteType } = req.body;

    if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
      return res.status(400).json({ success: false, message: "No message IDs provided." });
    }

    // Verify user is participant of the conversation
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        participants: { some: { id: userId } }
      }
    });

    if (!conversation) {
      return res.status(403).json({ success: false, message: "Access denied or conversation not found." });
    }

    const messages = await prisma.message.findMany({
      where: {
        conversationId,
        id: { in: messageIds.map(Number) }
      }
    });

    const hasExceeded = messages.some(msg => {
      const diffMin = (new Date() - new Date(msg.createdAt)) / 1000 / 60;
      return diffMin > DELETE_LIMIT_MINUTES;
    });
    if (hasExceeded) {
      return res.status(400).json({ success: false, message: "Deletion time limit exceeded. Messages older than 15 minutes cannot be deleted." });
    }

    if (deleteType === "me") {
      // Append userId to deletedFor for all messages
      for (const msg of messages) {
        if (!msg.deletedFor.includes(userId)) {
          await prisma.message.update({
            where: { id: msg.id },
            data: {
              deletedFor: {
                set: [...msg.deletedFor, userId]
              }
            }
          });
        }
      }
    } else {
      // Delete for everyone - sender or group admin/creator is allowed
      const isGroupAdmin = conversation.creatorId === userId || conversation.adminIds?.includes(userId) || req.user.role === "ADMIN";

      for (const msg of messages) {
        const isAuthor = msg.senderId === userId;
        if (isAuthor) {
          await prisma.message.update({
            where: { id: msg.id },
            data: { content: "[deleted_for_everyone]" }
          });
        } else if (isGroupAdmin) {
          await prisma.message.update({
            where: { id: msg.id },
            data: { content: "[deleted_by_admin]" }
          });
        } else {
          // Hide for this user if not author and not admin
          if (!msg.deletedFor.includes(userId)) {
            await prisma.message.update({
              where: { id: msg.id },
              data: {
                deletedFor: {
                  set: [...msg.deletedFor, userId]
                }
              }
            });
          }
        }
      }
      if (conversation.pinnedMessageId && messageIds.map(Number).includes(conversation.pinnedMessageId)) {
        await prisma.conversation.update({
          where: { id: conversationId },
          data: { pinnedMessageId: null }
        });
      }
    }

    res.status(200).json({ 
      success: true, 
      message: "Selected messages deleted successfully." 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/messages/conversations/:id/messages/:messageId - Delete a single message in a conversation
export const deleteSingleMessage = async (req, res) => {
  try {
    const userId = req.user.id;
    const conversationId = Number(req.params.id);
    const messageId = Number(req.params.messageId);
    const deleteType = req.query.deleteType || "everyone";

    // Verify user is participant of the conversation
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        participants: { some: { id: userId } }
      }
    });

    if (!conversation) {
      return res.status(403).json({ success: false, message: "Access denied or conversation not found." });
    }

    // Find the message if it belongs to this conversation
    const message = await prisma.message.findFirst({
      where: {
        id: messageId,
        conversationId
      }
    });

    if (!message) {
      return res.status(404).json({ success: false, message: "Message not found in this conversation." });
    }

    const diffMin = (new Date() - new Date(message.createdAt)) / 1000 / 60;
    if (diffMin > DELETE_LIMIT_MINUTES) {
      return res.status(400).json({ success: false, message: "Deletion time limit exceeded. Messages older than 15 minutes cannot be deleted." });
    }

    if (message.content === "[deleted_for_everyone]" || message.content === "[deleted_by_admin]") {
      // If the message is already deleted for everyone, deleting it again hides it from this user (delete for me)
      if (!message.deletedFor.includes(userId)) {
        await prisma.message.update({
          where: { id: messageId },
          data: {
            deletedFor: {
              set: [...message.deletedFor, userId]
            }
          }
        });
      }
      return res.status(200).json({ success: true, message: "Placeholder deleted successfully." });
    }

    if (deleteType === "me") {
      // Append userId to deletedFor list
      if (!message.deletedFor.includes(userId)) {
        await prisma.message.update({
          where: { id: messageId },
          data: {
            deletedFor: {
              set: [...message.deletedFor, userId]
            }
          }
        });
      }
    } else {
      // Delete for everyone - sender or group admin/creator is allowed
      const isGroupAdmin = conversation.creatorId === userId || conversation.adminIds?.includes(userId) || req.user.role === "ADMIN";
      if (message.senderId !== userId && !isGroupAdmin) {
        return res.status(403).json({ success: false, message: "You can only delete your own messages unless you are a group administrator." });
      }
      const isAuthor = message.senderId === userId;
      await prisma.message.update({
        where: { id: messageId },
        data: {
          content: isAuthor ? "[deleted_for_everyone]" : "[deleted_by_admin]"
        }
      });
      if (conversation.pinnedMessageId === messageId) {
        await prisma.conversation.update({
          where: { id: conversationId },
          data: { pinnedMessageId: null }
        });
      }
    }

    res.status(200).json({ success: true, message: "Message deleted successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/messages/conversations/:id/clear - Clear all messages in a conversation
export const clearConversation = async (req, res) => {
  try {
    const userId = req.user.id;
    const conversationId = Number(req.params.id);
    const deleteType = req.query.deleteType || "me";

    // Verify user is participant of the conversation
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        participants: { some: { id: userId } }
      }
    });

    if (!conversation) {
      return res.status(403).json({ success: false, message: "Access denied or conversation not found." });
    }

    if (deleteType === "me") {
      // Append user to deletedFor list for all messages in the conversation
      const activeMessages = await prisma.message.findMany({
        where: {
          conversationId,
          NOT: {
            deletedFor: {
              has: userId
            }
          }
        }
      });

      for (const msg of activeMessages) {
        await prisma.message.update({
          where: { id: msg.id },
          data: {
            deletedFor: {
              set: [...msg.deletedFor, userId]
            }
          }
        });
      }
    } else {
      // Clear for everyone: delete all messages in the conversation from the DB
      await prisma.message.deleteMany({
        where: { conversationId }
      });
    }

    res.status(200).json({ success: true, message: "Chat cleared successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/messages/groups - Create a new group conversation
export const createGroup = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, participantIds, avatarUrl } = req.body;

    if (!name || name.trim() === "") {
      return res.status(400).json({ success: false, message: "Group name is required." });
    }

    if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
      return res.status(400).json({ success: false, message: "At least one participant is required." });
    }

    const uniqueParticipantIds = new Set(participantIds.map(Number));
    uniqueParticipantIds.add(userId);

    const group = await prisma.conversation.create({
      data: {
        type: "GROUP",
        name: name.trim(),
        avatarUrl: avatarUrl || null,
        creatorId: userId,
        adminIds: [userId],
        participants: {
          connect: Array.from(uniqueParticipantIds).map(id => ({ id }))
        }
      },
      include: {
        participants: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
            avatar: true,
            company: true
          }
        }
      }
    });

    // Create system message
    const systemMsg = await prisma.message.create({
      data: {
        conversationId: group.id,
        senderId: userId,
        content: `__SYSTEM__:${req.user.fullName} created the group "${name.trim()}"`,
        isRead: false,
        isSystem: true
      },
      include: {
        sender: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
            avatar: true
          }
        }
      }
    });

    res.status(201).json({ success: true, data: group, systemMessage: systemMsg });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/messages/groups/:id - Update group name / avatarUrl
export const updateGroup = async (req, res) => {
  try {
    const userId = req.user.id;
    const conversationId = Number(req.params.id);
    const { name, avatarUrl } = req.body;

    // Verify user is participant
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        participants: { some: { id: userId } }
      }
    });

    if (!conversation) {
      return res.status(403).json({ success: false, message: "Access denied or conversation not found." });
    }

    const updated = await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        name: name !== undefined ? name.trim() : undefined,
        avatarUrl: avatarUrl !== undefined ? avatarUrl : undefined
      },
      include: {
        participants: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
            avatar: true,
            company: true
          }
        }
      }
    });

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/messages/groups/:id/members - Add members to group
export const addGroupMembers = async (req, res) => {
  try {
    const userId = req.user.id;
    const conversationId = Number(req.params.id);
    const { memberIds } = req.body;

    if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
      return res.status(400).json({ success: false, message: "No members specified to add." });
    }

    // Verify user is participant
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        participants: { some: { id: userId } }
      }
    });

    if (!conversation) {
      return res.status(403).json({ success: false, message: "Access denied or conversation not found." });
    }

    const updated = await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        participants: {
          connect: memberIds.map(Number).map(id => ({ id }))
        }
      },
      include: {
        participants: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
            avatar: true,
            company: true
          }
        }
      }
    });

    const addedUsers = await prisma.user.findMany({
      where: { id: { in: memberIds.map(Number) } },
      select: { fullName: true }
    });
    const addedNames = addedUsers.map(u => u.fullName).join(", ");

    const systemMsg = await prisma.message.create({
      data: {
        conversationId,
        senderId: userId,
        content: `__SYSTEM__:${req.user.fullName} added ${addedNames} to the group`,
        isSystem: true
      },
      include: {
        sender: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
            avatar: true
          }
        }
      }
    });

    res.status(200).json({ success: true, data: updated, systemMessage: systemMsg });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/messages/groups/:id/members/:userId - Remove member from group
export const removeGroupMember = async (req, res) => {
  try {
    const userId = req.user.id;
    const conversationId = Number(req.params.id);
    const targetUserId = Number(req.params.userId);

    // Verify user is participant and has permission (is admin or creator of the group)
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        participants: { some: { id: userId } }
      }
    });

    if (!conversation) {
      return res.status(403).json({ success: false, message: "Access denied or conversation not found." });
    }

    // Simple permission check: must be admin, creator, or admin role in DB
    const isModerator = conversation.creatorId === userId || conversation.adminIds.includes(userId) || req.user.role === "ADMIN";
    if (!isModerator && userId !== targetUserId) {
      return res.status(403).json({ success: false, message: "Only group administrators can remove members." });
    }

    const updated = await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        participants: {
          disconnect: { id: targetUserId }
        }
      },
      include: {
        participants: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
            avatar: true,
            company: true
          }
        }
      }
    });

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { fullName: true }
    });

    const systemMsg = await prisma.message.create({
      data: {
        conversationId,
        senderId: userId,
        content: `__SYSTEM__:${req.user.fullName} removed ${targetUser?.fullName || "a user"} from the group`,
        isSystem: true
      },
      include: {
        sender: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
            avatar: true
          }
        }
      }
    });

    res.status(200).json({ success: true, data: updated, systemMessage: systemMsg });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/messages/groups/:id/leave - Leave group
export const leaveGroup = async (req, res) => {
  try {
    const userId = req.user.id;
    const conversationId = Number(req.params.id);

    // Verify user is participant
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        participants: { some: { id: userId } }
      }
    });

    if (!conversation) {
      return res.status(403).json({ success: false, message: "Access denied or conversation not found." });
    }

    // Disconnect user
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        participants: {
          disconnect: { id: userId }
        }
      }
    });

    const systemMsg = await prisma.message.create({
      data: {
        conversationId,
        senderId: userId,
        content: `__SYSTEM__:${req.user.fullName} left the group`,
        isSystem: true
      },
      include: {
        sender: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
            avatar: true
          }
        }
      }
    });

    res.status(200).json({ success: true, message: "Left group successfully.", systemMessage: systemMsg });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/messages/groups/:id/admins - Promote a member to group administrator
export const makeGroupAdmin = async (req, res) => {
  try {
    const userId = req.user.id;
    const conversationId = Number(req.params.id);
    const { targetUserId } = req.body;

    // Verify user is participant and has permission (is admin or creator of the group)
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        participants: { some: { id: userId } }
      }
    });

    if (!conversation) {
      return res.status(403).json({ success: false, message: "Access denied or conversation not found." });
    }

    const isModerator = conversation.creatorId === userId || conversation.adminIds.includes(userId) || req.user.role === "ADMIN";
    if (!isModerator) {
      return res.status(403).json({ success: false, message: "Only group administrators can promote members." });
    }

    const currentAdminIds = conversation.adminIds || [];
    if (currentAdminIds.includes(Number(targetUserId))) {
      return res.status(400).json({ success: false, message: "User is already a group administrator." });
    }

    const updated = await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        adminIds: {
          set: [...currentAdminIds, Number(targetUserId)]
        }
      },
      include: {
        participants: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
            avatar: true,
            company: true
          }
        }
      }
    });

    const targetUser = await prisma.user.findUnique({
      where: { id: Number(targetUserId) },
      select: { fullName: true }
    });

    const systemMsg = await prisma.message.create({
      data: {
        conversationId,
        senderId: userId,
        content: `__SYSTEM_PRIVATE__:${targetUserId}:${targetUser?.fullName || "a user"} has been promoted to Admin`,
        isSystem: true
      },
      include: {
        sender: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
            avatar: true
          }
        }
      }
    });

    res.status(200).json({ success: true, data: updated, systemMessage: systemMsg });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/messages/groups/:id/admins/demote - Demote a group administrator to normal member
export const demoteGroupAdmin = async (req, res) => {
  try {
    const userId = req.user.id;
    const conversationId = Number(req.params.id);
    const { targetUserId } = req.body;

    // Verify user is participant and has permission (is admin or creator of the group)
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        participants: { some: { id: userId } }
      }
    });

    if (!conversation) {
      return res.status(403).json({ success: false, message: "Access denied or conversation not found." });
    }

    const isModerator = conversation.creatorId === userId || conversation.adminIds.includes(userId) || req.user.role === "ADMIN";
    if (!isModerator) {
      return res.status(403).json({ success: false, message: "Only group administrators can demote members." });
    }

    // A group admin cannot demote the group creator
    if (conversation.creatorId === Number(targetUserId)) {
      return res.status(400).json({ success: false, message: "Cannot demote the group creator." });
    }

    const currentAdminIds = conversation.adminIds || [];
    if (!currentAdminIds.includes(Number(targetUserId))) {
      return res.status(400).json({ success: false, message: "User is not a group administrator." });
    }

    const updated = await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        adminIds: {
          set: currentAdminIds.filter(id => id !== Number(targetUserId))
        }
      },
      include: {
        participants: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
            avatar: true,
            company: true
          }
        }
      }
    });

    const targetUser = await prisma.user.findUnique({
      where: { id: Number(targetUserId) },
      select: { fullName: true }
    });

    const systemMsg = await prisma.message.create({
      data: {
        conversationId,
        senderId: userId,
        content: `__SYSTEM_PRIVATE__:${targetUserId}:${targetUser?.fullName || "a user"} has been demoted to Member`,
        isSystem: true
      },
      include: {
        sender: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
            avatar: true
          }
        }
      }
    });

    res.status(200).json({ success: true, data: updated, systemMessage: systemMsg });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/messages/groups/:id - Delete group conversation (Admin only)
export const deleteGroup = async (req, res) => {
  try {
    const userId = req.user.id;
    const conversationId = Number(req.params.id);

    // Verify conversation exists and user has permission (creator, admin of group, or Admin role)
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId }
    });

    if (!conversation) {
      return res.status(404).json({ success: false, message: "Group conversation not found." });
    }

    const isModerator = conversation.creatorId === userId || conversation.adminIds.includes(userId) || req.user.role === "ADMIN";
    if (!isModerator) {
      return res.status(403).json({ success: false, message: "Only group administrators can delete this group." });
    }

    // Delete all messages associated with the conversation
    await prisma.message.deleteMany({
      where: { conversationId }
    });

    // Delete conversation
    await prisma.conversation.delete({
      where: { id: conversationId }
    });

    res.status(200).json({ success: true, message: "Group deleted successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/messages/conversations/:id/archive - Archive a conversation for the user
export const archiveConversation = async (req, res) => {
  try {
    const userId = req.user.id;
    const conversationId = Number(req.params.id);

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { participants: true }
    });

    if (!conversation) {
      return res.status(404).json({ success: false, message: "Conversation not found." });
    }

    const isParticipant = conversation.participants.some(p => p.id === userId);
    if (!isParticipant) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    if (!conversation.archivedByIds.includes(userId)) {
      await prisma.conversation.update({
        where: { id: conversationId },
        data: {
          archivedByIds: {
            set: [...conversation.archivedByIds, userId]
          }
        }
      });
    }

    res.status(200).json({ success: true, message: "Conversation archived successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/messages/conversations/:id/unarchive - Unarchive a conversation for the user
export const unarchiveConversation = async (req, res) => {
  try {
    const userId = req.user.id;
    const conversationId = Number(req.params.id);

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { participants: true }
    });

    if (!conversation) {
      return res.status(404).json({ success: false, message: "Conversation not found." });
    }

    const isParticipant = conversation.participants.some(p => p.id === userId);
    if (!isParticipant) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    if (conversation.archivedByIds.includes(userId)) {
      await prisma.conversation.update({
        where: { id: conversationId },
        data: {
          archivedByIds: {
            set: conversation.archivedByIds.filter(id => id !== userId)
          }
        }
      });
    }

    res.status(200).json({ success: true, message: "Conversation unarchived successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/messages/conversations/:id/pin/:messageId - Pin a message in a conversation
export const pinMessage = async (req, res) => {
  try {
    const userId = req.user.id;
    const conversationId = Number(req.params.id);
    const messageId = Number(req.params.messageId);

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { participants: true }
    });

    if (!conversation) {
      return res.status(404).json({ success: false, message: "Conversation not found." });
    }

    const isParticipant = conversation.participants.some(p => p.id === userId);
    if (!isParticipant) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    // Authorization check for group chats: creators and group admins only, DMs: either
    if (conversation.type === "GROUP") {
      const isGroupAdmin = conversation.creatorId === userId || conversation.adminIds.includes(userId) || req.user.role === "ADMIN";
      if (!isGroupAdmin) {
        return res.status(403).json({ success: false, message: "Only group administrators can pin messages." });
      }
    }

    // Verify message exists in this conversation
    const msg = await prisma.message.findFirst({
      where: { id: messageId, conversationId }
    });

    if (!msg) {
      return res.status(404).json({ success: false, message: "Message not found in this conversation." });
    }

    // Update conversation with pinnedMessageId
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { pinnedMessageId: messageId }
    });

    // Create system message to notify all participants
    const systemMsg = await prisma.message.create({
      data: {
        conversationId,
        senderId: userId,
        content: `__SYSTEM__:${req.user.fullName} pinned a message`,
        isSystem: true
      },
      include: {
        sender: {
          select: { id: true, fullName: true, role: true, avatar: true }
        }
      }
    });

    res.status(200).json({ 
      success: true, 
      message: "Message pinned successfully.", 
      pinnedMessageId: messageId,
      systemMessage: systemMsg
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/messages/conversations/:id/lock - Lock a conversation with a 4-digit PIN
export const lockConversation = async (req, res) => {
  try {
    const userId = req.user.id;
    const conversationId = Number(req.params.id);
    const { pin } = req.body;

    if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      return res.status(400).json({ success: false, message: "PIN must be a 4-digit number." });
    }

    // Verify user is participant of the conversation
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        participants: { some: { id: userId } }
      }
    });

    if (!conversation) {
      return res.status(403).json({ success: false, message: "Access denied or conversation not found." });
    }

    // Check if the conversation is already locked (by anyone)
    const lockForConvo = await prisma.conversationLock.findUnique({
      where: { conversationId }
    });

    if (lockForConvo) {
      return res.status(400).json({ success: false, message: "Conversation is already locked." });
    }

    // Enforce that the PIN must match the PIN of any existing locked chats for this user
    const existingLock = await prisma.conversationLock.findFirst({
      where: { userId }
    });

    let hashedPin;
    if (existingLock) {
      const isMatch = await bcrypt.compare(pin, existingLock.pin);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: "PIN does not match your existing PIN for locked chats." });
      }
      hashedPin = existingLock.pin;
    } else {
      const salt = await bcrypt.genSalt(10);
      hashedPin = await bcrypt.hash(pin, salt);
    }

    await prisma.conversationLock.create({
      data: {
        conversationId,
        userId,
        pin: hashedPin
      }
    });

    res.status(200).json({ success: true, message: "Conversation locked successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/messages/conversations/:id/pin - Unpin currently pinned message in a conversation
export const unpinMessage = async (req, res) => {
  try {
    const userId = req.user.id;
    const conversationId = Number(req.params.id);

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { participants: true }
    });

    if (!conversation) {
      return res.status(404).json({ success: false, message: "Conversation not found." });
    }

    const isParticipant = conversation.participants.some(p => p.id === userId);
    if (!isParticipant) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    // Authorization check for group chats: creators and group admins only, DMs: either
    if (conversation.type === "GROUP") {
      const isGroupAdmin = conversation.creatorId === userId || conversation.adminIds.includes(userId) || req.user.role === "ADMIN";
      if (!isGroupAdmin) {
        return res.status(403).json({ success: false, message: "Only group administrators can unpin messages." });
      }
    }

    // Update conversation
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { pinnedMessageId: null }
    });

    // Create system message to notify all participants
    const systemMsg = await prisma.message.create({
      data: {
        conversationId,
        senderId: userId,
        content: `__SYSTEM__:${req.user.fullName} unpinned a message`,
        isSystem: true
      },
      include: {
        sender: {
          select: { id: true, fullName: true, role: true, avatar: true }
        }
      }
    });

    res.status(200).json({ 
      success: true, 
      message: "Message unpinned successfully.",
      systemMessage: systemMsg
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/messages/conversations/:id/unlock - Unlock a conversation (verifies PIN)
export const unlockConversation = async (req, res) => {
  try {
    const userId = req.user.id;
    const conversationId = Number(req.params.id);
    const { pin } = req.body;

    if (!pin) {
      return res.status(400).json({ success: false, message: "PIN is required." });
    }

    const lock = await prisma.conversationLock.findUnique({
      where: {
        conversationId
      }
    });

    if (!lock) {
      return res.status(200).json({ success: true, message: "Conversation is not locked." });
    }

    const isMatch = await bcrypt.compare(pin, lock.pin);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Invalid PIN. Please try again." });
    }

    res.status(200).json({ success: true, message: "PIN verified successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/messages/conversations/:id/pin-chat - Pin a conversation for the user
export const pinConversation = async (req, res) => {
  try {
    const userId = req.user.id;
    const conversationId = Number(req.params.id);

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { participants: true }
    });

    if (!conversation) {
      return res.status(404).json({ success: false, message: "Conversation not found." });
    }

    const isParticipant = conversation.participants.some(p => p.id === userId);
    if (!isParticipant) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    if (!conversation.pinnedByIds.includes(userId)) {
      await prisma.conversation.update({
        where: { id: conversationId },
        data: {
          pinnedByIds: {
            set: [...conversation.pinnedByIds, userId]
          }
        }
      });
    }

    res.status(200).json({ success: true, message: "Conversation pinned successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/messages/conversations/:id/remove-lock - Remove lock from a conversation
export const removeConversationLock = async (req, res) => {
  try {
    const userId = req.user.id;
    const conversationId = Number(req.params.id);
    const { pin } = req.body;

    if (!pin) {
      return res.status(400).json({ success: false, message: "PIN is required." });
    }

    const lock = await prisma.conversationLock.findUnique({
      where: {
        conversationId
      }
    });

    if (!lock) {
      return res.status(400).json({ success: false, message: "Conversation is not locked." });
    }

    const isMatch = await bcrypt.compare(pin, lock.pin);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Invalid PIN. Please try again." });
    }

    await prisma.conversationLock.delete({
      where: {
        conversationId
      }
    });

    res.status(200).json({ success: true, message: "Conversation lock removed successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/messages/conversations/:id/pin-chat - Unpin a conversation for the user
export const unpinConversation = async (req, res) => {
  try {
    const userId = req.user.id;
    const conversationId = Number(req.params.id);

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { participants: true }
    });

    if (!conversation) {
      return res.status(404).json({ success: false, message: "Conversation not found." });
    }

    const isParticipant = conversation.participants.some(p => p.id === userId);
    if (!isParticipant) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    if (conversation.pinnedByIds.includes(userId)) {
      await prisma.conversation.update({
        where: { id: conversationId },
        data: {
          pinnedByIds: {
            set: conversation.pinnedByIds.filter(id => id !== userId)
          }
        }
      });
    }

    res.status(200).json({ success: true, message: "Conversation unpinned successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/messages/conversations/reset-pin - Reset chat PIN using account password
export const resetChatPinWithPassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { password, newPin } = req.body;

    if (!password) {
      return res.status(400).json({ success: false, message: "Password is required." });
    }

    if (!newPin || newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      return res.status(400).json({ success: false, message: "New PIN must be a 4-digit number." });
    }

    // Fetch user to verify account password
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Incorrect account password." });
    }

    // Hash the new PIN
    const salt = await bcrypt.genSalt(10);
    const hashedPin = await bcrypt.hash(newPin, salt);

    // Update all existing conversation locks for this user
    await prisma.conversationLock.updateMany({
      where: { userId },
      data: { pin: hashedPin }
    });

    res.status(200).json({ success: true, message: "PIN reset successfully for all locked chats." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
