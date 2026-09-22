// Configures the core Axios instance for communicating with the backend API.
// Intercepts outgoing requests to attach JWT authentication credentials from localStorage.


import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : "/api",
  withCredentials: true,
});

// Client-side cache setup
const apiCache = new Map();
const CACHE_TTL = 15000; // 15 seconds

export const clearApiCache = () => {
  apiCache.clear();
};

// attach token to every request if available, and intercept GETs for caching
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Cache GET requests
  const isGet = config.method === "get";
  const bypassHeader = config.headers && (config.headers["X-Bypass-Cache"] || config.headers["x-bypass-cache"]);
  const isAuthUrl = config.url && config.url.includes("/auth/");
  
  if (isGet && !bypassHeader && !isAuthUrl) {
    const cacheKey = config.url + JSON.stringify(config.params || {});
    const cached = apiCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      config.adapter = () => {
        return Promise.resolve({
          data: cached.data,
          status: cached.status,
          statusText: cached.statusText,
          headers: cached.headers,
          config,
          request: {},
        });
      };
    }
  }

  return config;
});

let isRefreshing = false;
let refreshSubscribers = [];

function subscribeTokenRefresh(cb) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

function redirectToLogin() {
  const path = window.location.pathname;
  if (path.startsWith("/admin")) {
    window.location.href = "/admin/login";
  } else if (path.startsWith("/staff")) {
    window.location.href = "/staff/login";
  } else {
    window.location.href = "/client/login";
  }
}

// handle response errors globally (especially 401 token expirations/suspensions)
API.interceptors.response.use(
  (response) => {
    const { config } = response;
    const isGet = config.method === "get";
    const bypassHeader = config.headers && (config.headers["X-Bypass-Cache"] || config.headers["x-bypass-cache"]);
    const isAuthUrl = config.url && config.url.includes("/auth/");

    // If it's a successful GET request and not served from cache adapter, store it
    if (isGet && !bypassHeader && !isAuthUrl && !config.adapter && response.status >= 200 && response.status < 300) {
      const cacheKey = config.url + JSON.stringify(config.params || {});
      apiCache.set(cacheKey, {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        timestamp: Date.now(),
      });
    }

    // Clear cache on mutations (POST, PUT, DELETE, PATCH)
    if (["post", "put", "delete", "patch"].includes(config.method || "")) {
      apiCache.clear();
    }

    return response;
  },
  async (error) => {
    const { config, response } = error;
    
    // Clear cache on mutation errors just to be safe
    if (config && ["post", "put", "delete", "patch"].includes(config.method || "")) {
      apiCache.clear();
    }
    const originalRequest = config;

    if (response && response.status === 401) {
      // Exclude authentication endpoints from triggering token refresh to avoid infinite loops or swallowing initial login/OTP errors
      const isAuthUrl = config.url && (
        config.url.includes("/auth/login") ||
        config.url.includes("/auth/refresh-token") ||
        config.url.includes("/auth/verify-2fa")
      );
      if (isAuthUrl) {
        return Promise.reject(error);
      }

      const message = response.data?.message;
      if (message && message.toLowerCase().includes("suspended")) {
        localStorage.removeItem("token");
        localStorage.setItem("suspension_error", message);
        redirectToLogin();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(API(originalRequest));
          });
        });
      }

      isRefreshing = true;

      try {
        const refreshRes = await axios.post(
          import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api/auth/refresh-token` : "/api/auth/refresh-token",
          {},
          { withCredentials: true }
        );

        if (refreshRes.data && refreshRes.data.token) {
          const newToken = refreshRes.data.token;
          localStorage.setItem("token", newToken);
          isRefreshing = false;
          onRefreshed(newToken);
          
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return API(originalRequest);
        }
      } catch (refreshErr) {
        isRefreshing = false;
        refreshSubscribers = [];
        localStorage.removeItem("token");
        redirectToLogin();
        return Promise.reject(refreshErr);
      }
    }
    return Promise.reject(error);
  }
);

export default API;
