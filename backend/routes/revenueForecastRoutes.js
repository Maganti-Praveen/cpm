// Express routing definitions for revenueForecast endpoints.
// Maps HTTP methods and URL paths to their respective controller functions.

import express from "express";
import * as revenueForecastController from "../controllers/revenueForecastController.js";
import auth from "../middleware/auth.js";
import role from "../middleware/role.js";

import permission from "../middleware/permission.js";

const router = express.Router();

// Restrict all forecasting & analytics routes to ADMINs
router.use(auth, role("ADMIN"), permission("revenue_forecast"));

// Route to handle GET /overview requests
router.get("/overview", revenueForecastController.getOverview);
// Route to handle GET /trends requests
router.get("/trends", revenueForecastController.getRevenueTrend);
// Route to handle GET /forecast requests
router.get("/forecast", revenueForecastController.getForecast);
// Route to handle GET /forecast/custom requests
router.get("/forecast/custom", revenueForecastController.getCustomForecast);
// Route to handle GET /top-clients requests
router.get("/top-clients", revenueForecastController.getTopClients);
// Route to handle GET /sources requests
router.get("/sources", revenueForecastController.getRevenueSources);
// Route to handle GET /insights requests
router.get("/insights", revenueForecastController.getInsights);

export default router;
