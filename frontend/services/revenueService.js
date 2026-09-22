// Coordinates financial caching and database requests for predictive revenue calculations.
// Power cash flow predictions, trends breakdowns, and project value indicators.

import API from "./api";

export const getRevenueOverview = (method) => 
  API.get(`/revenue/overview${method ? `?method=${method}` : ""}`);

export const getRevenueTrends = () => API.get("/revenue/trends");

export const getRevenueForecast = (method) => 
  API.get(`/revenue/forecast${method ? `?method=${method}` : ""}`);

export const getCustomForecast = (startDate, endDate, method) => 
  API.get(`/revenue/forecast/custom?startDate=${startDate}&endDate=${endDate}${method ? `&method=${method}` : ""}`);

export const getTopClients = () => API.get("/revenue/top-clients");

export const getRevenueSources = () => API.get("/revenue/sources");

export const getInsights = () => API.get("/revenue/insights");
