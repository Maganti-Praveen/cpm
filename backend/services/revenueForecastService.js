// Service class or helper functions for revenueForecast business logic.
// Contains operations for database queries, transformations, and system actions.

import prisma from "../config/prisma.js";
import {
  ForecastEngine,
  LinearRegressionStrategy
} from "./forecastEngine.js";

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

/**
 * Calculates historical revenue grouped by calendar month.
 * Automatically handles starting from the earliest transaction and filling any gaps.
 */
// Function to handle calculateRevenueHistory operations
export const calculateRevenueHistory = async () => {
  // Query successful transactions
  const transactions = await prisma.transaction.findMany({
    where: { status: "Success" },
    orderBy: { createdAt: "asc" }
  });

  let dataPoints = transactions;
  let dateField = "createdAt";

  // Fallback to Paid Invoices if no transactions are recorded
  if (dataPoints.length === 0) {
    dataPoints = await prisma.invoice.findMany({
      where: { status: "Paid" },
      orderBy: { paidAt: "asc" }
    });
    dateField = "paidAt";
  }

  if (dataPoints.length === 0) {
    return [];
  }

  // Get the earliest record date to start history tracking
  const firstPointDate = new Date(dataPoints[0][dateField]);
  const startYear = firstPointDate.getFullYear();
  const startMonth = firstPointDate.getMonth(); // 0-11

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const history = [];
  let tempDate = new Date(startYear, startMonth, 1);
  let index = 1;

  // Aggregate monthly amounts up to the current calendar month
  while (
    tempDate.getFullYear() < currentYear || 
    (tempDate.getFullYear() === currentYear && tempDate.getMonth() <= currentMonth)
  ) {
    const y = tempDate.getFullYear();
    const m = tempDate.getMonth();

    const pointsInMonth = dataPoints.filter((p) => {
      const pDate = new Date(p[dateField]);
      return pDate.getFullYear() === y && pDate.getMonth() === m;
    });

    const monthlyRevenue = pointsInMonth.reduce((sum, p) => sum + p.amount, 0);

    history.push({
      monthIndex: index,
      monthLabel: `${MONTH_NAMES[m]} ${y}`,
      year: y,
      monthNum: m,
      revenue: Math.round(monthlyRevenue),
      count: pointsInMonth.length
    });

    tempDate.setMonth(tempDate.getMonth() + 1);
    index++;
  }

  return history;
};

/**
 * Helper to determine strategy based on key.
 */
const getStrategyByKey = (method) => {
  return new LinearRegressionStrategy();
};

/**
 * Generate standard forecasts: 1 month, 3 months, 6 months, and 12 months ahead.
 */
// Function to handle getForecastForPeriods operations
export const getForecastForPeriods = async (method = "LR") => {
  const history = await calculateRevenueHistory();
  
  if (history.length === 0) {
    return {
      confidence: 0,
      nextMonth: 0,
      next3Months: { total: 0, breakdown: [] },
      next6Months: { total: 0, breakdown: [] },
      next12Months: { total: 0, breakdown: [] },
      rawForecast: [],
      method
    };
  }

  const strategy = getStrategyByKey(method);
  const engine = new ForecastEngine(strategy);
  
  // Run regression to predict next 12 months
  const maxSteps = 12;
  const { predictions, confidence } = engine.run(history, maxSteps);

  // Map predictions to their future month labels
  const lastMonth = history[history.length - 1];
  const lastYearVal = lastMonth.year;
  const lastMonthNumVal = lastMonth.monthNum;

  const rawForecast = predictions.map((predVal, idx) => {
    const offsetDate = new Date(lastYearVal, lastMonthNumVal + idx + 1, 15);
    return {
      monthIndex: lastMonth.monthIndex + idx + 1,
      monthLabel: `${MONTH_NAMES[offsetDate.getMonth()]} ${offsetDate.getFullYear()}`,
      year: offsetDate.getFullYear(),
      monthNum: offsetDate.getMonth(),
      revenue: predVal
    };
  });

  // Calculate segment totals
  const nextMonth = rawForecast[0]?.revenue || 0;

  const next3Breakdown = rawForecast.slice(0, 3);
  const next3Total = next3Breakdown.reduce((sum, item) => sum + item.revenue, 0);

  const next6Breakdown = rawForecast.slice(0, 6);
  const next6Total = next6Breakdown.reduce((sum, item) => sum + item.revenue, 0);

  const next12Breakdown = rawForecast;
  const next12Total = next12Breakdown.reduce((sum, item) => sum + item.revenue, 0);

  return {
    confidence,
    nextMonth,
    next3Months: { total: next3Total, breakdown: next3Breakdown },
    next6Months: { total: next6Total, breakdown: next6Breakdown },
    next12Months: { total: next12Total, breakdown: next12Breakdown },
    rawForecast,
    method
  };
};

/**
 * Generates custom forecast based on selected start and end dates
 */
// Function to handle forecastCustomRange operations
export const forecastCustomRange = async (startDateStr, endDateStr, method = "LR") => {
  const history = await calculateRevenueHistory();
  if (history.length === 0) {
    return {
      totalProjected: 0,
      breakdown: [],
      confidence: 0,
      method
    };
  }

  const start = new Date(startDateStr);
  const end = new Date(endDateStr);

  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
    throw new Error("Invalid date range provided");
  }

  const strategy = getStrategyByKey(method);
  const engine = new ForecastEngine(strategy);

  // Determine indices relative to history start
  const lastMonth = history[history.length - 1];
  const lastYearVal = lastMonth.year;
  const lastMonthNumVal = lastMonth.monthNum;

  // Let's predict up to the end month
  // Find total steps ahead between last history month and end month
  const totalMonthsDiff = (end.getFullYear() - lastYearVal) * 12 + (end.getMonth() - lastMonthNumVal);
  
  if (totalMonthsDiff <= 0) {
    const nextMonthName = MONTH_NAMES[(lastMonthNumVal + 1) % 12];
    const nextYearName = lastMonthNumVal + 1 > 11 ? lastYearVal + 1 : lastYearVal;
    throw new Error(`Custom forecast range must end on or after the first forecast month (${nextMonthName} ${nextYearName})`);
  }

  // Get regression values for all months up to the end date
  const { predictions, confidence } = engine.run(history, totalMonthsDiff);

  // Map predictions to their calendar months
  const allFuturePredictions = predictions.map((predVal, idx) => {
    const offsetDate = new Date(lastYearVal, lastMonthNumVal + idx + 1, 15);
    return {
      date: offsetDate,
      monthLabel: `${MONTH_NAMES[offsetDate.getMonth()]} ${offsetDate.getFullYear()}`,
      revenue: predVal
    };
  });

  // Filter those within the custom range [start, end]
  const startCompare = new Date(start.getFullYear(), start.getMonth(), 1);
  const endCompare = new Date(end.getFullYear(), end.getMonth(), 28);

  const customBreakdown = allFuturePredictions.filter((p) => {
    return p.date >= startCompare && p.date <= endCompare;
  });

  const totalProjected = customBreakdown.reduce((sum, item) => sum + item.revenue, 0);

  return {
    totalProjected,
    breakdown: customBreakdown.map((item) => ({
      monthLabel: item.monthLabel,
      revenue: item.revenue
    })),
    confidence,
    method
  };
};
