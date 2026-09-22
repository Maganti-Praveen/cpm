import prisma from "../config/prisma.js";
import { getCache, setCache } from "../utils/cache.js";

// Function to handle performGlobalSearch operations
export const performGlobalSearch = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim() === "") {
      return res.status(200).json({
        success: true,
        data: { projects: [], tasks: [], users: [], invoices: [], tickets: [] }
      });
    }

    const queryStr = q.trim();
    const { role, id: userId } = req.user;

    const cacheKey = `search:${role}:${userId}:${queryStr}`;
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      return res.status(200).json({
        success: true,
        data: cachedData
      });
    }

    let projectWhere = {
      OR: [
        { name: { contains: queryStr, mode: "insensitive" } },
        { description: { contains: queryStr, mode: "insensitive" } }
      ]
    };

    let taskWhere = {
      OR: [
        { title: { contains: queryStr, mode: "insensitive" } },
        { description: { contains: queryStr, mode: "insensitive" } },
        { taskKey: { contains: queryStr, mode: "insensitive" } }
      ]
    };

    let userWhere = {
      OR: [
        { fullName: { contains: queryStr, mode: "insensitive" } },
        { email: { contains: queryStr, mode: "insensitive" } },
        { company: { contains: queryStr, mode: "insensitive" } }
      ]
    };

    let invoiceWhere = {
      OR: [
        { invoiceNumber: { contains: queryStr, mode: "insensitive" } },
        { description: { contains: queryStr, mode: "insensitive" } }
      ]
    };

    let ticketWhere = {
      OR: [
        { subject: { contains: queryStr, mode: "insensitive" } },
        { description: { contains: queryStr, mode: "insensitive" } }
      ]
    };

    // Role-based search restrictions
    if (role === "CLIENT") {
      projectWhere.clientId = userId;
      taskWhere.project = { clientId: userId };
      userWhere = { id: -1 }; // Don't expose other users
      invoiceWhere.clientId = userId;
      ticketWhere.clientId = userId;
    } else if (role === "STAFF") {
      projectWhere.team = { some: { id: userId } };
      taskWhere.AND = [
        {
          OR: [
            { assigneeId: userId },
            { project: { team: { some: { id: userId } } } }
          ]
        }
      ];
      invoiceWhere = { id: -1 }; // Staff don't manage invoices
      // Staff can see support tickets if relevant or all
    }

    const [projects, tasks, users, invoices, tickets] = await Promise.all([
      prisma.project.findMany({ where: projectWhere, take: 5 }),
      prisma.task.findMany({ where: taskWhere, take: 5 }),
      prisma.user.findMany({ where: userWhere, take: 5 }),
      prisma.invoice.findMany({ where: invoiceWhere, take: 5 }),
      prisma.ticket.findMany({ where: ticketWhere, take: 5 })
    ]);

    const result = {
      projects,
      tasks,
      users,
      invoices,
      tickets
    };

    await setCache(cacheKey, result, 3600);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error("Global search error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
