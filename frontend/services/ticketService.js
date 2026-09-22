// Manages customer support requests, priority states, and thread conversations.
// Orchestrates helpdesk conversations between clients and support representatives.


import API from "./api";

// Initialize local ticket state if backend is offline or empty
const getLocalTickets = () => {
  const local = localStorage.getItem("client_tickets");
  if (local) {
    return JSON.parse(local);
  }

  // Pre-seed mock support tickets (cleared to empty list)
  const defaultTickets = [];

  localStorage.setItem("client_tickets", JSON.stringify(defaultTickets));
  return defaultTickets;
};

export const getTickets = async () => {
  try {
    const res = await API.get("/tickets");
    const assignees = JSON.parse(localStorage.getItem("admin_ticket_assignees") || "{}");
    const list = (res.data.data || []).map(t => {
      const assigneeId = assignees[t.id];
      if (assigneeId) {
        return {
          ...t,
          assigneeId: Number(assigneeId),
          assignee: { id: Number(assigneeId), fullName: "Assigned Agent", role: "STAFF" }
        };
      }
      return t;
    });
    return {
      ...res.data,
      data: list
    };
  } catch (err) {
    console.warn("API getTickets failed, using localStorage fallback:", err.message);
    const tickets = getLocalTickets();
    const formattedList = tickets.map(({ replies, ...rest }) => rest);
    return {
      success: true,
      data: formattedList,
      fallback: true
    };
  }
};

export const createTicket = async (data) => {
  try {
    const res = await API.post("/tickets", data);
    return res.data;
  } catch (err) {
    console.warn("API createTicket failed, using localStorage fallback:", err.message);
    const tickets = getLocalTickets();
    
    const newTicket = {
      id: Math.floor(1000 + Math.random() * 9000), // Random 4-digit ID
      subject: data.subject,
      category: data.category,
      priority: data.priority || "Medium",
      status: "Open",
      description: data.description,
      attachment: data.attachment || null,
      clientId: 999,
      client: {
        id: 999,
        fullName: "Nikhitha Althi",
        email: "client@saiitservices.com",
        company: "Sai IT Services"
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      replies: []
    };

    tickets.unshift(newTicket);
    localStorage.setItem("client_tickets", JSON.stringify(tickets));

    return {
      success: true,
      message: "Ticket created successfully (local sandbox mode).",
      data: newTicket,
      fallback: true
    };
  }
};

export const getTicketById = async (id) => {
  try {
    const res = await API.get(`/tickets/${id}`);
    const assignees = JSON.parse(localStorage.getItem("admin_ticket_assignees") || "{}");
    const ticket = res.data.data;
    if (ticket) {
      const assigneeId = assignees[ticket.id];
      if (assigneeId) {
        ticket.assigneeId = Number(assigneeId);
        ticket.assignee = { id: Number(assigneeId), fullName: "Assigned Agent", role: "STAFF" };
      }
    }
    return {
      ...res.data,
      data: ticket
    };
  } catch (err) {
    console.warn(`API getTicketById (${id}) failed, using localStorage fallback:`, err.message);
    const tickets = getLocalTickets();
    const ticket = tickets.find(t => t.id === Number(id));

    if (!ticket) {
      throw new Error("Ticket not found in local sandbox.");
    }

    return {
      success: true,
      data: ticket,
      fallback: true
    };
  }
};

export const replyToTicket = async (id, message, isInternal = false) => {
  try {
    const res = await API.post(`/tickets/${id}/reply`, { message, isInternal });
    return res.data;
  } catch (err) {
    console.warn(`API replyToTicket (${id}) failed, using localStorage fallback:`, err.message);
    const tickets = getLocalTickets();
    const ticketIndex = tickets.findIndex(t => t.id === Number(id));

    if (ticketIndex === -1) {
      throw new Error("Ticket not found in local sandbox.");
    }

    const newReply = {
      id: Math.floor(100 + Math.random() * 900),
      message: isInternal ? `[INTERNAL] ${message}` : message,
      userId: 999,
      ticketId: Number(id),
      createdAt: new Date().toISOString(),
      user: {
        id: 999,
        fullName: "Nikhitha Althi",
        role: isInternal ? "ADMIN" : "CLIENT",
        avatar: ""
      }
    };

    tickets[ticketIndex].replies.push(newReply);
    tickets[ticketIndex].updatedAt = new Date().toISOString();
    
    // Auto mark open if was resolved/closed or update date
    if (!isInternal && tickets[ticketIndex].status !== "Closed" && tickets[ticketIndex].status !== "Resolved") {
      tickets[ticketIndex].status = "Open";
    }

    localStorage.setItem("client_tickets", JSON.stringify(tickets));

    return {
      success: true,
      message: "Reply added successfully (local sandbox mode).",
      data: newReply,
      fallback: true
    };
  }
};

export const updateTicket = async (id, data) => {
  try {
    const payload = {};
    if (data.status !== undefined) payload.status = data.status;
    if (data.priority !== undefined) payload.priority = data.priority;
    
    // Handle assigneeId locally — it's not in the DB schema
    if (data.assigneeId !== undefined) {
      const assignees = JSON.parse(localStorage.getItem("admin_ticket_assignees") || "{}");
      assignees[id] = data.assigneeId;
      localStorage.setItem("admin_ticket_assignees", JSON.stringify(assignees));
    }

    // If only assigneeId was changed, skip the API call since it's not a DB field
    if (Object.keys(payload).length === 0) {
      const assignees = JSON.parse(localStorage.getItem("admin_ticket_assignees") || "{}");
      const assigneeId = assignees[id];
      return {
        success: true,
        message: "Ticket updated successfully.",
        data: {
          id: Number(id),
          assigneeId: assigneeId ? Number(assigneeId) : null,
          assignee: assigneeId ? { id: Number(assigneeId), fullName: "Assigned Agent", role: "STAFF" } : null
        }
      };
    }

    const res = await API.put(`/tickets/${id}`, payload);
    const ticket = res.data.data;
    if (ticket) {
      const assignees = JSON.parse(localStorage.getItem("admin_ticket_assignees") || "{}");
      const assigneeId = assignees[ticket.id];
      if (assigneeId) {
        ticket.assigneeId = Number(assigneeId);
        ticket.assignee = { id: Number(assigneeId), fullName: "Assigned Agent", role: "STAFF" };
      }
    }

    return {
      ...res.data,
      data: ticket
    };
  } catch (err) {
    console.warn("API updateTicket failed, using localStorage fallback:", err.message);
    const tickets = getLocalTickets();
    const ticketIndex = tickets.findIndex(t => t.id === Number(id));
    if (ticketIndex !== -1) {
      if (data.status !== undefined) tickets[ticketIndex].status = data.status;
      if (data.priority !== undefined) tickets[ticketIndex].priority = data.priority;
      if (data.assigneeId !== undefined) {
        tickets[ticketIndex].assigneeId = data.assigneeId ? Number(data.assigneeId) : null;
        if (data.assigneeId) {
          tickets[ticketIndex].assignee = {
            id: Number(data.assigneeId),
            fullName: "Assigned Agent",
            role: "STAFF"
          };
        } else {
          tickets[ticketIndex].assignee = null;
        }
      }
      tickets[ticketIndex].updatedAt = new Date().toISOString();
      localStorage.setItem("client_tickets", JSON.stringify(tickets));
      return {
        success: true,
        message: "Ticket updated successfully (local sandbox mode).",
        data: tickets[ticketIndex],
        fallback: true
      };
    }
    throw new Error("Ticket not found in local sandbox.");
  }
};

