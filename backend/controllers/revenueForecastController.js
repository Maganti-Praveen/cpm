// Controller logic for managing revenueForecast operations.
// Processes incoming requests, performs validation, and communicates with services.

import prisma from "../config/prisma.js";
import { getCache, setCache } from "../utils/cache.js";
import {
  calculateRevenueHistory,
  getForecastForPeriods,
  forecastCustomRange
} from "../services/revenueForecastService.js";
import {
  getTopPayingClientsData,
  getRevenueSourcesData,
  generateRevenueInsights
} from "../services/revenueInsightsService.js";

/**
 * GET /api/revenue/overview
 */
// Function to handle getOverview operations
export const getOverview = async (req, res) => {
  try {
    const method = req.query.method || "WMA";
    const cacheKey = `revenue:overview:${method}`;
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      return res.status(200).json({
        success: true,
        data: cachedData
      });
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const startOfCurrentMonth = new Date(currentYear, currentMonth, 1);
    
    // Previous Month Dates
    const startOfPrevMonth = new Date(currentYear, currentMonth - 1, 1);
    const endOfPrevMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59);

    // Run basic KPI queries in parallel
    const [
      totalRevenueAgg,
      currentMonthAgg,
      prevMonthAgg,
      pendingRevenueAgg,
      allInvoicesAgg,
      forecastData,
      successTransactionsCount,
      history
    ] = await Promise.all([
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { status: "Success" }
      }),
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: {
          status: "Success",
          createdAt: { gte: startOfCurrentMonth }
        }
      }),
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: {
          status: "Success",
          createdAt: { gte: startOfPrevMonth, lte: endOfPrevMonth }
        }
      }),
      prisma.invoice.aggregate({
        _sum: { amount: true },
        where: {
          status: "Unpaid"
        }
      }),
      prisma.invoice.aggregate({
        _avg: { amount: true },
        _count: { id: true },
        _sum: { amount: true }
      }),
      getForecastForPeriods(req.query.method || "WMA"),
      prisma.transaction.count({
        where: { status: "Success" }
      }),
      calculateRevenueHistory()
    ]);

    const totalRevenue = totalRevenueAgg._sum.amount || 0;
    const thisMonthRevenue = currentMonthAgg._sum.amount || 0;
    const prevMonthRevenue = prevMonthAgg._sum.amount || 0;
    const pendingInvoices = pendingRevenueAgg._sum.amount || 0;
    const averageInvoiceValue = allInvoicesAgg._avg.amount || 0;
    const totalInvoiced = allInvoicesAgg._sum.amount || 0;

    // MoM Growth Rate
    let growthRate = 0;
    if (prevMonthRevenue > 0) {
      growthRate = Math.round(((thisMonthRevenue - prevMonthRevenue) / prevMonthRevenue) * 1000) / 10;
    } else if (thisMonthRevenue > 0) {
      growthRate = 100;
    }

    const trainingPeriod = history.length > 0
      ? `${history[0].monthLabel} – ${history[history.length - 1].monthLabel}`
      : "N/A";

    const responseData = {
        totalRevenue: Math.round(totalRevenue),
        totalInvoiced: Math.round(totalInvoiced),
        thisMonthRevenue: Math.round(thisMonthRevenue),
        prevMonthRevenue: Math.round(prevMonthRevenue),
        growthRate,
        pendingInvoices: Math.round(pendingInvoices),
        forecastAccuracy: forecastData.confidence,
        averageInvoiceValue: Math.round(averageInvoiceValue),
        invoicesCount: allInvoicesAgg._count.id || 0,
        transactionsCount: successTransactionsCount || 0,
        trainingPeriod
      };

    await setCache(cacheKey, responseData, 3600);

    res.status(200).json({
      success: true,
      data: responseData
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/revenue/trends
 */
// Function to handle getRevenueTrend operations
export const getRevenueTrend = async (req, res) => {
  try {
    const cacheKey = "revenue:trends";
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      return res.status(200).json({
        success: true,
        data: cachedData
      });
    }

    const history = await calculateRevenueHistory();
    
    // Map with additional metrics
    const trends = history.map((item, idx) => {
      let growthPct = 0;
      if (idx > 0 && history[idx - 1].revenue > 0) {
        growthPct = Math.round(((item.revenue - history[idx - 1].revenue) / history[idx - 1].revenue) * 1000) / 10;
      }
      return {
        ...item,
        growthPct
      };
    });

    await setCache(cacheKey, trends, 3600);

    res.status(200).json({
      success: true,
      data: trends
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/revenue/forecast
 */
// Function to handle getForecast operations
export const getForecast = async (req, res) => {
  try {
    const { method } = req.query;
    const cacheKey = `revenue:forecast:${method || "WMA"}`;
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      return res.status(200).json({
        success: true,
        data: cachedData
      });
    }

    const forecast = await getForecastForPeriods(method || "WMA");
    await setCache(cacheKey, forecast, 3600);

    res.status(200).json({
      success: true,
      data: forecast
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/revenue/forecast/custom
 */
// Function to handle getCustomForecast operations
export const getCustomForecast = async (req, res) => {
  try {
    const { startDate, endDate, method } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, message: "startDate and endDate parameters are required" });
    }

    const cacheKey = `revenue:forecast:custom:${startDate}:${endDate}:${method || "WMA"}`;
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      return res.status(200).json({
        success: true,
        data: cachedData
      });
    }

    const forecast = await forecastCustomRange(startDate, endDate, method || "WMA");
    await setCache(cacheKey, forecast, 3600);

    res.status(200).json({
      success: true,
      data: forecast
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/revenue/top-clients
 */
// Function to handle getTopClients operations
export const getTopClients = async (req, res) => {
  try {
    const cacheKey = "revenue:top-clients";
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      return res.status(200).json({
        success: true,
        data: cachedData
      });
    }

    const clients = await getTopPayingClientsData();
    await setCache(cacheKey, clients, 3600);

    res.status(200).json({
      success: true,
      data: clients
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/revenue/sources
 */
// Function to handle getRevenueSources operations
export const getRevenueSources = async (req, res) => {
  try {
    const cacheKey = "revenue:sources";
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      return res.status(200).json({
        success: true,
        data: cachedData
      });
    }

    const sources = await getRevenueSourcesData();
    await setCache(cacheKey, sources, 3600);

    res.status(200).json({
      success: true,
      data: sources
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/revenue/insights
 */
// Function to handle getInsights operations
export const getInsights = async (req, res) => {
  try {
    const cacheKey = "revenue:insights";
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      return res.status(200).json({
        success: true,
        data: cachedData
      });
    }

    const insights = await generateRevenueInsights();
    await setCache(cacheKey, insights, 3600);

    res.status(200).json({
      success: true,
      data: insights
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
