// Controller logic for managing analytics operations.
// Processes incoming requests, performs validation, and communicates with services.

import prisma from "../config/prisma.js";
import { getCache, setCache } from "../utils/cache.js";

// helper methods

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May",
  "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

// Function to handle groupByMonth operations
function groupByMonth(records, dateField = "createdAt") {
  const buckets = {};

  for (const rec of records) {
    const d = new Date(rec[dateField]);
    const sortKey = d.getFullYear() * 12 + d.getMonth();
    const label = MONTH_NAMES[d.getMonth()];

    if (!buckets[sortKey]) {
      buckets[sortKey] = { name: label, count: 0, _sort: sortKey };
    }
    buckets[sortKey].count++;
  }

  return Object.values(buckets)
    .sort((a, b) => a._sort - b._sort)
    .map(({ name, count }) => ({ name, count }));
}

// group invoices by month and sum revenue (in lakhs)
function revenueByMonth(invoices) {
  const buckets = {};

  for (const inv of invoices) {
    const d = new Date(inv.issueDate);
    const sortKey = d.getFullYear() * 12 + d.getMonth();
    const label = MONTH_NAMES[d.getMonth()];

    if (!buckets[sortKey]) {
      buckets[sortKey] = { name: label, revenue: 0, _sort: sortKey };
    }
    buckets[sortKey].revenue += inv.amount / 100000; // Convert to lakhs
  }

  return Object.values(buckets)
    .sort((a, b) => a._sort - b._sort)
    .map(({ name, revenue }) => ({ name, revenue: Math.round(revenue * 100) / 100 }));
}

// Function to handle computeTrend operations
function computeTrend(current, previous) {
  if (previous === 0 && current === 0) return "Steady";
  if (previous === 0) return `+${current}`;
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct > 0) return `+${pct}%`;
  if (pct < 0) return `${pct}%`;
  return "Steady";
}

// Function to handle trendType operations
function trendType(current, previous) {
  if (current > previous) return "up";
  if (current < previous) return "down";
  return "neutral";
}

// Function to handle safe operations
async function safe(promise, fallback) {
  try {
    return await promise;
  } catch {
    return fallback;
  }
}

// get analytics dashboard data
export const getAnalytics = async (req, res) => {
  try {
    const cachedData = await getCache("analytics:stats");
    if (cachedData) {
      return res.status(200).json({
        success: true,
        data: cachedData
      });
    }

    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisQuarterStart = new Date(
      now.getFullYear(),
      Math.floor(now.getMonth() / 3) * 3,
      1
    );
    const thisYearStart = new Date(now.getFullYear(), 0, 1);
    const lastYearStart = new Date(now.getFullYear() - 1, 0, 1);
    const lastYearEnd = new Date(now.getFullYear() - 1, 11, 31);
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    sixMonthsAgo.setDate(1);

    // run queries in parallel to get stats

    const [
      completedProjects,
      completedThisMonth,
      completedLastMonth,
      activeTasks,
      totalClients,
      newClientsQuarter,
      totalStaff,
      newStaffMonth,
      completedMilestones,
      milestonesThisMonth,
      milestonesLastMonth,
      totalDocuments,
      docsThisMonth,
      docsLastMonth,
      openTickets,
      openTicketsLastWeek,
      // Invoice stats
      revenueYTD,
      revenueLastYear,
    ] = await Promise.all([
      safe(prisma.project.count({ where: { status: "Completed" } }), 0),
      safe(prisma.project.count({
        where: { status: "Completed", updatedAt: { gte: thisMonthStart } },
      }), 0),
      safe(prisma.project.count({
        where: {
          status: "Completed",
          updatedAt: { gte: lastMonthStart, lt: thisMonthStart },
        },
      }), 0),

      safe(prisma.task.count({ where: { status: { notIn: ["Completed", "Done"] } } }), 0),

      safe(prisma.user.count({ where: { role: "CLIENT" } }), 0),
      safe(prisma.user.count({
        where: { role: "CLIENT", createdAt: { gte: thisQuarterStart } },
      }), 0),

      safe(prisma.user.count({ where: { role: "STAFF" } }), 0),
      safe(prisma.user.count({
        where: { role: "STAFF", createdAt: { gte: thisMonthStart } },
      }), 0),

      safe(prisma.milestone.count({ where: { status: "Completed" } }), 0),
      safe(prisma.milestone.count({
        where: { status: "Completed", updatedAt: { gte: thisMonthStart } },
      }), 0),
      safe(prisma.milestone.count({
        where: {
          status: "Completed",
          updatedAt: { gte: lastMonthStart, lt: thisMonthStart },
        },
      }), 0),

      safe(prisma.document.count(), 0),
      safe(prisma.document.count({ where: { createdAt: { gte: thisMonthStart } } }), 0),
      safe(prisma.document.count({
        where: { createdAt: { gte: lastMonthStart, lt: thisMonthStart } },
      }), 0),

      safe(prisma.ticket.count({ where: { status: "Open" } }), 0),
      safe(prisma.ticket.count({
        where: { status: "Open", createdAt: { gte: lastWeek } },
      }), 0),

      // Revenue: sum of paid invoices this year
      safe(prisma.invoice.aggregate({
        _sum: { amount: true },
        where: { status: "Paid", issueDate: { gte: thisYearStart } },
      }), { _sum: { amount: null } }),
      // Revenue: sum of paid invoices last year
      safe(prisma.invoice.aggregate({
        _sum: { amount: true },
        where: { status: "Paid", issueDate: { gte: lastYearStart, lte: lastYearEnd } },
      }), { _sum: { amount: null } }),
    ]);

    const revenueYTDAmount = revenueYTD._sum.amount || 0;
    const revenueLastYearAmount = revenueLastYear._sum.amount || 0;

    // fetch charts and detail statistics

    const [
      projectsByStatus,
      projectsRaw,

      activeClientCount,
      clientsRaw,

      staffByStatus,
      staffWithTasks,

      tasksByStatus,
      tasksByPriority,

      milestonesByStatus,
      milestonesRaw,

      docsRaw,

      ticketsByStatus,
      ticketsByCategory,

      // Invoice chart data
      invoicesByStatus,
      invoicesForRevenue,
    ] = await Promise.all([
      // Projects
      safe(prisma.project.groupBy({ by: ["status"], _count: { id: true } }), []),
      safe(prisma.project.findMany({
        where: { createdAt: { gte: sixMonthsAgo } },
        select: { createdAt: true },
      }), []),

      // Clients
      safe(prisma.user.count({
        where: {
          role: "CLIENT",
          clientProjects: {
            some: { status: { not: "Completed" } },
          },
        },
      }), 0),
      safe(prisma.user.findMany({
        where: { role: "CLIENT", createdAt: { gte: sixMonthsAgo } },
        select: { createdAt: true },
      }), []),

      // Staff — performance chart: all users who have tasks assigned
      safe(prisma.user.groupBy({
        by: ["status"],
        where: { role: "STAFF" },
        _count: { id: true },
      }), []),
      safe(prisma.user.findMany({
        where: {
          tasks: { some: {} },
        },
        select: {
          fullName: true,
          tasks: {
            where: { status: { in: ["Completed", "Done"] } },
            select: { id: true },
          },
        },
        take: 15,
      }), []),

      // Tasks
      safe(prisma.task.groupBy({ by: ["status"], _count: { id: true } }), []),
      safe(prisma.task.groupBy({ by: ["priority"], _count: { id: true } }), []),

      // Milestones
      safe(prisma.milestone.groupBy({ by: ["status"], _count: { id: true } }), []),
      safe(prisma.milestone.findMany({
        where: { status: "Completed", updatedAt: { gte: sixMonthsAgo } },
        select: { updatedAt: true },
      }), []),

      // Documents
      safe(prisma.document.findMany({
        where: { createdAt: { gte: sixMonthsAgo } },
        select: { createdAt: true },
      }), []),

      // Tickets
      safe(prisma.ticket.groupBy({ by: ["status"], _count: { id: true } }), []),
      safe(prisma.ticket.groupBy({ by: ["category"], _count: { id: true } }), []),

      // Invoices
      safe(prisma.invoice.groupBy({ by: ["status"], _count: { id: true }, _sum: { amount: true } }), []),
      safe(prisma.invoice.findMany({
        where: { issueDate: { gte: sixMonthsAgo } },
        select: { issueDate: true, amount: true },
      }), []),
    ]);

    // staff performance data
    const staffPerformance = staffWithTasks
      .map((s) => ({
        name: s.fullName.split(" ")[0],
        count: s.tasks.length,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // group documents by file extension / type
    let documentsByType = [];
    try {
      const allDocs = await prisma.document.findMany({
        select: { type: true, title: true },
      });
      const typeBuckets = {};
      for (const doc of allDocs) {
        let label = doc.type || "Other";
        // For FILE type, extract extension from title
        if (label === "FILE" && doc.title) {
          const ext = doc.title.split(".").pop()?.toUpperCase();
          if (ext && ext !== doc.title.toUpperCase()) {
            label = ext;
          }
        }
        // Capitalize LINK -> Link
        if (label === "LINK") label = "Link";
        typeBuckets[label] = (typeBuckets[label] || 0) + 1;
      }
      documentsByType = Object.entries(typeBuckets).map(([name, count]) => ({
        name,
        count,
      }));
    } catch {
      documentsByType = [];
    }

    // construct the final payload

    const inactiveClientCount = Math.max(0, totalClients - activeClientCount);

    // Format revenue for display
    const formatRevenue = (amount) => {
      if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
      if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
      return `₹${amount}`;
    };

    const responseData = {
        quickStats: {
          completedProjects,
          completedProjectsTrend: computeTrend(completedThisMonth, completedLastMonth),
          completedProjectsTrendType: trendType(completedThisMonth, completedLastMonth),

          activeTasks,
          activeTasksTrend: "Steady",
          activeTasksTrendType: "neutral",

          newClientsQuarter,
          totalClients,
          clientsTrendType: newClientsQuarter > 0 ? "up" : "neutral",

          totalStaff,
          newStaffMonth,
          staffTrendType: newStaffMonth > 0 ? "up" : "neutral",

          completedMilestones,
          milestonesTrend: computeTrend(milestonesThisMonth, milestonesLastMonth),
          milestonesTrendType: trendType(milestonesThisMonth, milestonesLastMonth),

          totalDocuments,
          documentsTrend: computeTrend(docsThisMonth, docsLastMonth),
          documentsTrendType: trendType(docsThisMonth, docsLastMonth),

          openTickets,
          ticketsTrend:
            openTicketsLastWeek > 0
              ? `+${openTicketsLastWeek}`
              : openTickets > 0
              ? `${openTickets} open`
              : "None",
          ticketsTrendType:
            openTicketsLastWeek > 0 ? "up" : openTickets === 0 ? "neutral" : "down",

          // Revenue
          revenueYTD: revenueYTDAmount,
          revenueFormatted: formatRevenue(revenueYTDAmount),
          revenueTrend: computeTrend(revenueYTDAmount, revenueLastYearAmount),
          revenueTrendType: trendType(revenueYTDAmount, revenueLastYearAmount),
        },

        projects: {
          byStatus: projectsByStatus.map((g) => ({
            name: g.status,
            count: g._count.id,
          })),
          byMonth: groupByMonth(projectsRaw),
        },

        clients: {
          distribution: [
            { name: "Active", count: activeClientCount },
            { name: "Inactive", count: inactiveClientCount },
          ],
          byMonth: groupByMonth(clientsRaw),
        },

        staff: {
          byStatus: staffByStatus.map((g) => ({
            name: g.status,
            count: g._count.id,
          })),
          performance: staffPerformance,
        },

        tasks: {
          byStatus: tasksByStatus.map((g) => ({
            name: g.status,
            count: g._count.id,
          })),
          byPriority: tasksByPriority.map((g) => ({
            name: g.priority,
            count: g._count.id,
          })),
        },

        milestones: {
          byStatus: milestonesByStatus.map((g) => ({
            name: g.status,
            count: g._count.id,
          })),
          byMonth: groupByMonth(milestonesRaw, "updatedAt"),
        },

        documents: {
          byType: documentsByType,
          byMonth: groupByMonth(docsRaw),
        },

        invoices: {
          byStatus: invoicesByStatus.map((g) => ({
            name: g.status,
            count: g._count.id,
            amount: g._sum?.amount || 0,
          })),
          revenueByMonth: revenueByMonth(invoicesForRevenue),
        },

        tickets: {
          byStatus: ticketsByStatus.map((g) => ({
            name: g.status,
            count: g._count.id,
          })),
          byCategory: ticketsByCategory.map((g) => ({
            name: g.category || "Uncategorised",
            count: g._count.id,
          })),
        },
      };

    await setCache("analytics:stats", responseData, 3600);

    res.status(200).json({
      success: true,
      data: responseData
    });
  } catch (error) {
    console.error("Analytics controller error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
