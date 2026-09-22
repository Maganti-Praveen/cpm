// Service class or helper functions for revenueInsights business logic.
// Contains operations for database queries, transformations, and system actions.

import prisma from "../config/prisma.js";
import { calculateRevenueHistory, getForecastForPeriods } from "./revenueForecastService.js";

/**
 * Collects and aggregates top paying clients.
 */
// Function to handle getTopPayingClientsData operations
export const getTopPayingClientsData = async () => {
  const transactions = await prisma.transaction.findMany({
    where: { status: "Success" },
    include: {
      client: {
        select: {
          fullName: true,
          email: true,
          company: true
        }
      }
    }
  });

  const clientMap = {};
  for (const txn of transactions) {
    const clientId = txn.clientId;
    if (!clientMap[clientId]) {
      clientMap[clientId] = {
        id: clientId,
        clientName: txn.client?.fullName || "Unknown Client",
        company: txn.client?.company || "N/A",
        revenue: 0,
        invoiceCount: new Set(),
        lastPayment: txn.createdAt
      };
    }
    clientMap[clientId].revenue += txn.amount;
    clientMap[clientId].invoiceCount.add(txn.invoiceId);
    if (new Date(txn.createdAt) > new Date(clientMap[clientId].lastPayment)) {
      clientMap[clientId].lastPayment = txn.createdAt;
    }
  }

  return Object.values(clientMap)
    .sort((a, b) => b.revenue - a.revenue)
    .map((c) => ({
      id: c.id,
      clientName: c.clientName,
      company: c.company,
      revenue: Math.round(c.revenue),
      invoices: c.invoiceCount.size,
      lastPayment: c.lastPayment
    }));
};

/**
 * Breaks down revenue across categories based on invoice status.
 */
// Function to handle getRevenueSourcesData operations
export const getRevenueSourcesData = async () => {
  const invoices = await prisma.invoice.findMany({
    where: {
      status: { in: ["Paid", "Unpaid", "Cancelled"] }
    }
  });
  const now = new Date();

  const categories = {
    "Paid Invoices": 0,
    "Pending Invoices": 0,
    "Overdue Invoices": 0,
    "Cancelled Invoices": 0
  };

  let totalAmount = 0;
  for (const inv of invoices) {
    if (inv.status === "Paid") {
      categories["Paid Invoices"] += inv.amount;
      totalAmount += inv.amount;
    } else if (inv.status === "Cancelled") {
      categories["Cancelled Invoices"] += inv.amount;
      totalAmount += inv.amount;
    } else if (inv.status === "Unpaid") {
      const isOverdue = new Date(inv.dueDate) < now;
      if (isOverdue) {
        categories["Overdue Invoices"] += inv.amount;
      } else {
        categories["Pending Invoices"] += inv.amount;
      }
      totalAmount += inv.amount;
    }
  }

  const colors = {
    "Paid Invoices": "#10B981",       // emerald
    "Pending Invoices": "#F59E0B",    // amber
    "Overdue Invoices": "#EF4444",    // red
    "Cancelled Invoices": "#64748B"   // slate
  };

  return Object.entries(categories).map(([name, amount]) => ({
    name,
    amount: Math.round(amount),
    percentage: totalAmount > 0 ? Math.round((amount / totalAmount) * 100) : 0,
    color: colors[name] || "#CBD5E1"
  })).sort((a, b) => b.amount - a.amount);
};

/**
 * Generates automated business observations from database records.
 */
// Function to handle generateRevenueInsights operations
export const generateRevenueInsights = async () => {
  const history = await calculateRevenueHistory();
  const topClients = await getTopPayingClientsData();
  const sources = await getRevenueSourcesData();
  const forecasts = await getForecastForPeriods();

  const insights = [];

  if (history.length === 0) {
    return ["No transaction records available to compute business insights."];
  }

  // Insight 1: General historical growth rate
  const totalRevenue = history.reduce((sum, item) => sum + item.revenue, 0);
  const avgMonthlyRev = Math.round(totalRevenue / history.length);
  insights.push(`Average monthly revenue earned is ₹${avgMonthlyRev.toLocaleString()}.`);

  // Insight 2: Recent performance (MoM)
  if (history.length >= 2) {
    const curMonth = history[history.length - 1];
    const prevMonth = history[history.length - 2];
    if (prevMonth.revenue > 0) {
      const momGrowth = ((curMonth.revenue - prevMonth.revenue) / prevMonth.revenue) * 100;
      const direction = momGrowth > 0 ? "increased" : "decreased";
      insights.push(`Revenue ${direction} by ${Math.abs(momGrowth).toFixed(1)}% compared to the previous month.`);
    }
  }

  // Insight 3: Top Client concentration risk
  if (topClients.length > 0) {
    const topClient = topClients[0];
    const topClientPct = totalRevenue > 0 ? ((topClient.revenue / totalRevenue) * 100).toFixed(1) : "0";
    
    const formatINRValue = (val) => {
      if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)}Cr`;
      if (val >= 100000) return `₹${(val / 100000).toFixed(2)}L`;
      if (val >= 1000) return `₹${(val / 1000).toFixed(1)}K`;
      return `₹${val.toLocaleString()}`;
    };

    insights.push(`Top paying client ${topClient.clientName} generated ${formatINRValue(topClient.revenue)} revenue and contributed ${topClientPct}% of total revenue.`);
  }

  // Insight 4: Major revenue status analysis
  const paidSource = sources.find(s => s.name === "Paid Invoices");
  if (paidSource && paidSource.amount > 0) {
    insights.push(`Completed payments represent ${paidSource.percentage}% of all issued billing amounts.`);
  }

  const overdueSource = sources.find(s => s.name === "Overdue Invoices");
  if (overdueSource && overdueSource.amount > 0 && overdueSource.percentage > 10) {
    insights.push(`Overdue payments represent ${overdueSource.percentage}% of total billing. Consider setting up manual/automatic payment reminders.`);
  }

  // Insight 5: Expected upcoming quarterly performance
  if (forecasts && forecasts.next3Months && forecasts.next3Months.total > 0) {
    insights.push(`Expected projected revenue for the next quarter is ₹${forecasts.next3Months.total.toLocaleString()}.`);
  }

  // Insight 6: Seasonal earning patterns
  const highestMonth = [...history].sort((a, b) => b.revenue - a.revenue)[0];
  if (highestMonth && highestMonth.revenue > 0) {
    insights.push(`Your highest-earning historical month was ${highestMonth.monthLabel} with ₹${highestMonth.revenue.toLocaleString()}.`);
  }

  return insights;
};
