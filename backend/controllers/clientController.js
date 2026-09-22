// Controller logic for managing client operations.
// Processes incoming requests, performs validation, and communicates with services.

import prisma from "../config/prisma.js";
import bcrypt from "bcryptjs";
import { dispatch } from "../services/email/emailDispatcher.js";
import { getCache, setCache, invalidateClients } from "../utils/cache.js";

// Fetch all clients
export const getClients = async (req, res) => {
  try {
    const cachedData = await getCache("clients:list");
    if (cachedData) {
      return res.status(200).json({
        success: true,
        data: cachedData
      });
    }

    const clients = await prisma.user.findMany({
      where: { role: "CLIENT" },
      include: {
        clientProjects: true
      },
      orderBy: { createdAt: "desc" }
    });

    // Format fields to match frontend layout structure
    const colors = ['#6366F1', '#7C3AED', '#DB2777', '#0284C7', '#059669', '#D97706'];
    const formatted = clients.map((c, index) => {
      const initials = (c.fullName.slice(0, 1) + (c.company?.slice(0, 1) || '')).toUpperCase();
      return {
        id: c.id,
        name: c.fullName,
        company: c.company || "Independent",
        email: c.email,
        phone: c.phone || "N/A",
        activeProjects: c.clientProjects.filter(p => p.status !== "Completed").length,
        status: c.status,
        addedOn: c.createdAt.toLocaleDateString('en-US', {
          month: 'short',
          day: '2-digit',
          year: 'numeric'
        }),
        initials,
        avatarColor: colors[index % colors.length],
        avatar: c.avatar,
        suspensionReason: c.suspensionReason || null,
        suspendedAt: c.suspendedAt || null,
        unsuspendedAt: c.unsuspendedAt || null
      };
    });

    await setCache("clients:list", formatted, 3600);

    res.status(200).json({
      success: true,
      data: formatted
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create a new client (inserts a User with role = CLIENT)
export const createClient = async (req, res) => {
  try {
    const { name, company, email, phone, status, password } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ success: false, message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password || "client123", 10);

    const isSuspended = status === "Suspended";
    const client = await prisma.user.create({
      data: {
        fullName: name,
        email,
        password: hashedPassword,
        role: "CLIENT",
        company,
        phone,
        status: status || "Active",
        suspendedAt: isSuspended ? new Date() : null,
        suspensionReason: isSuspended ? (req.body.suspensionReason || "No reason provided") : null
      }
    });

    // Dispatch welcome email (non-blocking, won't block response on error)
    try {
      dispatch("client-welcome", client.email, {
        clientName: client.fullName,
        email: client.email,
        temporaryPassword: password || "client123",
        loginUrl: process.env.FRONTEND_URL || "http://localhost:5173",
        companyName: "Sai IT Services",
      });
    } catch (err) {
      console.error("[CreateClient] Failed to dispatch welcome email:", err.message);
    }

    await invalidateClients();

    res.status(201).json({
      success: true,
      data: client
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
