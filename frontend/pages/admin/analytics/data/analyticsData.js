// Supplies mock entries to test charts when database connections are offline.
// Models sample datasets.

const STATUS_COLORS = {
  // Color mapping definitions for status tags and visualizations
  // Projects & general
  Completed: "#4F46E5",
  "In Progress": "#06B6D4",
  "On Hold": "#F59E0B",
  Planning: "#CBD5E1",
  Cancelled: "#F43F5E",
  // Tasks
  "To Do": "#CBD5E1",
  Done: "#10B981",
  Review: "#F59E0B",
  // Tickets
  Open: "#3B82F6",
  Resolved: "#10B981",
  Closed: "#94A3B8",
  // Clients / Staff
  Active: "#10B981",
  Inactive: "#CBD5E1",
  New: "#06B6D4",
  // Invoices
  Paid: "#10B981",
  Unpaid: "#F43F5E",
  Overdue: "#DC2626",
  "Partially Paid": "#F59E0B",
};

const PRIORITY_COLORS = {
  Low: "#10B981",
  Medium: "#3B82F6",
  High: "#F59E0B",
  Urgent: "#F43F5E",
};

const DOC_TYPE_COLORS = {
  Link: "#6366F1",
  FILE: "#64748B",
  PDF: "#F43F5E",
  DOCX: "#3B82F6",
  DOC: "#2563EB",
  XLSX: "#10B981",
  XLS: "#059669",
  CSV: "#14B8A6",
  PNG: "#F59E0B",
  JPG: "#EA580C",
  JPEG: "#D97706",
  SVG: "#8B5CF6",
  ZIP: "#64748B",
  RAR: "#475569",
  TXT: "#06B6D4",
  PPT: "#EC4899",
  PPTX: "#DB2777",
  MP4: "#7C3AED",
  Other: "#94A3B8",
};

const FALLBACK_COLOR = "#94A3B8";

function pickColor(name, registry) {
  return registry[name] || FALLBACK_COLOR;
}

// quick stats presentation configurations

const STAT_CARD_META = [
  {
    key: "completedProjects",
    title: "PROJECTS COMPLETED",
    iconName: "CircleCheckBig",
    iconBg: "#ECFDF5",
    iconColor: "#059669",
    trendLabel: "vs last month",
  },
  {
    key: "activeTasks",
    title: "ACTIVE TASKS",
    iconName: "SlidersHorizontal",
    iconBg: "#EFF6FF",
    iconColor: "#2563EB",
    trendLabel: "vs last week",
  },
  {
    key: "newClients",
    title: "NEW CLIENTS",
    iconName: "UsersRound",
    iconBg: "#ECFDF5",
    iconColor: "#059669",
    trendLabel: "this quarter",
  },
  {
    key: "revenue",
    title: "REVENUE (YTD)",
    iconName: "Wallet",
    iconBg: "#F5F3FF",
    iconColor: "#7C3AED",
    trendLabel: "vs last year",
  },
  {
    key: "teamMembers",
    title: "TEAM MEMBERS",
    iconName: "UserCheck",
    iconBg: "#EFF6FF",
    iconColor: "#2563EB",
    trendLabel: "this month",
  },
  {
    key: "milestones",
    title: "MILESTONES HIT",
    iconName: "Target",
    iconBg: "#ECFDF5",
    iconColor: "#059669",
    trendLabel: "vs last month",
  },
  {
    key: "documents",
    title: "DOCUMENTS",
    iconName: "FolderOpen",
    iconBg: "#FFF7ED",
    iconColor: "#EA580C",
    trendLabel: "vs last month",
  },
  {
    key: "tickets",
    title: "OPEN TICKETS",
    iconName: "Headphones",
    iconBg: "#FFF1F2",
    iconColor: "#E11D48",
    trendLabel: "vs last week",
  },
];

// tab definitions

export const analyticsTabs = [
  "Overview",
  "Projects",
  "Revenue",
  "Team",
  "Clients",
];

// map api values to quick stat card objects

export function buildQuickStats(api) {
  const q = api.quickStats;

  const values = [
    {
      value: String(q.completedProjects),
      trend: q.completedProjectsTrend,
      trendType: q.completedProjectsTrendType,
    },
    {
      value: String(q.activeTasks),
      trend: q.activeTasksTrend,
      trendType: q.activeTasksTrendType,
    },
    {
      value: String(q.newClientsQuarter),
      trend: `+${q.newClientsQuarter}`,
      trendType: q.clientsTrendType,
    },
    {
      value: q.revenueFormatted || "₹0",
      trend: q.revenueTrend || "N/A",
      trendType: q.revenueTrendType || "neutral",
    },
    {
      value: String(q.totalStaff),
      trend: q.newStaffMonth > 0 ? `+${q.newStaffMonth}` : "Steady",
      trendType: q.staffTrendType,
    },
    {
      value: String(q.completedMilestones),
      trend: q.milestonesTrend,
      trendType: q.milestonesTrendType,
    },
    {
      value: String(q.totalDocuments),
      trend: q.documentsTrend,
      trendType: q.documentsTrendType,
    },
    {
      value: String(q.openTickets),
      trend: q.ticketsTrend,
      trendType: q.ticketsTrendType,
    },
  ];

  return STAT_CARD_META.map((meta, i) => ({
    id: i + 1,
    title: meta.title,
    iconName: meta.iconName,
    iconBg: meta.iconBg,
    iconColor: meta.iconColor,
    trendLabel: meta.trendLabel,
    ...values[i],
  }));
}

// map api values to chart sections

export function buildSections(api) {
  return [
    // projects analytics section
    {
      id: "projects",
      title: "Projects Analytics",
      iconName: "Briefcase",
      tabs: ["Overview", "Projects"],
      pieChart: {
        title: "Projects by Status",
        data: api.projects.byStatus.map((d) => ({
          name: d.name,
          value: d.count,
          color: pickColor(d.name, STATUS_COLORS),
        })),
      },
      barChart: {
        title: "Projects Created by Month",
        data: api.projects.byMonth,
        dataKey: "count",
        xKey: "name",
        color: "#4F46E5",
      },
    },

    // client analytics section
    {
      id: "clients",
      title: "Clients Analytics",
      iconName: "Users",
      tabs: ["Overview", "Clients"],
      pieChart: {
        title: "Client Activity Distribution",
        data: api.clients.distribution.map((d) => ({
          name: d.name,
          value: d.count,
          color: pickColor(d.name, STATUS_COLORS),
        })),
      },
      barChart: {
        title: "New Clients by Month",
        data: api.clients.byMonth,
        dataKey: "count",
        xKey: "name",
        color: "#10B981",
      },
    },

    // staff analytics section
    {
      id: "staff",
      title: "Staff Analytics",
      iconName: "UserCheck",
      tabs: ["Overview", "Team"],
      pieChart: {
        title: "Staff by Status",
        data: api.staff.byStatus.map((d) => ({
          name: d.name,
          value: d.count,
          color: pickColor(d.name, STATUS_COLORS),
        })),
      },
      barChart: {
        title: "Staff Performance (Tasks Completed)",
        data: api.staff.performance,
        dataKey: "count",
        xKey: "name",
        color: "#8B5CF6",
      },
    },

    // task analytics section
    {
      id: "tasks",
      title: "Tasks Analytics",
      iconName: "CheckSquare",
      tabs: ["Overview", "Projects"],
      pieChart: {
        title: "Tasks by Status",
        data: api.tasks.byStatus.map((d) => ({
          name: d.name,
          value: d.count,
          color: pickColor(d.name, STATUS_COLORS),
        })),
      },
      barChart: {
        title: "Tasks by Priority",
        data: api.tasks.byPriority.map((d) => ({
          name: d.name,
          count: d.count,
        })),
        dataKey: "count",
        xKey: "name",
        color: "#06B6D4",
      },
    },

    // milestones analytics section
    {
      id: "milestones",
      title: "Milestones Analytics",
      iconName: "Flag",
      tabs: ["Overview", "Projects"],
      pieChart: {
        title: "Milestones by Status",
        data: api.milestones.byStatus.map((d) => ({
          name: d.name,
          value: d.count,
          color: pickColor(d.name, STATUS_COLORS),
        })),
      },
      barChart: {
        title: "Milestones Completed by Month",
        data: api.milestones.byMonth,
        dataKey: "count",
        xKey: "name",
        color: "#10B981",
      },
    },

    // documents analytics section
    {
      id: "documents",
      title: "Documents Analytics",
      iconName: "FolderOpen",
      tabs: ["Overview"],
      pieChart: {
        title: "Documents by Type",
        data: api.documents.byType.map((d) => ({
          name: d.name,
          value: d.count,
          color: pickColor(d.name, DOC_TYPE_COLORS),
        })),
      },
      barChart: {
        title: "Documents Uploaded per Month",
        data: api.documents.byMonth,
        dataKey: "count",
        xKey: "name",
        color: "#F59E0B",
      },
    },

    // invoices analytics section
    {
      id: "invoices",
      title: "Invoice Analytics",
      iconName: "Receipt",
      tabs: ["Overview", "Revenue"],
      pieChart: {
        title: "Invoice Status",
        data: api.invoices.byStatus.map((d) => ({
          name: d.name,
          value: d.count,
          amount: d.amount,
          color: pickColor(d.name, STATUS_COLORS),
        })),
      },
      barChart: {
        title: "Revenue by Month (₹ Lakhs)",
        data: api.invoices.revenueByMonth,
        dataKey: "revenue",
        xKey: "name",
        color: "#4F46E5",
        badge: "This Year",
      },
    },

    // tickets analytics section
    {
      id: "support",
      title: "Support Analytics",
      iconName: "Headphones",
      tabs: ["Overview"],
      pieChart: {
        title: "Tickets by Status",
        data: api.tickets.byStatus.map((d) => ({
          name: d.name,
          value: d.count,
          color: pickColor(d.name, STATUS_COLORS),
        })),
      },
      barChart: {
        title: "Tickets by Category",
        data: api.tickets.byCategory,
        dataKey: "count",
        xKey: "name",
        color: "#F43F5E",
      },
    },
  ];
}
