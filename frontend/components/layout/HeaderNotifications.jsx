// Displays a notifications count and lists recent messages.
// Supports bulk dismissals from the top navigation bar.


import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { Bell, Briefcase, CheckSquare, Receipt, MessageSquare, Check, Loader2 } from "lucide-react";
import * as notificationService from "../../services/notificationService";

export default function HeaderNotifications({ onStaffViewChange }) {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const res = await notificationService.getNotifications();
      if (res.success && res.data) {
        setNotifications(res.data);
      }
    } catch (e) {
      console.error("Failed to load header notifications:", e);
    }
  };

  // Poll notifications every 10 seconds
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Real-time WebSocket listener: refresh notifications immediately when a notification event arrives
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const wsBase = import.meta.env.VITE_API_URL
      ? import.meta.env.VITE_API_URL.replace(/^http/, "ws")
      : `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.hostname}:5000`;
    const wsUrl = `${wsBase}?token=${token}`;

    let ws;
    let reconnectTimer;

    const connect = () => {
      try {
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          ws.send(JSON.stringify({ type: "identify" }));
        };

        ws.onmessage = (event) => {
          try {
            const packet = JSON.parse(event.data);
            if (packet.type === "notification") {
              fetchNotifications();
            }
          } catch (_) {}
        };

        ws.onerror = () => {};

        ws.onclose = () => {
          // Reconnect after 5 seconds on unexpected close
          reconnectTimer = setTimeout(connect, 5000);
        };
      } catch (_) {}
    };

    connect();

    return () => {
      clearTimeout(reconnectTimer);
      if (ws) ws.close();
    };
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      fetchNotifications();
    }
  };

  const handleMarkAllRead = async (e) => {
    e.stopPropagation();
    setLoading(true);
    try {
      const res = await notificationService.markAllAsRead();
      if (res.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleClearAll = async (e) => {
    e.stopPropagation();
    setLoading(true);
    try {
      const res = await notificationService.clearAllNotifications();
      if (res.success) {
        setNotifications([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = async (notif) => {
    setIsOpen(false);
    
    // Mark as read in background
    if (!notif.read) {
      try {
        await notificationService.markAsRead(notif.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
        );
      } catch (err) {
        console.error(err);
      }
    }

    // Role-based routing logic
    const role = user?.role;
    const { type, linkId } = notif;

    if (role === "CLIENT") {
      switch (type) {
        case "project":
        case "task":
          if (linkId) navigate(`/client/projects/${linkId}`);
          else navigate("/client/projects");
          break;
        case "invoice":
          navigate("/client/invoices");
          break;
        case "ticket":
          navigate("/client/support-tickets");
          break;
        case "message":
          if (linkId) navigate(`/client/messages?convoId=${linkId}`);
          else navigate("/client/messages");
          break;
        default:
          navigate("/client/dashboard");
      }
    } else if (role === "ADMIN") {
      switch (type) {
        case "project":
        case "task":
          if (linkId) navigate(`/admin/projects/${linkId}`);
          else navigate("/admin/projects");
          break;
        case "invoice":
          navigate("/admin/invoices");
          break;
        case "ticket":
          navigate("/admin/support");
          break;
        case "message":
          if (linkId) navigate(`/admin/messages?convoId=${linkId}`);
          else navigate("/admin/messages");
          break;
        default:
          navigate("/admin/dashboard");
      }
    } else if (role === "STAFF") {
      // Staff uses single screen StaffDashboard
      if (onStaffViewChange) {
        switch (type) {
          case "task":
            onStaffViewChange("tasks");
            break;
          case "project":
            onStaffViewChange("dashboard"); // or projects grid
            break;
          case "ticket":
            onStaffViewChange("dashboard");
            break;
          case "message":
            onStaffViewChange("messages");
            break;
          default:
            onStaffViewChange("dashboard");
        }
      }
      if (type === "message" && linkId) {
        navigate(`/staff/dashboard?convoId=${linkId}`);
      } else {
        navigate("/staff/dashboard");
      }
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case "project":
        return <Briefcase size={16} className="text-indigo-500" />;
      case "task":
        return <CheckSquare size={16} className="text-emerald-500" />;
      case "invoice":
        return <Receipt size={16} className="text-rose-500" />;
      case "ticket":
        return <MessageSquare size={16} className="text-amber-500" />;
      default:
        return <Bell size={16} className="text-slate-500" />;
    }
  };

  const getIconBg = (type) => {
    switch (type) {
      case "project":
        return "bg-indigo-50 border-indigo-100";
      case "task":
        return "bg-emerald-50 border-emerald-100";
      case "invoice":
        return "bg-rose-50 border-rose-100";
      case "ticket":
        return "bg-amber-50 border-amber-100";
      default:
        return "bg-slate-50 border-slate-100";
    }
  };

  const formatTime = (dateStr) => {
    try {
      const date = new Date(dateStr);
      const diffMs = Date.now() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return "Yesterday";
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    } catch (_) {
      return "";
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleToggle}
        className="relative p-2.5 rounded-lg transition-colors cursor-pointer min-w-[48px] min-h-[48px] flex items-center justify-center"
        style={{ color: "var(--navbar-text, #64748B)" }}
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-600 animate-pulse" style={{ boxShadow: "0 0 0 2px var(--navbar-bg, #FFFFFF)" }} />
        )}
      </button>

      {isOpen && (
        <div className="fixed top-16 left-4 right-4 sm:absolute sm:top-auto sm:left-auto sm:right-0 sm:mt-2 w-auto sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden text-left font-sans animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div>
              <button 
                onClick={() => {
                  setIsOpen(false);
                  const role = user?.role;
                  if (role === "CLIENT") navigate("/client/notifications");
                  else if (role === "ADMIN") navigate("/admin/notifications");
                  else if (role === "STAFF") navigate("/staff/notifications");
                }}
                className="font-display font-bold text-slate-800 text-sm hover:text-indigo-600 cursor-pointer transition-colors border-none bg-transparent p-0 text-left font-semibold"
              >
                Notifications
              </button>
              <p className="text-[11px] text-slate-550 mt-0.5">
                {unreadCount > 0 ? `You have ${unreadCount} unread alert${unreadCount > 1 ? "s" : ""}` : "All caught up!"}
              </p>
            </div>
            {notifications.length > 0 && (
              <div className="flex gap-1.5 shrink-0">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    disabled={loading}
                    className="text-[10px] font-bold transition-colors flex items-center gap-0.5 cursor-pointer border px-2 py-1 rounded shadow-2xs disabled:opacity-50"
                    style={{ color: "var(--primary-btn, #4F46E5)", borderColor: "var(--border-color, #E2E8F0)", backgroundColor: "var(--card-bg, #FFFFFF)" }}
                  >
                    {loading ? (
                      <Loader2 size={10} className="animate-spin" />
                    ) : (
                      <Check size={10} />
                    )}
                    Mark Read
                  </button>
                )}
                <button
                  onClick={handleClearAll}
                  disabled={loading}
                  className="text-[10px] font-bold transition-colors flex items-center gap-0.5 cursor-pointer border px-2 py-1 rounded shadow-2xs disabled:opacity-50 text-red-650 hover:bg-red-50/50"
                  style={{ borderColor: "var(--border-color, #E2E8F0)", backgroundColor: "var(--card-bg, #FFFFFF)" }}
                >
                  Clear All
                </button>
              </div>
            )}
          </div>

          <div className="max-h-[320px] overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="py-10 text-center flex flex-col items-center justify-center">
                <Bell size={28} className="text-slate-350 mb-2" />
                <p className="text-xs text-slate-400 font-semibold">No notifications yet</p>
                <p className="text-[11px] text-slate-550 mt-0.5 px-6 leading-relaxed">
                  We'll notify you when you get assigned projects, tasks, or updates.
                </p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleNotificationClick(notif)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleNotificationClick(notif);
                    }
                  }}
                  className={`p-3.5 flex gap-3 cursor-pointer transition-colors text-left ${
                    notif.read ? "bg-white hover:bg-slate-50/50" : "bg-indigo-50/20 hover:bg-indigo-50/30"
                  }`}
                >
                  <div className={`w-8.5 h-8.5 rounded-xl border flex items-center justify-center shrink-0 ${getIconBg(notif.type)}`}>
                    {getIcon(notif.type)}
                  </div>
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <h5 className={`text-xs truncate ${notif.read ? "font-bold text-slate-700" : "font-extrabold text-slate-900"}`}>
                        {notif.title}
                      </h5>
                      <span className="text-[9px] font-semibold text-slate-550 shrink-0">
                        {formatTime(notif.createdAt)}
                      </span>
                    </div>
                    <p className={`text-[10.5px] leading-relaxed break-words ${notif.read ? "text-slate-500" : "text-slate-700 font-medium"}`}>
                      {notif.message}
                    </p>
                  </div>
                  {!notif.read && (
                    <div className="w-1.5 h-1.5 rounded-full mt-2.5 shrink-0" style={{ backgroundColor: "var(--primary-btn, #4F46E5)" }} />
                  )}
                </div>
              ))
            )}
            {notifications.length > 0 && (
              <div 
                onClick={() => {
                  setIsOpen(false);
                  const role = user?.role;
                  if (role === "CLIENT") navigate("/client/notifications");
                  else if (role === "ADMIN") navigate("/admin/notifications");
                  else if (role === "STAFF") navigate("/staff/notifications");
                }}
                className="p-2.5 text-center text-[10px] font-bold text-indigo-600 hover:bg-slate-50 border-t border-slate-100 cursor-pointer transition-colors"
              >
                View All Alerts & Notifications
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
