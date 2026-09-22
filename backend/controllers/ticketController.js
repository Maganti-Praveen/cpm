// Controller logic for managing ticket operations.
// Processes incoming requests, performs validation, and communicates with services.

import prisma from "../config/prisma.js";
import { dispatch } from "../services/email/emailDispatcher.js";
import { createNotification, notifyAdmins } from "../utils/notifier.js";
import { getCache, setCache, invalidateTickets } from "../utils/cache.js";

// GET /api/tickets
export const getTickets = async (req, res) => {
  try {
    const cacheKey = `tickets:list:${req.user.role}:${req.user.id}`;
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      return res.status(200).json({
        success: true,
        data: cachedData
      });
    }

    let whereClause = {};
    if (req.user.role === "CLIENT") {
      whereClause = { clientId: req.user.id };
    } else if (req.user.role === "STAFF") {
      const staffProjects = await prisma.project.findMany({
        where: {
          team: {
            some: { id: req.user.id }
          }
        },
        select: { clientId: true }
      });
      const clientIds = staffProjects.map(p => p.clientId).filter(id => id !== null);
      whereClause = { clientId: { in: clientIds } };
    }

    const tickets = await prisma.ticket.findMany({
      where: whereClause,
      include: {
        client: {
          select: {
            id: true,
            fullName: true,
            email: true,
            company: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    await setCache(cacheKey, tickets, 3600);

    res.status(200).json({
      success: true,
      data: tickets
    });
  } catch (error) {
    console.error("GET Tickets Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/tickets
export const createTicket = async (req, res) => {
  try {
    const { subject, category, priority, description, attachment, clientId } = req.body;

    if (!subject || !category || !description) {
      return res.status(400).json({
        success: false,
        message: "Subject, Category, and Description are required fields."
      });
    }

    const targetClientId = req.user.role === "CLIENT" 
      ? req.user.id 
      : Number(clientId || req.user.id);

    if (!targetClientId || isNaN(targetClientId)) {
      return res.status(400).json({
        success: false,
        message: "A valid client must be selected."
      });
    }

    const ticket = await prisma.ticket.create({
      data: {
        subject,
        category,
        priority: priority || "Medium",
        description,
        attachment: attachment || null,
        clientId: targetClientId
      },
      include: {
        client: {
          select: {
            id: true,
            fullName: true,
            email: true,
            company: true
          }
        }
      }
    });

    // Notify all admins about the new ticket (Push/WS)
    await notifyAdmins({
      title: "New Support Ticket",
      message: `Client "${ticket.client?.fullName || 'Client'}" created ticket: "${ticket.subject}"`,
      type: "ticket",
      linkId: ticket.id
    });

    // Email notification to Admins if client created the ticket
    if (req.user.role === "CLIENT") {
      try {
        const admins = await prisma.user.findMany({ where: { role: "ADMIN" } });
        await Promise.all(
          admins.map(admin =>
            dispatch("support-ticket-update", admin.email, {
              clientName: admin.fullName,
              ticketId: String(ticket.id),
              ticketSubject: `New Ticket: ${ticket.subject}`,
              replyMessage: `Client "${req.user.fullName}" has opened a new support ticket. Description: ${ticket.description}`,
              loginUrl: process.env.FRONTEND_URL || "http://localhost:5173",
              companyName: "Sai IT Services",
            })
          )
        );
      } catch (err) {
        console.error("Failed to email admins about new ticket:", err.message);
      }
    }

    // If admin/staff created the ticket on behalf of a client, notify that client too
    if (req.user.role !== "CLIENT" && targetClientId !== req.user.id) {
      await createNotification({
        userId: targetClientId,
        title: "Support Ticket Opened",
        message: `A support ticket has been opened on your behalf: "${ticket.subject}"`,
        type: "ticket",
        linkId: ticket.id
      });

      // Also email the client so they are notified even if not currently logged in
      try {
        const clientUser = await prisma.user.findUnique({ where: { id: targetClientId } });
        if (clientUser) {
          dispatch("support-ticket-update", clientUser.email, {
            clientName: clientUser.fullName,
            ticketId: String(ticket.id),
            ticketSubject: ticket.subject,
            replyMessage: `A new support ticket has been opened on your behalf. Description: ${ticket.description}`,
            loginUrl: process.env.FRONTEND_URL || "http://localhost:5173",
            companyName: "Sai IT Services",
          });
        }
      } catch (_) { /* email failure is non-critical */ }
    }

    await invalidateTickets();

    res.status(201).json({
      success: true,
      message: "Ticket created successfully.",
      data: ticket
    });
  } catch (error) {
    console.error("Ticket Create Error:", error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// GET /api/tickets/:id
export const getTicketById = async (req, res) => {
  try {
    const { id } = req.params;

    const cacheKey = `tickets:details:${id}:${req.user.role}`;
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      return res.status(200).json({
        success: true,
        data: cachedData
      });
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: Number(id) },
      include: {
        client: {
          select: {
            id: true,
            fullName: true,
            email: true,
            company: true,
            avatar: true
          }
        },
        replies: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                role: true,
                avatar: true
              }
            }
          },
          orderBy: { createdAt: "asc" }
        }
      }
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found."
      });
    }

    // Authorization check: Clients can only access their own tickets
    if (req.user.role === "CLIENT" && ticket.clientId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to view this ticket."
      });
    }

    if (req.user.role === "STAFF") {
      const staffProjects = await prisma.project.findMany({
        where: {
          team: {
            some: { id: req.user.id }
          }
        },
        select: { clientId: true }
      });
      const clientIds = staffProjects.map(p => p.clientId).filter(id => id !== null);
      if (!clientIds.includes(ticket.clientId)) {
        return res.status(403).json({
          success: false,
          message: "You do not have permission to view this ticket."
        });
      }
    }

    // Client-side safeguard: hide internal replies starting with [INTERNAL]
    if (ticket && req.user.role === "CLIENT") {
      ticket.replies = ticket.replies.filter(r => !r.message.startsWith("[INTERNAL]"));
    }

    await setCache(cacheKey, ticket, 3600);

    res.status(200).json({
      success: true,
      data: ticket
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/tickets/:id/reply
export const replyToTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { message, isInternal } = req.body;

    if (!message || message.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Reply message cannot be empty."
      });
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: Number(id) }
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found."
      });
    }

    // Authorization check
    if (req.user.role === "CLIENT" && ticket.clientId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to reply to this ticket."
      });
    }

    if (req.user.role === "STAFF") {
      const staffProjects = await prisma.project.findMany({
        where: {
          team: {
            some: { id: req.user.id }
          }
        },
        select: { clientId: true }
      });
      const clientIds = staffProjects.map(p => p.clientId).filter(id => id !== null);
      if (!clientIds.includes(ticket.clientId)) {
        return res.status(403).json({
          success: false,
          message: "You do not have permission to reply to this ticket."
        });
      }
    }

    // Prefix with [INTERNAL] if marked internal
    const dbMessage = isInternal ? `[INTERNAL] ${message}` : message;

    // Parse out message content if message is a structured JSON string
    let parsedMessageText = message;
    let replyPriority = "";
    try {
      const parsed = JSON.parse(message);
      if (parsed && typeof parsed === "object" && parsed.hasOwnProperty("message")) {
        parsedMessageText = parsed.message;
        replyPriority = parsed.priority || "";
      }
    } catch (e) {
      // Fallback to original message text
    }

    // Create ticket reply
    const reply = await prisma.ticketReply.create({
      data: {
        message: dbMessage,
        ticketId: Number(id),
        userId: req.user.id
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            role: true,
            avatar: true
          }
        }
      }
    });

    // Optionally update ticket's updatedAt status, status and priority
    // For example, if a client replies, keep it open, or if an admin replies, mark it in progress
    const updatedStatus = req.user.role === "CLIENT" ? "Open" : "In Progress";
    const ticketUpdateData = { 
      status: ticket.status === "Closed" || ticket.status === "Resolved" ? ticket.status : updatedStatus,
      updatedAt: new Date() 
    };
    if (replyPriority) {
      ticketUpdateData.priority = replyPriority;
    }
    await prisma.ticket.update({
      where: { id: Number(id) },
      data: ticketUpdateData
    });

    if (req.user.role === "CLIENT") {
      await notifyAdmins({
        title: "Support Ticket Reply",
        message: `Client "${req.user.fullName}" replied to ticket "${ticket.subject}"`,
        type: "ticket",
        linkId: ticket.id
      });
    } else if (!isInternal) {
      await createNotification({
        userId: ticket.clientId,
        title: "Support Ticket Updated",
        message: `Support team replied to ticket: "${ticket.subject}"`,
        type: "ticket",
        linkId: ticket.id
      });
    }

    // Email the client when admin/staff replies (not internal notes)
    if (req.user.role !== "CLIENT" && !isInternal) {
      try {
        const client = await prisma.user.findUnique({ where: { id: ticket.clientId } });
        if (client) {
          dispatch("support-ticket-update", client.email, {
            clientName: client.fullName,
            ticketId: String(ticket.id),
            ticketSubject: ticket.subject,
            replyMessage: parsedMessageText,
            loginUrl: process.env.FRONTEND_URL || "http://localhost:5173",
            companyName: "Sai IT Services",
          });
        }
      } catch (_) { /* email failure is non-critical */ }
    }

    await invalidateTickets(id);

    res.status(201).json({
      success: true,
      message: "Reply sent successfully.",
      data: reply
    });
  } catch (error) {
    console.error("Ticket Update Error:", error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// PUT /api/tickets/:id
export const updateTicket = async (req, res) => {
  try {
    const { id } = req.params;
    // Only allow status and priority updates (assigneeId is not in the DB schema)
    const { status, priority } = req.body;

    if (req.user.role === "CLIENT") {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to update tickets."
      });
    }

    const ticketToCheck = await prisma.ticket.findUnique({
      where: { id: Number(id) }
    });

    if (!ticketToCheck) {
      return res.status(404).json({ success: false, message: "Ticket not found." });
    }

    if (req.user.role === "STAFF") {
      const staffProjects = await prisma.project.findMany({
        where: {
          team: {
            some: { id: req.user.id }
          }
        },
        select: { clientId: true }
      });
      const clientIds = staffProjects.map(p => p.clientId).filter(id => id !== null);
      if (!clientIds.includes(ticketToCheck.clientId)) {
        return res.status(403).json({
          success: false,
          message: "You do not have permission to update this ticket."
        });
      }
    }

    const updateData = {};
    if (status !== undefined) updateData.status = status;
    if (priority !== undefined) updateData.priority = priority;

    // If there's nothing to update (e.g. only assigneeId was passed which is unsupported), return current ticket
    if (Object.keys(updateData).length === 0) {
      return res.status(200).json({
        success: true,
        message: "No schema fields to update.",
        data: ticketToCheck
      });
    }

    const ticket = await prisma.ticket.update({
      where: { id: Number(id) },
      data: updateData,
      include: {
        client: {
          select: {
            id: true,
            fullName: true,
            email: true,
            company: true
          }
        }
      }
    });

    await invalidateTickets(id);

    res.status(200).json({
      success: true,
      message: "Ticket updated successfully.",
      data: ticket
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// DELETE /api/tickets/:id
export const deleteTicket = async (req, res) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({ success: false, message: "Admin access required." });
    }
    const { id } = req.params;

    const existingTicket = await prisma.ticket.findUnique({
      where: { id: Number(id) }
    });

    if (!existingTicket) {
      return res.status(404).json({ success: false, message: "Ticket not found." });
    }

    await prisma.ticket.delete({
      where: { id: Number(id) }
    });

    await invalidateTickets(id);

    res.status(200).json({
      success: true,
      message: "Ticket deleted successfully."
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
