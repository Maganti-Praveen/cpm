import API from "./api";

const loginAttemptService = {
  // Fetch paginated login attempts log
  getLoginAttempts: async (page = 1, limit = 15, search = "", status = "All") => {
    const res = await API.get("/login-attempts", {
      params: { page, limit, search, status }
    });
    return res.data;
  },

  // Fetch successful vs failed aggregations
  getLoginStats: async () => {
    const res = await API.get("/login-attempts/stats");
    return res.data;
  },

  // Fetch currently locked accounts/IPs
  getLockedAccounts: async () => {
    const res = await API.get("/login-attempts/locked");
    return res.data;
  },

  // Clear all login attempt records
  clearLoginAttempts: async () => {
    const res = await API.delete("/login-attempts");
    return res.data;
  },

  // Unlock/reset rate-limit blocks for a specific email or IP address
  unlockAccount: async (email = "", ipAddress = "") => {
    const res = await API.post("/login-attempts/unlock", { email, ipAddress });
    return res.data;
  },

  // Delete a specific login attempt record by ID
  deleteLoginAttempt: async (id) => {
    const res = await API.delete(`/login-attempts/${id}`);
    return res.data;
  }
};

export default loginAttemptService;
