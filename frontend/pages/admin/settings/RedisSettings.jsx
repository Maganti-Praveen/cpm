// ============================================================
// RedisSettings.jsx — Admin Redis Cache Control Panel
// ============================================================
// Provides a premium admin UI to:
//   • View live Redis connection & enabled status
//   • Enable or disable the Redis caching layer with one click
//   • Auto-refresh status every 15 seconds
// ============================================================

import { useState, useEffect, useCallback } from "react";
import {
  Zap,
  ZapOff,
  ArrowLeft,
  Loader2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  WifiOff,
  Wifi,
  Info,
  Database,
  Power,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getCacheStatus, enableCache, disableCache } from "../../../services/cacheService";

// ────────────────────────────────────────────────────────────
// Sub-components
// ────────────────────────────────────────────────────────────

/** Animated toast notification — auto-dismisses after 3.5 s */
function Toast({ message, type = "success", onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="fixed top-6 right-6 z-50 animate-[fadeIn_0.2s_ease-out]">
      <div
        className={`flex items-center gap-2.5 px-4 py-3 rounded-lg shadow-lg border text-sm font-medium ${
          type === "success"
            ? "bg-emerald-50 border-emerald-200 text-emerald-700"
            : "bg-rose-50 border-rose-200 text-rose-700"
        }`}
      >
        {type === "success" ? (
          <CheckCircle2 size={16} />
        ) : (
          <AlertCircle size={16} />
        )}
        {message}
      </div>
    </div>
  );
}

/** Glowing animated status dot */
function StatusDot({ active, color }) {
  return (
    <span className="relative flex h-3 w-3">
      {active && (
        <span
          className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${color}`}
        />
      )}
      <span
        className={`relative inline-flex rounded-full h-3 w-3 ${
          active ? color : "bg-[#CBD5E1]"
        }`}
      />
    </span>
  );
}

/** Large hero toggle button — Enable / Disable */
function RedisToggleButton({ enabled, loading, onClick }) {
  return (
    <button
      id="redis-toggle-btn"
      onClick={onClick}
      disabled={loading}
      className={`
        group relative overflow-hidden
        inline-flex items-center gap-3
        h-14 px-8 rounded-2xl
        text-base font-semibold text-white
        transition-all duration-300 ease-out
        shadow-lg hover:shadow-xl active:scale-[0.98]
        disabled:opacity-60 disabled:cursor-not-allowed
        cursor-pointer
        ${
          enabled
            ? "bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 shadow-rose-200"
            : "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-emerald-200"
        }
      `}
    >
      {/* Shimmer effect on hover */}
      <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      {loading ? (
        <Loader2 size={20} className="animate-spin" />
      ) : enabled ? (
        <ZapOff size={20} />
      ) : (
        <Zap size={20} />
      )}
      {loading ? "Applying..." : enabled ? "Disable Redis Cache" : "Enable Redis Cache"}
    </button>
  );
}

// ────────────────────────────────────────────────────────────
// Main Page Component
// ────────────────────────────────────────────────────────────

export default function RedisSettings() {
  const navigate = useNavigate();

  // Component state
  const [status, setStatus] = useState({ connected: false, enabled: false, envDefault: true });
  const [loading, setLoading] = useState(true);      // initial page load
  const [toggling, setToggling] = useState(false);   // toggle button in-flight
  const [refreshing, setRefreshing] = useState(false); // manual refresh spin
  const [toast, setToast] = useState(null);

  /** Helper to display a toast notification */
  const showToast = (message, type = "success") =>
    setToast({ message, type });

  // ── Fetch Redis status from backend ──────────────────────
  const fetchStatus = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await getCacheStatus();
      setStatus(res.data.data);
    } catch {
      // Silently fail on auto-refresh; show toast on manual fetch
      if (!silent) showToast("Failed to load Redis status", "error");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  // Fetch status on mount
  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Auto-refresh every 15 seconds silently
  useEffect(() => {
    const interval = setInterval(() => fetchStatus(true), 15000);
    return () => clearInterval(interval); // cleanup on unmount
  }, [fetchStatus]);

  // ── Manual refresh button ─────────────────────────────────
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchStatus(true);
    setRefreshing(false);
    showToast("Status refreshed");
  };

  // ── Enable / Disable toggle ───────────────────────────────
  const handleToggle = async () => {
    setToggling(true);
    try {
      let res;
      if (status.enabled) {
        // Currently enabled → disable it
        res = await disableCache();
        showToast("Redis cache disabled successfully");
      } else {
        // Currently disabled → enable it
        res = await enableCache();
        showToast("Redis cache enabled successfully");
      }
      // Update local state with the response's updated status
      if (res.data?.data) {
        setStatus(res.data.data);
      }
    } catch {
      showToast("Failed to update Redis status", "error");
    } finally {
      setToggling(false);
    }
  };

  // ── Loading skeleton ──────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-[#4F46E5]" />
      </div>
    );
  }

  // ── Derived display values ────────────────────────────────
  const isFullyActive = status.enabled && status.connected;
  const isEnabledOnly = status.enabled && !status.connected;

  return (
    <div>
      {/* Toast notifications */}
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {/* ── Page Header ─────────────────────────────────── */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/admin/settings")}
            className="flex items-center justify-center w-9 h-9 rounded-lg border border-[#CBD5E1] hover:bg-[#F1F5F9] transition-colors cursor-pointer"
          >
            <ArrowLeft size={16} className="text-[#64748B]" />
          </button>
          <div>
            <h1 className="text-[1.75rem] font-bold text-[#0F172A] font-display">
              Redis Cache
            </h1>
            <p className="text-sm text-[#64748B] mt-1">
              Monitor and control the Redis caching layer
            </p>
          </div>
        </div>

        {/* Manual refresh button */}
        <button
          id="redis-refresh-btn"
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 h-9 px-4 rounded-lg border border-[#CBD5E1] hover:bg-[#F1F5F9] text-sm text-[#64748B] transition-colors cursor-pointer disabled:opacity-50"
        >
          <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
          Refresh Status
        </button>
      </div>

      {/* ── Status Banner ────────────────────────────────── */}
      <div
        className={`rounded-2xl p-5 mb-6 border flex items-center gap-5 transition-all duration-500 ${
          isFullyActive
            ? "bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200"
            : isEnabledOnly
            ? "bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200"
            : "bg-gradient-to-r from-slate-50 to-slate-100 border-slate-200"
        }`}
      >
        {/* Large status icon */}
        <div
          className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
            isFullyActive
              ? "bg-emerald-100"
              : isEnabledOnly
              ? "bg-amber-100"
              : "bg-slate-200"
          }`}
        >
          {isFullyActive ? (
            <Wifi size={26} className="text-emerald-600" />
          ) : isEnabledOnly ? (
            <WifiOff size={26} className="text-amber-500" />
          ) : (
            <WifiOff size={26} className="text-slate-400" />
          )}
        </div>

        <div className="flex-1">
          <p
            className={`text-base font-bold ${
              isFullyActive
                ? "text-emerald-800"
                : isEnabledOnly
                ? "text-amber-800"
                : "text-slate-700"
            }`}
          >
            {isFullyActive
              ? "Redis is Active & Connected"
              : isEnabledOnly
              ? "Redis Enabled — Waiting for Connection"
              : "Redis Cache is Disabled"}
          </p>
          <p
            className={`text-sm mt-0.5 ${
              isFullyActive
                ? "text-emerald-600"
                : isEnabledOnly
                ? "text-amber-600"
                : "text-slate-500"
            }`}
          >
            {isFullyActive
              ? "All cache reads and writes are operating normally."
              : isEnabledOnly
              ? "The cache module is enabled but Redis is not yet reachable. Check your Redis server."
              : "Cache reads and writes are bypassed. All data comes directly from the database."}
          </p>
        </div>
      </div>

      {/* ── Live Status Cards ─────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {/* Connection Status card */}
        <div
          id="redis-connection-card"
          className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#EEF2FF] flex items-center justify-center">
                <Database size={18} className="text-[#4F46E5]" />
              </div>
              <p className="text-sm font-semibold text-[#0F172A]">
                Connection
              </p>
            </div>
            <StatusDot
              active={status.connected}
              color={status.connected ? "bg-emerald-400" : "bg-rose-400"}
            />
          </div>
          <div className="flex items-center gap-2">
            {status.connected ? (
              <>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                  <CheckCircle2 size={11} /> Connected
                </span>
              </>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-full">
                <AlertCircle size={11} /> Disconnected
              </span>
            )}
          </div>
          <p className="text-xs text-[#94A3B8] mt-2">
            Socket connection to the Redis server
          </p>
        </div>

        {/* Cache Enabled Status card */}
        <div
          id="redis-enabled-card"
          className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#F0FDF4] flex items-center justify-center">
                <Power size={18} className="text-emerald-600" />
              </div>
              <p className="text-sm font-semibold text-[#0F172A]">
                Cache Layer
              </p>
            </div>
            <StatusDot
              active={status.enabled}
              color={status.enabled ? "bg-emerald-400" : "bg-slate-300"}
            />
          </div>
          <div className="flex items-center gap-2">
            {status.enabled ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                <Zap size={11} /> Enabled
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full">
                <ZapOff size={11} /> Disabled
              </span>
            )}
          </div>
          <p className="text-xs text-[#94A3B8] mt-2">
            Whether caching is active in the app layer
          </p>
        </div>
      </div>

      {/* ── Toggle Control Card ───────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-[#0F172A] mb-1">
              {status.enabled ? "Disable Redis Cache" : "Enable Redis Cache"}
            </h3>
            <p className="text-xs text-[#64748B] max-w-sm">
              {status.enabled
                ? "Turning off Redis will make all requests go directly to the database. Use this for debugging or when Redis is misconfigured."
                : "Turn on Redis to restore high-speed caching. Data will be served from cache where available, reducing database load."}
            </p>
          </div>

          {/* The dynamic toggle button */}
          <RedisToggleButton
            enabled={status.enabled}
            loading={toggling}
            onClick={handleToggle}
          />
        </div>
      </div>

      {/* ── Env Config Hint — shown when runtime differs from .env ── */}
      {status.enabled !== status.envDefault && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 flex items-start gap-3">
          <Info size={18} className="text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-800">
              Runtime state differs from .env configuration
            </p>
            <p className="text-xs text-amber-600 mt-1">
              Your <code className="bg-amber-100 px-1 rounded font-mono">.env</code> file has{" "}
              <code className="bg-amber-100 px-1 rounded font-mono">
                REDIS_ENABLED={status.envDefault ? "true" : "false"}
              </code>
              , but Redis is currently{" "}
              <strong>{status.enabled ? "enabled" : "disabled"}</strong> at runtime via the admin panel.
              This setting resets to the .env value on next server restart.
            </p>
          </div>
        </div>
      )}

      {/* ── Info Notice ───────────────────────────────────── */}
      <div className="bg-[#EEF2FF] border border-[#C7D2FE] rounded-xl p-4 flex items-start gap-3">
        <Info size={18} className="text-[#4F46E5] mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-medium text-[#3730A3]">
            About Redis Cache
          </p>
          <p className="text-xs text-[#6366F1] mt-1">
            Redis is used to cache frequently accessed data (dashboards, project lists, analytics) to reduce database load and improve response times.
            Disabling it is safe — the application will continue working normally, just with slightly higher database usage.
            The default state is controlled by <code className="bg-indigo-100 px-1 rounded font-mono">REDIS_ENABLED</code> in your
            {" "}<code className="bg-indigo-100 px-1 rounded font-mono">.env</code> file, and can also be toggled here at runtime.
            Status auto-refreshes every 15 seconds.
          </p>
        </div>
      </div>
    </div>
  );
}
