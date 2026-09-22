// Displays log history of emails sent by the system.
// Helps diagnose notification delivery issues.


import { useState, useEffect, useCallback } from "react";
import { Search, RefreshCw, Inbox, Loader2 } from "lucide-react";
import { getEmailLogs } from "../../../services/emailSettingsService";

export default function EmailLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const { data } = await getEmailLogs();
      setLogs(data?.data || data || []);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch email logs.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Filter logs by search query (subject, recipient, or template name)
  const filteredLogs = logs.filter(
    (log) =>
      log.recipient.toLowerCase().includes(search.toLowerCase()) ||
      log.subject.toLowerCase().includes(search.toLowerCase()) ||
      log.template.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleString();
  };

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center sm:justify-between mb-5 gap-3">
        <div className="relative w-full sm:w-72">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search logs..."
            className="w-full h-9 pl-9 pr-3 rounded-lg border border-[#CBD5E1] bg-white text-sm text-[#334155] outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5]/20"
           aria-label="Search logs..."/>
        </div>
        <button
          onClick={fetchLogs}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 h-9 px-4 rounded-lg border border-[#CBD5E1] text-[#334155] hover:bg-[#F1F5F9] text-sm font-medium cursor-pointer transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
          Refresh
        </button>
      </div>

      {/* Log list wrapper */}
      {loading ? (
        <div className="bg-white rounded-xl shadow-sm border border-[#E2E8F0] flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="w-8 h-8 text-[#4F46E5] animate-spin shrink-0" />
          <p className="text-sm font-medium text-[#475569]">Loading logs...</p>
        </div>
      ) : error ? (
        <div className="bg-white rounded-xl shadow-sm border border-[#E2E8F0] flex flex-col items-center justify-center py-20 gap-2">
          <p className="text-sm font-medium text-rose-600">{error}</p>
          <button onClick={fetchLogs} className="text-xs text-[#4F46E5] font-semibold hover:underline">
            Try again
          </button>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-[#E2E8F0] flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-16 h-16 rounded-2xl bg-[#F1F5F9] flex items-center justify-center">
            <Inbox size={28} className="text-[#94A3B8]" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-[#475569]">No email logs found</p>
            <p className="text-xs text-[#94A3B8] mt-1 max-w-xs">
              {search ? "No logs matching your search filter." : "Email logs will appear here once emails are sent through the system."}
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-[#E2E8F0] overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                <th className="text-left text-xs font-semibold text-[#64748B] uppercase tracking-wider px-5 py-3">Timestamp</th>
                <th className="text-left text-xs font-semibold text-[#64748B] uppercase tracking-wider px-5 py-3">Recipient</th>
                <th className="text-left text-xs font-semibold text-[#64748B] uppercase tracking-wider px-5 py-3">Template</th>
                <th className="text-left text-xs font-semibold text-[#64748B] uppercase tracking-wider px-5 py-3">Subject</th>
                <th className="text-center text-xs font-semibold text-[#64748B] uppercase tracking-wider px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log, i) => (
                <tr key={log.id || i} className="border-b border-[#F1F5F9] hover:bg-[#F8FAFC]/60 transition-colors">
                  <td className="px-5 py-3 text-xs text-[#64748B]">{formatDate(log.timestamp)}</td>
                  <td className="px-5 py-3 text-sm text-[#334155]">{log.recipient}</td>
                  <td className="px-5 py-3 text-sm text-[#475569]">{log.template}</td>
                  <td className="px-5 py-3 text-sm text-[#475569] max-w-[200px] truncate" title={log.subject}>{log.subject}</td>
                  <td className="px-5 py-3 text-center">
                    <span
                      className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                        log.status === "sent" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                      }`}
                      title={log.error || undefined}
                    >
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
