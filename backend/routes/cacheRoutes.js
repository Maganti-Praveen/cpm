// ============================================================
// cacheRoutes.js — Redis Cache Management Routes
// ============================================================
// All routes require authentication and admin role.
//
//   GET    /api/cache/status   → live Redis connection status
//   POST   /api/cache/enable   → enable Redis caching
//   POST   /api/cache/disable  → disable Redis caching
//   DELETE /api/cache/flush    → flush all Redis keys
// ============================================================

import { Router } from "express";
import auth from "../middleware/auth.js";
import role from "../middleware/role.js";
import {
  getCacheStatus,
  enableCaching,
  disableCaching,
  flushCache,
  updateRedisUrl,
} from "../controllers/cacheController.js";

import permission from "../middleware/permission.js";

const router = Router();

/**
 * @route GET /api/cache/status
 * Retrieves connection and toggled state of the Redis cache.
 * Requires ADMIN role and settings_redis permission.
 */
router.get("/status", auth, role("ADMIN"), permission("settings_redis"), getCacheStatus);

/**
 * @route POST /api/cache/enable
 * Enables Redis caching at application level.
 * Requires ADMIN role and settings_redis permission.
 */
router.post("/enable", auth, role("ADMIN"), permission("settings_redis"), enableCaching);

/**
 * @route POST /api/cache/disable
 * Disables Redis caching at application level.
 * Requires ADMIN role and settings_redis permission.
 */
router.post("/disable", auth, role("ADMIN"), permission("settings_redis"), disableCaching);

/**
 * @route PUT /api/cache/url
 * Updates dynamically configured Redis database URL.
 * Requires ADMIN role and settings_redis permission.
 */
router.put("/url", auth, role("ADMIN"), permission("settings_redis"), updateRedisUrl);

/**
 * @route DELETE /api/cache/flush
 * Flushes all cached data from the Redis database.
 * Accessible to ADMIN, STAFF, and CLIENT roles.
 */
router.delete("/flush", auth, role("ADMIN", "STAFF", "CLIENT"), flushCache);

export default router;
