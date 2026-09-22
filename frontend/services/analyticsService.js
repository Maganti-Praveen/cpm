// Fetches aggregated metrics and project status distributions for administrative charts.
// Provides dataset retrieval endpoints to populate the analytics dashboard view.


import API from "./api";

export const getAnalyticsStats = () => API.get("/analytics/stats");
