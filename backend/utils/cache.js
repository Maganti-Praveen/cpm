// This file configures and manages the Redis client cache for the application.
// It provides helper functions to get, set, delete, and invalidate cache patterns.
import { createClient } from "redis";
import "dotenv/config";

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
let client = null;
let isRedisConnected = false;
let isRedisEnabled = process.env.REDIS_ENABLED?.toLowerCase() !== "false";

// Initializes the Redis client with configuration options including reconnect strategy and TLS settings.
const initRedisClient = () => {
  try {
    const isTLS = redisUrl.startsWith("rediss://");
    // Calls createClient from the redis package to define the client configuration.
    client = createClient({
      url: redisUrl,
      RESP: 2,
      socket: {
        tls: isTLS,
        reconnectStrategy: (retries) => {
          if (retries > 20) {
            console.warn("Redis: max reconnect attempts reached. Caching disabled.");
            return false;
          }
          return Math.min(retries * 3000, 20000);
        },
      },
    });

    // Registers an event listener to handle Redis client error events.
    client.on("error", (err) => {
      const isRefused = err.code === "ECONNREFUSED" || err.message?.includes("ECONNREFUSED");
      if (isRefused) {
        if (!client.hasWarnedRefused) {
          console.warn("Redis connection refused. Caching disabled.");
          client.hasWarnedRefused = true;
        }
      } else {
        console.error("Redis Connection Error:", err.message || err);
      }
      isRedisConnected = false;
    });

    // Registers an event listener to handle the successful connection event.
    client.on("connect", () => {
      console.log("Redis Client Connected");
      isRedisConnected = true;
      client.hasWarnedRefused = false;
    });

    // Registers an event listener to handle the connection close event.
    client.on("end", () => {
      console.log("Redis Client Connection Closed");
      isRedisConnected = false;
    });

    // Initiates the connection to the Redis server.
    client.connect().catch((err) => {
      const isRefused = err.code === "ECONNREFUSED" || err.message?.includes("ECONNREFUSED");
      if (!isRefused) {
        console.warn(`Redis connection failed: ${err.message || err}`);
      }
      isRedisConnected = false;
    });
  } catch (err) {
    console.error("Failed to initialize Redis client:", err.message);
    isRedisConnected = false;
  }
};

// Initializes the Redis client automatically if caching is enabled in the environment configuration.
if (isRedisEnabled) initRedisClient();

/**
 * Gets the current connection and configuration status of the Redis client.
 * 
 * @returns {{connected: boolean, enabled: boolean, envDefault: boolean}} Cache status descriptor.
 */
export const getRedisStatus = () => ({
  connected: isRedisConnected,
  enabled: isRedisEnabled,
  envDefault: process.env.REDIS_ENABLED?.toLowerCase() !== "false",
});

/**
 * Enables Redis caching and attempts to establish a connection if not already open.
 * 
 * @returns {Promise<{success: boolean, message: string}>} Enable operation status.
 */
export const enableRedis = async () => {
  if (isRedisEnabled && isRedisConnected) {
    return { success: true, message: "Redis already enabled and connected" };
  }
  isRedisEnabled = true;
  if (!client || !client.isOpen) {
    // Calls initRedisClient to boot the Redis connection when enabling caching.
    initRedisClient();
  }
  return { success: true, message: "Redis cache enabled successfully" };
};

/**
 * Disables Redis caching and gracefully shuts down or disconnects the client.
 * 
 * @returns {Promise<{success: boolean, message: string}>} Disable operation status.
 */
export const disableRedis = async () => {
  if (!isRedisEnabled) {
    return { success: true, message: "Redis already disabled" };
  }
  isRedisEnabled = false;
  isRedisConnected = false;
  if (client) {
    try {
      // Attempts a graceful shutdown of the Redis client.
      await client.quit();
    } catch {
      try {
        // Forcefully disconnects the Redis client if a graceful shutdown fails.
        await client.disconnect();
      } catch {}
    }
    client = null;
  }
  return { success: true, message: "Redis cache disabled successfully" };
};

/**
 * Clears all cached keys from the active Redis database.
 * 
 * @throws {Error} If Redis is not connected.
 * @returns {Promise<{success: boolean, message: string}>} Flush operation status.
 */
export const flushRedisCache = async () => {
  if (!isRedisEnabled || !isRedisConnected || !client) {
    return { success: false, message: "Redis is not connected" };
  }
  try {
    // Calls the Redis API to flush the current database.
    await client.flushDb();
    return { success: true, message: "All cache cleared successfully" };
  } catch (err) {
    console.error("Error flushing Redis cache:", err.message);
    throw err;
  }
};

/**
 * Retrieves and deserializes a JSON value stored under the specified cache key.
 * 
 * @param {string} key - Cache key.
 * @returns {Promise<any|null>} Deserialized cached data or null on miss or error.
 */
export const getCache = async (key) => {
  if (!isRedisEnabled || !isRedisConnected || !client) {
    console.log("Redis is disabled, fetching data from postgreSQL");
    return null;
  }
  try {
    // Calls the Redis API to retrieve the value stored under the key.
    const val = await client.get(key);
    if (val) {
      console.log(`[CACHE HIT] ${key}`);
      return JSON.parse(val);
    }
    console.log(`[CACHE MISS] ${key}`);
    return null;
  } catch (err) {
    console.error(`Error reading cache key "${key}":`, err.message);
    return null;
  }
};

/**
 * Serializes and stores a value in the cache with a specified expiration time.
 * 
 * @param {string} key - Cache key.
 * @param {any} val - Value to cache.
 * @param {number} [ttl=3600] - Expiry time in seconds.
 * @returns {Promise<void>}
 */
export const setCache = async (key, val, ttl = 3600) => {
  if (!isRedisEnabled || !isRedisConnected || !client) return;
  try {
    // Calls the Redis API to save the stringified value with an expiration time.
    await client.set(key, JSON.stringify(val), { EX: ttl });
    console.log(`[CACHE STORED] ${key} (TTL: ${ttl}s)`);
  } catch (err) {
    console.error(`Error writing cache key "${key}":`, err.message);
  }
};

/**
 * Deletes a single key from the cache.
 * 
 * @param {string} key - Cache key to remove.
 * @returns {Promise<void>}
 */
export const deleteCache = async (key) => {
  if (!isRedisEnabled || !isRedisConnected || !client) return;
  try {
    // Calls the Redis API to delete the specified cache key.
    await client.del(key);
    console.log(`[CACHE DELETED] ${key}`);
  } catch (err) {
    console.error(`Error deleting cache key "${key}":`, err.message);
  }
};

/**
 * Invalidates cache keys that match a specific glob-style pattern.
 * 
 * @param {string} pattern - Glob pattern matching keys (e.g., 'projects:*').
 * @returns {Promise<void>}
 */
export const invalidatePattern = async (pattern) => {
  if (!isRedisEnabled || !isRedisConnected || !client) return;
  try {
    const keys = await client.keys(pattern);
    if (keys && keys.length > 0) {
      const flatKeys = keys.flat();
      await client.del(flatKeys);
      console.log(`[CACHE PATTERN CLEARED] ${pattern} (${flatKeys.length} keys)`);
    }
  } catch (err) {
    console.error(`Error invalidating pattern "${pattern}":`, err.message);
  }
};

// Invalidates cache entries related to the dashboard summaries and analytics stats.
export const invalidateDashboardAndAnalytics = async () => {
  try {
    console.log("[CACHE INVALIDATION] Dashboard & Analytics");
    // Deletes the dashboard summary cache.
    await deleteCache("dashboard:summary");
    // Deletes the analytics stats cache.
    await deleteCache("analytics:stats");
  } catch (err) {
    console.error("Error in invalidateDashboardAndAnalytics:", err.message);
  }
};

// Invalidates cache entries related to projects, search indexes, and dashboard analytics.
export const invalidateProjects = async () => {
  try {
    console.log("[CACHE INVALIDATION] Projects");
    // Invalidates all project list cache keys.
    await invalidatePattern("projects:list:*");
    // Invalidates all search cache keys.
    await invalidatePattern("search:*");
    // Invalidates dashboard and analytics caches.
    await invalidateDashboardAndAnalytics();
  } catch (err) {
    console.error("Error in invalidateProjects:", err.message);
  }
};

// Invalidates client listing, search index, and dashboard analytics cache entries.
export const invalidateClients = async () => {
  try {
    console.log("[CACHE INVALIDATION] Clients");
    // Deletes the main clients list cache.
    await deleteCache("clients:list");
    // Invalidates all search cache keys.
    await invalidatePattern("search:*");
    // Invalidates dashboard and analytics caches.
    await invalidateDashboardAndAnalytics();
  } catch (err) {
    console.error("Error in invalidateClients:", err.message);
  }
};

// Invalidates user listing, search index, and dashboard analytics cache entries.
export const invalidateUsers = async () => {
  try {
    console.log("[CACHE INVALIDATION] Users/Staff");
    // Invalidates all user/staff list cache keys.
    await invalidatePattern("users:list:*");
    // Invalidates all search cache keys.
    await invalidatePattern("search:*");
    // Invalidates dashboard and analytics caches.
    await invalidateDashboardAndAnalytics();
  } catch (err) {
    console.error("Error in invalidateUsers:", err.message);
  }
};

// Invalidates invoice lists, revenue metrics, search index, and dashboard analytics caches.
export const invalidateInvoices = async () => {
  try {
    console.log("[CACHE INVALIDATION] Invoices");
    // Invalidates all invoice list cache keys.
    await invalidatePattern("invoices:list:*");
    // Invalidates all revenue cache keys.
    await invalidatePattern("revenue:*");
    // Invalidates all search cache keys.
    await invalidatePattern("search:*");
    // Invalidates dashboard and analytics caches.
    await invalidateDashboardAndAnalytics();
  } catch (err) {
    console.error("Error in invalidateInvoices:", err.message);
  }
};

// Invalidates transaction, invoice, revenue, search index, and dashboard analytics caches.
export const invalidateTransactions = async () => {
  try {
    console.log("[CACHE INVALIDATION] Transactions");
    // Invalidates all transaction list cache keys.
    await invalidatePattern("transactions:list:*");
    // Invalidates all invoice list cache keys.
    await invalidatePattern("invoices:list:*");
    // Invalidates all revenue cache keys.
    await invalidatePattern("revenue:*");
    // Invalidates all search cache keys.
    await invalidatePattern("search:*");
    // Invalidates dashboard and analytics caches.
    await invalidateDashboardAndAnalytics();
  } catch (err) {
    console.error("Error in invalidateTransactions:", err.message);
  }
};

// Invalidates task listings, search index, and dashboard analytics caches.
export const invalidateTasks = async () => {
  try {
    console.log("[CACHE INVALIDATION] Tasks");
    // Invalidates all task list cache keys.
    await invalidatePattern("tasks:list:*");
    // Invalidates all search cache keys.
    await invalidatePattern("search:*");
    // Invalidates dashboard and analytics caches.
    await invalidateDashboardAndAnalytics();
  } catch (err) {
    console.error("Error in invalidateTasks:", err.message);
  }
};

// Invalidates document listing and search index caches.
export const invalidateDocuments = async () => {
  try {
    console.log("[CACHE INVALIDATION] Documents");
    // Invalidates all document list cache keys.
    await invalidatePattern("documents:list:*");
    // Invalidates all search cache keys.
    await invalidatePattern("search:*");
  } catch (err) {
    console.error("Error in invalidateDocuments:", err.message);
  }
};

// Invalidates ticket lists, specific or general ticket details, search index, and dashboard analytics caches.
export const invalidateTickets = async (ticketId = null) => {
  try {
    console.log("[CACHE INVALIDATION] Tickets");
    // Invalidates all ticket listing cache keys.
    await invalidatePattern("tickets:list:*");
    if (ticketId) {
      // Invalidates the details cache for the specific ticket.
      await invalidatePattern(`tickets:details:${ticketId}:*`);
    } else {
      // Invalidates all ticket details cache keys.
      await invalidatePattern("tickets:details:*");
    }
    // Invalidates all search cache keys.
    await invalidatePattern("search:*");
    // Invalidates dashboard and analytics caches.
    await invalidateDashboardAndAnalytics();
  } catch (err) {
    console.error("Error in invalidateTickets:", err.message);
  }
};

// Invalidates milestone lists, project lists, search index, and dashboard analytics caches.
export const invalidateMilestones = async () => {
  try {
    console.log("[CACHE INVALIDATION] Milestones");
    // Invalidates all milestone list cache keys.
    await invalidatePattern("milestones:list:*");
    // Invalidates all project list cache keys.
    await invalidatePattern("projects:list:*");
    // Invalidates all search cache keys.
    await invalidatePattern("search:*");
    // Invalidates dashboard and analytics caches.
    await invalidateDashboardAndAnalytics();
  } catch (err) {
    console.error("Error in invalidateMilestones:", err.message);
  }
};

// Invalidates deliverables lists, search index, and dashboard analytics caches.
export const invalidateDeliverables = async () => {
  try {
    console.log("[CACHE INVALIDATION] Deliverables");
    // Invalidates all deliverables list cache keys.
    await invalidatePattern("deliverables:list:*");
    // Invalidates all search cache keys.
    await invalidatePattern("search:*");
    // Invalidates dashboard and analytics caches.
    await invalidateDashboardAndAnalytics();
  } catch (err) {
    console.error("Error in invalidateDeliverables:", err.message);
  }
};

// Invalidates site settings and search index cache entries.
export const invalidateSiteSettings = async () => {
  try {
    console.log("[CACHE INVALIDATION] Site Settings");
    // Deletes the site settings cache.
    await deleteCache("site:settings");
    // Invalidates all search cache keys.
    await invalidatePattern("search:*");
  } catch (err) {
    console.error("Error in invalidateSiteSettings:", err.message);
  }
};

// Invalidates the themes list cache entry.
export const invalidateThemes = async () => {
  try {
    console.log("[CACHE INVALIDATION] Themes");
    // Deletes the theme list cache.
    await deleteCache("themes:list");
  } catch (err) {
    console.error("Error in invalidateThemes:", err.message);
  }
};

// Invalidates content management system (CMS) content cache entry.
export const invalidateCms = async () => {
  try {
    console.log("[CACHE INVALIDATION] CMS");
    // Deletes the CMS content cache.
    await deleteCache("cms:content");
  } catch (err) {
    console.error("Error in invalidateCms:", err.message);
  }
};

// Invalidates contacts list and search index cache entries.
export const invalidateContacts = async () => {
  try {
    console.log("[CACHE INVALIDATION] Contacts");
    // Deletes the contacts list cache.
    await deleteCache("contacts:list");
    // Invalidates all search cache keys.
    await invalidatePattern("search:*");
  } catch (err) {
    console.error("Error in invalidateContacts:", err.message);
  }
};

// Invalidates email configuration settings and email activity logs caches.
export const invalidateEmailSettings = async () => {
  try {
    console.log("[CACHE INVALIDATION] Email Settings");
    // Deletes the email settings cache.
    await deleteCache("email:settings");
    // Deletes the email logs cache.
    await deleteCache("email:logs");
  } catch (err) {
    console.error("Error in invalidateEmailSettings:", err.message);
  }
};

// Invalidates email templates list and specific or general template details caches.
export const invalidateEmailTemplates = async (templateId = null) => {
  try {
    console.log("[CACHE INVALIDATION] Email Templates");
    // Deletes the email templates list cache.
    await deleteCache("email:templates:list");
    if (templateId) {
      // Deletes cache for the specific email template details.
      await deleteCache(`email:templates:details:${templateId}`);
    } else {
      // Invalidates all email template details cache keys.
      await invalidatePattern("email:templates:details:*");
    }
  } catch (err) {
    console.error("Error in invalidateEmailTemplates:", err.message);
  }
};

// Invalidates profile cache for a specific user and all user list caches.
export const invalidateProfile = async (userId) => {
  try {
    console.log("[CACHE INVALIDATION] Profile");
    if (userId) {
      // Deletes the profile cache for the specific user.
      await deleteCache(`user:profile:${userId}`);
    }
    // Invalidates all user list cache keys.
    await invalidatePattern("users:list:*");
  } catch (err) {
    console.error("Error in invalidateProfile:", err.message);
  }
};
