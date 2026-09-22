// Controller logic for managing dashboard operations.
// Processes incoming requests, performs validation, and communicates with services.

import prisma from "../config/prisma.js";
import { getCache, setCache } from "../utils/cache.js";

// Function to handle getDashboardSummary operations
export const getDashboardSummary = async (req, res) => {
  try {
    const cachedData = await getCache("dashboard:summary");
    if (cachedData) {
      return res.status(200).json({
        success: true,
        data: cachedData
      });
    }

    // 1. Get counts
    const activeProjectsCount = await prisma.project.count({
      where: {
        NOT: { status: "Completed" }
      }
    });

    const pendingTasksCount = await prisma.task.count({
      where: {
        NOT: { status: "Completed" }
      }
    });

    const clientsCount = await prisma.user.count({
      where: {
        role: "CLIENT"
      }
    });

    // Support tickets - count open/in-progress tickets from Ticket model
    const supportTicketsCount = await prisma.ticket.count({
      where: {
        status: { notIn: ["Closed", "Resolved"] }
      }
    });

    // 2. Fetch recent activities
    const activities = await prisma.activity.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        project: true
      }
    });

    // Format activities for timeline widget
    const formattedActivities = activities.map((act) => {
      const diffMs = new Date() - new Date(act.createdAt);
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      let timeAgo = `${diffHours} hours ago`;
      if (diffHours === 0) {
        const diffMins = Math.floor(diffMs / (1000 * 60));
        timeAgo = `${diffMins} minutes ago`;
      } else if (diffHours >= 24) {
        timeAgo = "Yesterday";
      }

      return {
        id: act.id,
        title: act.title,
        detail: act.description || "",
        meta: act.project ? `${act.project.name} • ${timeAgo}` : timeAgo,
        type: act.type || "info"
      };
    });

    // 3. Fetch upcoming deadlines (tasks with due dates, sorted ascending)
    const upcomingTasks = await prisma.task.findMany({
      where: {
        NOT: { status: "Completed" },
        dueDate: { not: null }
      },
      take: 5,
      orderBy: { dueDate: "asc" },
      include: {
        project: true,
        assignee: true
      }
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const formattedDeadlines = upcomingTasks.map((t) => {
      const dueDate = new Date(t.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      const diffTime = dueDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return {
        id: t.id,
        title: t.title,
        project: t.project.name,
        daysLeft: diffDays >= 0 ? diffDays : 0,
        date: t.dueDate.toLocaleDateString("en-US", {
          month: "short",
          day: "2-digit",
          year: "numeric"
        }),
        status: t.status,
        assignee: t.assignee ? t.assignee.fullName : "Unassigned"
      };
    });

    // 4. Fetch recent projects
    const projects = await prisma.project.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        client: true,
        team: true,
        milestones: {
          orderBy: { date: "asc" }
        }
      }
    });

    const formattedProjects = projects.map(p => ({
      id: p.id,
      name: p.name,
      client: p.client ? p.client.company : "Independent",
      progress: p.progress,
      status: p.status,
      startDate: p.startDate ? p.startDate.toISOString() : null,
      rawDueDate: p.dueDate ? p.dueDate.toISOString() : null,
      dueDate: p.dueDate ? p.dueDate.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }) : "N/A",
      milestones: p.milestones.map(m => ({
        id: m.id,
        title: m.title,
        date: m.date ? m.date.toISOString() : null,
        status: m.status,
        progress: m.progress
      })),
      team: p.team.map((t, idx) => {
        const colors = ['#6366F1', '#059669', '#D97706', '#DC2626', '#0284C7', '#7C3AED'];
        return {
          id: t.id,
          name: t.fullName,
          src: t.avatar,
          color: colors[idx % colors.length]
        };
      })
    }));

    const responseData = {
      stats: {
        activeProjects: activeProjectsCount,
        pendingTasks: pendingTasksCount,
        activeClients: clientsCount,
        supportTickets: supportTicketsCount
      },
      activities: formattedActivities,
      deadlines: formattedDeadlines,
      projects: formattedProjects
    };

    await setCache("dashboard:summary", responseData, 3600);

    res.status(200).json({
      success: true,
      data: responseData
    });
  } catch (error) {
    console.error("Dashboard controller error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
