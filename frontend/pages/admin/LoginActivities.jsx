import { useState, useEffect, useCallback } from "react";
import { Shield, CheckCircle2, XCircle, Search, Filter, RefreshCw, Trash2, Unlock, MoreVertical, ShieldAlert } from "lucide-react";
import loginAttemptService from "../../services/loginAttemptService";
import Pagination from "../../components/common/Pagination";
import { useToast } from "../../context/ToastContext";

export default function LoginActivities() {
  const [attempts, setAttempts] = useState([]);
  const [stats, setStats] = useState({ total: 0, success: 0, failed: 0 });
  const [lockedAccounts, setLockedAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [activeTab, setActiveTab] = useState("all"); // "all" | "locked"
  const limit = 15;

  const { showToast } = useToast();
  const [activeMenuId, setActiveMenuId] = useState(null);

  useEffect(() => {
    const handleOutsideClick = () => setActiveMenuId(null);
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, []);

  const fetchData = useCallback(async (currentPage, search, status) => {
    setLoading(currentPage === 1 && !refreshing);
    try {
      const [logsRes, statsRes, lockedRes] = await Promise.all([
        loginAttemptService.getLoginAttempts(currentPage, limit, search, status),
        loginAttemptService.getLoginStats(),
        loginAttemptService.getLockedAccounts(),
      ]);

      if (logsRes.success) {
        setAttempts(logsRes.data || []);
        setTotalPages(logsRes.pagination?.totalPages || 1);
        setTotalItems(logsRes.pagination?.total || 0);
      }
      if (statsRes.success) {
        setStats(statsRes.data || { total: 0, success: 0, failed: 0 });
      }
      if (lockedRes.success) {
        setLockedAccounts(lockedRes.data || []);
      }
    } catch (err) {
      console.error("Failed to load login attempts or stats:", err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refreshing]);

  useEffect(() => {
    fetchData(page, searchQuery, statusFilter);
  }, [fetchData, page, searchQuery, statusFilter]);

  // Live ticking countdown for locked accounts list
  useEffect(() => {
    if (activeTab !== "locked" || lockedAccounts.length === 0) return;

    const timer = setInterval(() => {
      setLockedAccounts((prev) => {
        return prev
          .map((item) => ({ ...item, remaining: item.remaining - 1 }))
          .filter((item) => item.remaining > 0);
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activeTab, lockedAccounts.length]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData(page, searchQuery, statusFilter);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setPage(1);
  };

  const handleStatusChange = (e) => {
    setStatusFilter(e.target.value);
    setPage(1);
  };

  const handleClearLogs = async () => {
    try {
      const res = await loginAttemptService.clearLoginAttempts();
      if (res.success) {
        showToast("Successfully cleared all login audit logs.", "success");
        setPage(1);
        fetchData(1, searchQuery, statusFilter);
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to clear logs.", "error");
    }
  };

  const handleUnlock = async (email, ipAddress) => {
    setActiveMenuId(null);
    const identifier = email || ipAddress;
    try {
      const res = await loginAttemptService.unlockAccount(email, ipAddress);
      if (res.success) {
        showToast(`Successfully unlocked and reset rate limits for ${identifier}.`, "success");
        fetchData(page, searchQuery, statusFilter);
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to unlock account.", "error");
    }
  };

  const handleDeleteLog = async (id) => {
    setActiveMenuId(null);
    try {
      const res = await loginAttemptService.deleteLoginAttempt(id);
      if (res.success) {
        showToast("Successfully deleted the login attempt record.", "success");
        fetchData(page, searchQuery, statusFilter);
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to delete log.", "error");
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const formatCooldown = (seconds) => {
    if (seconds <= 0) return "Expired";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  };

  return (
    <div className="space-y-6 font-body text-[#0F172A]">
      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-[1.75rem] font-bold text-[#0F172A] font-display">
            Login Auditing & Rate Limits
          </h1>
          <p className="text-sm text-slate-600">
            Monitor login attempts, inspect suspicious activities, and audit client/staff/admin access records.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleClearLogs}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 border border-rose-200 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 transition-all font-semibold text-sm cursor-pointer disabled:opacity-50"
          >
            <Trash2 size={16} />
            <span>Clear Audit Logs</span>
          </button>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading || refreshing}
            className="flex items-center gap-2 px-4 py-2 border rounded-lg bg-white shadow-sm hover:bg-slate-50 transition-all font-semibold text-sm cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            <span>Refresh Logs</span>
          </button>
        </div>
      </div>

      {/* 2. Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Total Attempts */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-5">
          <div className="p-3.5 rounded-lg bg-slate-50 text-slate-600 border border-slate-100">
            <Shield size={24} />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-0.5">Total Attempts</span>
            <span className="text-3xl font-bold text-[#0f172a] font-display">{stats.total}</span>
          </div>
        </div>

        {/* Card 2: Successful Logins */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-5">
          <div className="p-3.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-0.5">Successful Attempts</span>
            <span className="text-3xl font-bold text-emerald-600 font-display">{stats.success}</span>
          </div>
        </div>

        {/* Card 3: Failed Logins */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-5">
          <div className="p-3.5 rounded-lg bg-rose-50 text-rose-600 border border-rose-100">
            <XCircle size={24} />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-0.5">Failed Attempts</span>
            <span className="text-3xl font-bold text-rose-600 font-display">{stats.failed}</span>
          </div>
        </div>
      </div>

      {/* 3. Tab Navigation */}
      <div className="flex border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab("all")}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === "all"
              ? "border-primary text-primary"
              : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
          }`}
        >
          All Attempts Log
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("locked")}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "locked"
              ? "border-primary text-primary"
              : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
          }`}
        >
          <span>Locked Accounts</span>
          {lockedAccounts.length > 0 && (
            <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold rounded-full bg-rose-100 text-rose-700 animate-pulse">
              {lockedAccounts.length}
            </span>
          )}
        </button>
      </div>

      {/* 4. Tab Contents */}
      {activeTab === "all" ? (
        <>
          {/* Search and Filters */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-sm">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="relative w-full md:w-80">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Search size={18} />
                </span>
                <input
                  type="text"
                  placeholder="Search by Email or IP..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="w-full pl-10 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all placeholder-slate-400"
                />
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                <span className="text-xs font-bold text-slate-600 uppercase flex items-center gap-1">
                  <Filter size={14} /> Status:
                </span>
                <select
                  value={statusFilter}
                  onChange={handleStatusChange}
                  className="px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg outline-none focus:border-primary transition-all font-medium cursor-pointer"
                >
                  <option value="All">All Statuses</option>
                  <option value="Success">Success Only</option>
                  <option value="Failed">Failed Only</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table List */}
          <div className="bg-white border border-slate-200/90 rounded-xl shadow-sm overflow-hidden">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <RefreshCw size={36} className="animate-spin text-primary" />
                <span className="text-sm font-semibold text-slate-600">Loading Login Records...</span>
              </div>
            ) : attempts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Shield size={48} className="text-slate-300 mb-3" />
                <span className="text-base font-bold text-slate-800">No login attempts recorded</span>
                <p className="text-xs text-slate-600 mt-1 max-w-[280px]">
                  No activity logs match your search queries or filter requirements.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto min-h-[220px]">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 font-display text-xs font-bold text-slate-600 uppercase tracking-wider">
                      <th className="px-6 py-4">Timestamp</th>
                      <th className="px-6 py-4">Email Address</th>
                      <th className="px-6 py-4">IP Address</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Details / Errors</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm text-[#0F172A]">
                    {attempts.map((attempt) => (
                      <tr key={attempt.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4.5 whitespace-nowrap text-xs text-slate-600 font-semibold">
                          {formatDate(attempt.timestamp)}
                        </td>
                        <td className="px-6 py-4.5 font-medium">{attempt.email || "—"}</td>
                        <td className="px-6 py-4.5 font-mono text-xs">{attempt.ipAddress}</td>
                        <td className="px-6 py-4.5 whitespace-nowrap">
                          {attempt.status === "SUCCESS" ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                              Success
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-100">
                              Failed
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4.5 text-xs text-slate-600 max-w-[240px] truncate" title={attempt.message}>
                          {attempt.status === "SUCCESS" ? (attempt.message || "Successful") : (attempt.message || "—")}
                        </td>
                        <td className="px-6 py-4.5 whitespace-nowrap text-right text-xs">
                          <div className="relative inline-block text-left">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuId(activeMenuId === attempt.id ? null : attempt.id);
                              }}
                              className="p-1.5 bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-slate-200 rounded-lg text-slate-500 cursor-pointer transition-colors outline-none inline-flex items-center justify-center"
                              aria-label="Actions"
                            >
                              <MoreVertical size={14} />
                            </button>

                            {activeMenuId === attempt.id && (
                              <div className="absolute right-0 mt-1.5 w-40 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-20 text-left animate-fade-in divide-y divide-slate-100">
                                <div className="py-1 px-1">
                                  {attempt.status === "FAILED" && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleUnlock(attempt.email, attempt.ipAddress);
                                      }}
                                      className="w-full px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-emerald-700 rounded-lg text-left font-semibold border-none cursor-pointer flex items-center gap-2 transition-all"
                                    >
                                      <Unlock size={13} className="text-slate-400" />
                                      <span>Reset / Unlock</span>
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteLog(attempt.id);
                                    }}
                                    className="w-full px-3 py-2 text-xs text-slate-700 hover:bg-rose-50 hover:text-rose-700 rounded-lg text-left font-semibold border-none cursor-pointer flex items-center gap-2 transition-all"
                                  >
                                    <Trash2 size={13} className="text-slate-400" />
                                    <span>Delete Log</span>
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && !loading && (
              <div className="border-t border-slate-150 px-6 py-4 bg-slate-50/50">
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  totalItems={totalItems}
                  itemsPerPage={limit}
                  onPageChange={setPage}
                />
              </div>
            )}
          </div>
        </>
      ) : (
        /* Locked Accounts Tab View */
        <div className="bg-white border border-slate-200/90 rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <RefreshCw size={36} className="animate-spin text-primary" />
              <span className="text-sm font-semibold text-slate-600">Checking Active Locks...</span>
            </div>
          ) : lockedAccounts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <CheckCircle2 size={48} className="text-emerald-500 mb-3" />
              <span className="text-base font-bold text-slate-800">All accounts are unlocked</span>
              <p className="text-xs text-slate-600 mt-1 max-w-[280px]">
                There are currently no active IP or Email rate-limiting blocks in the system.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto min-h-[220px]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 font-display text-xs font-bold text-slate-600 uppercase tracking-wider">
                    <th className="px-6 py-4">Lock Scope</th>
                    <th className="px-6 py-4">Blocked Target</th>
                    <th className="px-6 py-4 text-center">Consecutive Failures</th>
                    <th className="px-6 py-4">Severity / Cooldown Type</th>
                    <th className="px-6 py-4">Remaining Cooldown</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-[#0F172A]">
                  {lockedAccounts.map((lock, index) => {
                    const lockId = `lock-${lock.type}-${lock.target}-${index}`;
                    return (
                      <tr key={lockId} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                            lock.type === "Email" ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700"
                          }`}>
                            {lock.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-medium">{lock.target}</td>
                        <td className="px-6 py-4 text-center font-bold text-rose-600">{lock.consecutiveFailures}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600">
                            <ShieldAlert size={14} />
                            {lock.lockType === "30 Minutes" ? "Suspicious Block (30m)" : "Temporary Block (1m)"}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono font-bold text-slate-600">
                          {formatCooldown(lock.remaining)}
                        </td>
                        <td className="px-6 py-4.5 whitespace-nowrap text-right text-xs">
                          <div className="relative inline-block text-left">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuId(activeMenuId === lockId ? null : lockId);
                              }}
                              className="p-1.5 bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-slate-200 rounded-lg text-slate-500 cursor-pointer transition-colors outline-none inline-flex items-center justify-center"
                              aria-label="Actions"
                            >
                              <MoreVertical size={14} />
                            </button>

                            {activeMenuId === lockId && (
                              <div className="absolute right-0 mt-1.5 w-40 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-20 text-left animate-fade-in">
                                <div className="py-1 px-1">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleUnlock(
                                        lock.type === "Email" ? lock.target : "",
                                        lock.type === "IP Address" ? lock.target : ""
                                      );
                                    }}
                                    className="w-full px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-emerald-700 rounded-lg text-left font-semibold border-none cursor-pointer flex items-center gap-2 transition-all"
                                  >
                                    <Unlock size={13} className="text-slate-400" />
                                    <span>Reset / Unlock</span>
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
