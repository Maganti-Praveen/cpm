// ============================================================
// cacheController.js — Redis Cache Management Controller
// ============================================================
// Exposes admin-only endpoints to inspect and toggle the Redis
// caching layer at runtime without restarting the server.
//
// Routes handled:
//   GET  /api/cache/status   → returns current Redis status
//   POST /api/cache/enable   → enables Redis caching
//   POST /api/cache/disable  → disables Redis caching
// ============================================================

import {
  getRedisStatus,
  enableRedis,
  disableRedis,
  flushRedisCache,
} from "../utils/cache.js";

/**
 * GET /api/cache/status
 *
 * Returns the live Redis connection and enabled state.
 * Used by the admin UI to show a live status badge.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
export const getCacheStatus = async (req, res) => {
  try {
    // Pull live status from the cache module's internal state
    const status = getRedisStatus();

    return res.json({
      success: true,
      data: {
        connected: status.connected, // true if socket is open and authenticated
        enabled: status.enabled,     // true if the admin hasn't disabled it
      },
    });
  } catch (err) {
    console.error("Error fetching Redis status:", err.message);
    return res.status(500).json({ success: false, message: "Failed to get cache status" });
  }
};

/**
 * POST /api/cache/enable
 *
 * Enables the Redis caching layer.
 * If the client was previously disconnected a fresh connection is initiated.
 * Idempotent — safe to call when already enabled.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
export const enableCaching = async (req, res) => {
  try {
    // Delegate to the cache module which manages the client lifecycle
    const result = await enableRedis();

    return res.json({
      success: true,
      message: result.message,
      data: getRedisStatus(), // return updated status after toggle
    });
  } catch (err) {
    console.error("Error enabling Redis:", err.message);
    return res.status(500).json({ success: false, message: "Failed to enable Redis cache" });
  }
};

/**
 * POST /api/cache/disable
 *
 * Disables the Redis caching layer and gracefully closes the connection.
 * All cache functions become instant no-ops until re-enabled.
 * Idempotent — safe to call when already disabled.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
export const disableCaching = async (req, res) => {
  try {
    const result = await disableRedis();
    return res.json({
      success: true,
      message: result.message,
      data: getRedisStatus(),
    });
  } catch (err) {
    console.error("Error disabling Redis:", err.message);
    return res.status(500).json({ success: false, message: "Failed to disable Redis cache" });
  }
};

/**
 * DELETE /api/cache/flush
 *
 * Flushes ALL keys from the Redis database immediately.
 * The app continues working — data is re-fetched and re-cached on next request.
 */
export const flushCache = async (req, res) => {
  try {
    const result = await flushRedisCache();
    return res.json({
      success: true,
      message: result.message,
    });
  } catch (err) {
    console.error("Error flushing Redis cache:", err.message);
    return res.status(500).json({ success: false, message: "Failed to flush cache" });
  }
};

/**
 * PUT /api/cache/url
 *
 * Updates the REDIS_URL environment variable dynamically.
 * Note: A server restart is required to apply the new URL globally.
 *
 * @param {import('express').Request}  req - Express request object.
 * @param {Object} req.body - Request body.
 * @param {string} req.body.redisUrl - The new Redis connection URL.
 * @param {import('express').Response} res - Express response object.
 * @returns {Promise<void>}
 */
export const updateRedisUrl = async (req, res) => {
  try {
    const { redisUrl } = req.body;
    if (!redisUrl || typeof redisUrl !== "string" || !redisUrl.trim()) {
      return res.status(400).json({ success: false, message: "Valid Redis URL is required" });
    }
    process.env.REDIS_URL = redisUrl.trim();
    return res.json({
      success: true,
      message: "Redis URL updated successfully. Restart server to apply changes.",
    });
  } catch (err) {
    console.error("Error updating Redis URL:", err.message);
    return res.status(500).json({ success: false, message: "Failed to update Redis URL" });
  }
};
