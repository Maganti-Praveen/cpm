// ============================================================
// cacheService.js — Redis Cache API Service
// ============================================================
// Provides functions to interact with the backend Redis cache
// management endpoints (status, enable, disable).
// ============================================================

import API from "./api";

/**
 * Fetches the current Redis connection and enabled status.
 * @returns {Promise<import('axios').AxiosResponse<{ success: boolean, data: { connected: boolean, enabled: boolean } }>>}
 */
export const getCacheStatus = () => API.get("/cache/status");

/**
 * Enables the Redis caching layer on the backend.
 * @returns {Promise<import('axios').AxiosResponse>}
 */
export const enableCache = () => API.post("/cache/enable");

/**
 * Disables the Redis caching layer on the backend.
 * @returns {Promise<import('axios').AxiosResponse>}
 */
export const disableCache = () => API.post("/cache/disable");
