// This file renders a comprehensive feed of user-specific notifications and alerts.
// It supports marking alerts as read, deleting single entries, or performing bulk clear operations.

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { 
  Bell, 
  Briefcase, 
  CheckSquare, 
  Receipt, 
  MessageSquare, 
  Check, 
  Trash2, 
  Loader2, 
  MailOpen,
  MessageCircle
} from "lucide-react";
import * as notificationService from "../../services/notificationService";
import { useToast } from "../../context/ToastContext";

export default function NotificationFeed() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user } = useSelector((state) => state.auth);
  
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Queries all active notification records for the logged-in user
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await notificationService.getNotifications();
      if (res.success && res.data) {
        setNotifications(res.data);
      }
    } catch (err) {
      console.error("Failed to load notifications page feed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Formats server date string into human-readable relative time format
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
      return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
    } catch (_) {
      return "";
    }
  };

  // Maps notifications type keys to standard Lucide layout icons
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
      case "message":
        return <MessageCircle size={16} className="text-blue-500" />;
      default:
        return <Bell size={16} className="text-slate-500" />;
    }
  };

  // Maps notifications type keys to standard background styling classes
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
      case "message":
        return "bg-blue-50 border-blue-100";
      default:
        return "bg-slate-50 border-slate-100";
    }
  };

  // Marks a single notification as read and navigates to target path
  const handleNotificationClick = async (notif) => {
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
      switch (type) {
        case "project":
        case "task":
          if (linkId) navigate(`/staff/projects/${linkId}`);
          else navigate("/staff/projects");
          break;
        case "ticket":
          navigate("/staff/tickets");
          break;
        case "message":
          if (linkId) navigate(`/staff/messages?convoId=${linkId}`);
          else navigate("/staff/messages");
          break;
        default:
          navigate("/staff/dashboard");
      }
    }
  };

  // Marks a single notification as read without redirection
  const handleMarkSingleRead = async (e, id) => {
    e.stopPropagation();
    try {
      const res = await notificationService.markAsRead(id);
      if (res.success) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
        showToast("Notification marked as read.", "success");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Deletes a single notification from feed and database
  const handleDeleteSingle = async (e, id) => {
    e.stopPropagation();
    try {
      const res = await notificationService.deleteNotification(id);
      if (res.success) {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        showToast("Notification deleted.", "success");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Marks all notifications as read at once
  const handleMarkAllRead = async () => {
    setActionLoading(true);
    try {
      const res = await notificationService.markAllAsRead();
      if (res.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        showToast("All notifications marked as read.", "success");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  // Clears all notifications from user's record
  const handleClearAll = async () => {
    setActionLoading(true);
    try {
      const res = await notificationService.clearAllNotifications();
      if (res.success) {
        setNotifications([]);
        showToast("All notifications cleared.", "success");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-left font-sans">
      <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-display font-bold text-slate-800 text-sm flex items-center gap-2">
            <Bell size={16} className="text-slate-500" />
            Alerts & History Feed
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {unreadCount > 0 
              ? `You have ${unreadCount} unread alert${unreadCount > 1 ? "s" : ""} in your inbox.` 
              : "No unread alerts. You are completely caught up!"
            }
          </p>
        </div>

        {notifications.length > 0 && (
          <div className="flex gap-2 shrink-0">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={actionLoading}
                className="text-[10px] font-bold transition-colors flex items-center gap-1 cursor-pointer border border-slate-200 px-3 py-1.5 rounded-lg shadow-xs disabled:opacity-50 text-indigo-600 bg-white hover:bg-slate-50"
              >
                {actionLoading ? (
                  <Loader2 size={10} className="animate-spin" />
                ) : (
                  <Check size={10} />
                )}
                Mark All Read
              </button>
            )}
            <button
              onClick={handleClearAll}
              disabled={actionLoading}
              className="text-[10px] font-bold transition-colors flex items-center gap-1 cursor-pointer border border-slate-200 px-3 py-1.5 rounded-lg shadow-xs disabled:opacity-50 text-red-600 bg-white hover:bg-red-50/50"
            >
              Clear All
            </button>
          </div>
        )}
      </div>

      <div className="divide-y divide-slate-100">
        {loading ? (
          <div className="py-12 text-center text-slate-450 flex flex-col items-center justify-center gap-2">
            <Loader2 className="animate-spin text-indigo-600" size={24} />
            <p className="text-xs font-semibold">Loading notifications feed...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-16 text-center flex flex-col items-center justify-center">
            <Bell size={36} className="text-slate-300 mb-2" />
            <p className="text-xs text-slate-400 font-semibold">No notifications yet</p>
            <p className="text-[11px] text-slate-550 mt-1 px-8 leading-relaxed max-w-sm">
              We'll notify you here when you get assigned to projects, tasks, invoices, or receive new messages.
            </p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => handleNotificationClick(notif)}
              className={`p-4 flex gap-4 items-start cursor-pointer transition-colors ${
                notif.read ? "bg-white hover:bg-slate-50/30" : "bg-indigo-50/10 hover:bg-indigo-50/20"
              }`}
            >
              <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${getIconBg(notif.type)}`}>
                {getIcon(notif.type)}
              </div>

              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center justify-between gap-3">
                  <h4 className={`text-xs ${notif.read ? "font-semibold text-slate-700" : "font-bold text-slate-900"}`}>
                    {notif.title}
                  </h4>
                  <span className="text-[10px] font-semibold text-slate-500 shrink-0">
                    {formatTime(notif.createdAt)}
                  </span>
                </div>
                <p className={`text-[11px] leading-relaxed break-words ${notif.read ? "text-slate-550" : "text-slate-700 font-medium"}`}>
                  {notif.message}
                </p>
              </div>

              {/* Individual notification actions */}
              <div className="flex items-center gap-1 opacity-0 hover:opacity-100 group-hover:opacity-100 focus-within:opacity-100 shrink-0 transition-opacity ml-2">
                {!notif.read && (
                  <button
                    onClick={(e) => handleMarkSingleRead(e, notif.id)}
                    className="p-1 rounded text-slate-450 hover:text-indigo-600 hover:bg-slate-100 transition-all cursor-pointer border-none bg-transparent"
                    title="Mark as read"
                   aria-label="Mark as read">
                    <MailOpen size={13} />
                  </button>
                )}
                <button
                  onClick={(e) => handleDeleteSingle(e, notif.id)}
                  className="p-1 rounded text-slate-450 hover:text-red-600 hover:bg-slate-100 transition-all cursor-pointer border-none bg-transparent"
                  title="Delete notification"
                 aria-label="Delete notification">
                  <Trash2 size={13} />
                </button>
              </div>

              {!notif.read && (
                <div className="w-1.5 h-1.5 rounded-full mt-2 shrink-0 self-center" style={{ backgroundColor: "var(--primary-btn, #4F46E5)" }} />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
