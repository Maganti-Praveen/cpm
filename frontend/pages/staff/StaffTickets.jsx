// This file renders the support ticket list and active chat history pane.
// It allows staff members to respond to client support tickets and manage queries.

import React, { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import API from "../../services/api";
import { useToast } from "../../context/ToastContext";
import { 
  Bold, 
  Italic, 
  List, 
  Link as LinkIcon, 
  Paperclip,
  MessageSquare,
  Loader2,
  Eye,
  Clock,
  Lock,
  FileText,
  Download,
  X
} from "lucide-react";

// Formats timestamp strings to short digital time
const formatTimeOnly = (dateStr) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
};

// Returns date categorization string headers like Today or Yesterday
const getChatDateHeader = (dateStr) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (date.toDateString() === today.toDateString()) {
    return "Today";
  } else if (date.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  }
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
};

const getPriorityBadge = (priority) => {
  switch (priority) {
    case "Urgent":
    case "High":
      return "bg-rose-50 text-rose-700 border-rose-100";
    case "Medium":
      return "bg-amber-50 text-amber-700 border-amber-100";
    case "Low":
      return "bg-slate-50 text-slate-600 border-slate-100";
    default:
      return "bg-slate-50 text-slate-600 border-slate-100";
  }
};

const getInitials = (name) => {
  if (!name) return "U";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
};

const renderMessageContent = (text) => {
  if (!text) return "";
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const parts = [];
  let lastIndex = 0;
  let match;
  
  while ((match = linkRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    
    const linkText = match[1];
    const linkUrl = match[2];
    
    parts.push(
      <a
        key={match.index}
        href={linkUrl}
        target="_blank" rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-indigo-650 hover:text-indigo-850 hover:underline font-bold"
      >
        {linkText}
      </a>
    );
    
    lastIndex = linkRegex.lastIndex;
  }
  
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }
  
  return parts.length > 0 ? parts : text;
};

// Helper to parse reply content as structured JSON or fallback to plain text
const parseReplyMessage = (messageStr) => {
  if (!messageStr) return { subject: "Response Update", priority: "", message: "", attachment: null, attachmentName: "" };
  
  let cleanStr = messageStr;
  let isInternal = false;
  if (cleanStr.startsWith("[INTERNAL]")) {
    cleanStr = cleanStr.replace(/^\[INTERNAL\]\s*/, "");
    isInternal = true;
  }

  try {
    const parsed = JSON.parse(cleanStr);
    if (parsed && typeof parsed === "object" && parsed.hasOwnProperty("message")) {
      return {
        subject: parsed.subject || "Response Update",
        priority: parsed.priority || "",
        message: parsed.message || "",
        attachment: parsed.attachment || null,
        attachmentName: parsed.attachmentName || "attachment",
        isInternal
      };
    }
  } catch (e) {
    // Fail silently
  }

  return {
    subject: "Response Update",
    priority: "",
    message: cleanStr,
    attachment: null,
    attachmentName: "",
    isInternal
  };
};

export default function StaffTickets() {
  const { showToast } = useToast();
  const { user: reduxUser } = useSelector((state) => state.auth);

  const [supportTickets, setSupportTickets] = useState([]);
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketReplyText, setTicketReplyText] = useState("");
  const [replySubject, setReplySubject] = useState("");
  const [replyPriority, setReplyPriority] = useState("Medium");
  const [replyAttachment, setReplyAttachment] = useState("");
  const [replyAttachmentName, setReplyAttachmentName] = useState("");
  const [ticketDetailsLoading, setTicketDetailsLoading] = useState(false);
  const [supportMobileTab, setSupportMobileTab] = useState("list");
  const [selectedResponseForModal, setSelectedResponseForModal] = useState(null);
  const [renderLazy, setRenderLazy] = useState(false);
  const threadEndRef = useRef(null);

  useEffect(() => {
    if (threadEndRef.current) {
      threadEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedTicket?.replies]);

  useEffect(() => {
    const id = typeof window.requestIdleCallback === 'function'
      ? window.requestIdleCallback(() => setRenderLazy(true), { timeout: 200 })
      : setTimeout(() => setRenderLazy(true), 80);
    return () => {
      if (typeof window.cancelIdleCallback === 'function') window.cancelIdleCallback(id);
      else clearTimeout(id);
    };
  }, []);

  // Fetches list of tickets from backend
  const fetchTickets = async () => {
    try {
      const res = await API.get("/tickets");
      const rawTickets = res.data?.data || [];
      setSupportTickets(rawTickets);
      if (rawTickets.length > 0 && !selectedTicketId) {
        setSelectedTicketId(rawTickets[0].id);
      }
    } catch (err) {
      console.error("Failed to fetch tickets:", err);
    }
  };

  // Run initial fetch on component mount
  useEffect(() => {
    fetchTickets();
  }, []);

  // Fetch ticket comments and replies when target ticket selection shifts
  useEffect(() => {
    if (!selectedTicketId) return;
    const fetchTicketDetails = async () => {
      try {
        setTicketDetailsLoading(true);
        const res = await API.get(`/tickets/${selectedTicketId}`);
        if (res.data?.success) {
          setSelectedTicket(res.data.data);
        }
      } catch (err) {
        console.error("Error fetching ticket details:", err);
      } finally {
        setTicketDetailsLoading(false);
      }
    };
    fetchTicketDetails();
  }, [selectedTicketId]);

  const handleReplyAttachmentChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast("Attachment must be under 5MB.", "error");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setReplyAttachment(reader.result);
      setReplyAttachmentName(file.name);
    };
    reader.readAsDataURL(file);
  };

  // Submits staff reply to active support ticket
  const handleReplyTicketSubmit = async (e) => {
    e.preventDefault();
    if (!replySubject.trim() || !ticketReplyText.trim() || !selectedTicketId) {
      showToast("Subject and Message fields are required.", "error");
      return;
    }

    const payload = JSON.stringify({
      subject: replySubject,
      priority: replyPriority,
      message: ticketReplyText,
      attachment: replyAttachment || null,
      attachmentName: replyAttachmentName || ""
    });

    try {
      const res = await API.post(`/tickets/${selectedTicketId}/reply`, {
        message: payload
      });
      if (res.data?.success) {
        setSelectedTicket(prev => ({
          ...prev,
          replies: [...(prev?.replies || []), res.data.data]
        }));
        setSupportTickets(prev =>
          prev.map(tk => tk.id === selectedTicketId ? { ...tk, status: "In Progress", priority: replyPriority } : tk)
        );
        setReplySubject("");
        setReplyPriority("Medium");
        setTicketReplyText("");
        setReplyAttachment("");
        setReplyAttachmentName("");
        showToast("Response submitted to client successfully.", "success");
      }
    } catch (err) {
      console.error("Failed to submit ticket reply:", err);
      showToast("Failed to submit reply: " + (err.response?.data?.message || err.message), "error");
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1 text-left">
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Support Desk</h2>
        <p className="text-sm text-slate-550 font-normal">Reply to client queries and configure sandbox integration tickets.</p>
      </div>

      {/* Split Screen Grid Layout */}
      {!renderLazy ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start text-left animate-pulse">
          <div className="space-y-3 lg:col-span-1">
            <div className="h-4 bg-slate-200 rounded w-1/3 mb-2" />
            <div className="h-20 bg-slate-100 rounded-xl" />
            <div className="h-20 bg-slate-100 rounded-xl" />
          </div>
          <div className="lg:col-span-2 h-64 bg-slate-100 rounded-2xl" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start text-left">

          {/* Left ticket logs column */}
          <div className={`space-y-3 lg:col-span-1 ${supportMobileTab === "list" ? "block" : "hidden lg:block"}`}>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">Client Tickets</h3>

            {supportTickets.length === 0 ? (
            <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-400 font-medium">
              No tickets submitted.
            </div>
          ) : (
            supportTickets.map((ticket) => (
              <div
                key={ticket.id}
                onClick={() => {
                  setSelectedTicketId(ticket.id);
                  setSupportMobileTab("detail");
                }}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${selectedTicketId === ticket.id
                    ? "bg-white border-indigo-500 shadow-md ring-1 ring-indigo-500/20"
                    : "bg-white border-slate-200 hover:border-slate-350 hover:bg-slate-50/40"
                  }`}
              >
                <div className="flex justify-between items-start gap-2">
                  <h4 className="text-xs font-bold text-slate-800 leading-tight truncate">{ticket.subject}</h4>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                    ticket.status === "Resolved"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                      : ticket.status === "Closed"
                        ? "bg-slate-50 text-slate-650 border border-slate-100"
                        : ticket.status === "In Progress"
                          ? "bg-indigo-50 text-indigo-700 border border-indigo-100"
                          : "bg-amber-50 text-amber-700 border border-amber-100"
                    }`}>
                    {ticket.status}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium mt-1">Client: {ticket.client?.fullName || "Unknown Client"}</p>
              </div>
            ))
          )}
        </div>

        {/* Right ticket active detail pane */}
        <div className={`lg:col-span-2 bg-white rounded-xl border border-slate-200 px-2 py-4 sm:p-6 flex flex-col h-[550px] shadow-sm overflow-hidden ${supportMobileTab === "detail" ? "block" : "hidden lg:block"}`}>
          {supportTickets.length === 0 ? (
            <div className="text-center text-xs text-slate-400 py-12 font-medium flex-1 flex items-center justify-center">
              No tickets selected.
            </div>
          ) : (
            (() => {
              const ticket = supportTickets.find(t => t.id === selectedTicketId);
              if (!ticket) return null;
              return (
                <div className="flex flex-col h-full overflow-hidden">
                  <div className="border-b border-slate-100 pb-3 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setSupportMobileTab("list")}
                        className="lg:hidden p-1.5 -ml-1 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-705 transition-colors bg-transparent border-none cursor-pointer"
                        title="Back to tickets list"
                       aria-label="Back to tickets list">
                        <svg className="w-5 h-5" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <div>
                        <h3 className="text-sm font-bold text-slate-800">{ticket.subject}</h3>
                        <p className="text-[11px] text-slate-400 mt-0.5">Submitted by {ticket.client?.fullName || "Unknown Client"}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                      ticket.status === "Resolved"
                        ? "bg-emerald-100 text-emerald-800"
                        : ticket.status === "Closed"
                          ? "bg-slate-100 text-slate-700"
                          : ticket.status === "In Progress"
                            ? "bg-indigo-100 text-indigo-800"
                            : "bg-amber-100 text-amber-800"
                      }`}>
                      Status: {ticket.status}
                    </span>
                  </div>

                  {/* Chat thread history */}
                  <div className="flex-1 overflow-y-auto p-4 sm:p-5 my-3 bg-slate-50/30 space-y-6 text-xs no-scrollbar rounded-xl border border-slate-100 text-left">
                    {ticketDetailsLoading ? (
                      <div className="text-center py-12 text-slate-400 flex items-center justify-center gap-1.5">
                        <Loader2 className="animate-spin text-indigo-500" size={14} />
                        <span className="text-xs font-semibold">Loading conversation thread...</span>
                      </div>
                    ) : (
                      <div className="space-y-4 w-full">
                        {/* Original Support Request represented as the first message bubble */}
                        <div className="bg-white border border-slate-100 rounded-xl p-4.5 shadow-2xs hover:border-indigo-400/60 hover:shadow-xs transition-all flex flex-col gap-3.5 text-left relative">
                          <div className="flex items-center justify-between gap-2 border-b border-slate-50 pb-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full text-white font-bold text-[10px] flex items-center justify-center shadow-2xs shrink-0 bg-indigo-500">
                                {getInitials(ticket.client?.fullName)}
                              </div>
                              <div>
                                <span className="font-bold text-slate-800 text-xs">{ticket.client?.fullName || "Client"}</span>
                                <span className="ml-2 text-[8px] font-extrabold px-1.5 py-0.5 rounded border uppercase bg-blue-50 text-blue-700 border-blue-100">
                                  Client (Creator)
                                </span>
                              </div>
                            </div>
                            <span className="text-[9px] font-bold text-slate-400 flex items-center gap-0.5">
                              <Clock size={9} />
                              {new Date(ticket.createdAt).toLocaleString()}
                            </span>
                          </div>

                          {/* Subject, Category & Priority info inside the initial description box */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50/50 p-2.5 rounded-lg border border-slate-100 text-[10px] font-bold text-slate-705 text-left">
                            <div>
                              <span className="block text-[8px] text-slate-400 uppercase mb-0.5">Subject</span>
                              <span className="text-slate-900">{ticket.subject}</span>
                            </div>
                            <div>
                              <span className="block text-[8px] text-slate-400 uppercase mb-0.5">Category</span>
                              <span className="text-slate-900">{ticket.category || "Technical"}</span>
                            </div>
                            <div>
                              <span className="block text-[8px] text-slate-400 uppercase mb-0.5">Priority</span>
                              <span className={`px-1.5 py-0.5 rounded border uppercase text-[9px] ${getPriorityBadge(ticket.priority)}`}>
                                {ticket.priority || "Medium"}
                              </span>
                            </div>
                          </div>

                          <div 
                            className="text-xs text-slate-700 font-medium leading-relaxed whitespace-pre-wrap select-text break-words prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{ __html: ticket.description || "" }}
                          />

                          {ticket.attachment && (
                            <div className="border-t border-slate-50 pt-3 flex flex-col gap-1.5 text-left">
                              <span className="block text-[8px] text-slate-400 font-bold uppercase tracking-wider">Attachment</span>
                              {(() => {
                                let fileName = "Attachment";
                                let fileData = "";
                                try {
                                  const att = JSON.parse(ticket.attachment);
                                  fileName = att.name;
                                  fileData = att.data;
                                } catch (e) {
                                  fileData = ticket.attachment;
                                }
                                
                                return (
                                  <div className="flex flex-wrap items-center gap-2">
                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[10px] text-slate-750 font-bold select-none shadow-xs">
                                      <FileText size={12} className="text-slate-400" />
                                      <span className="truncate max-w-[130px]">{fileName}</span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const link = document.createElement("a");
                                        link.href = fileData;
                                        link.download = fileName;
                                        link.click();
                                      }}
                                      className="inline-flex items-center justify-center p-1.5 bg-white border border-slate-200 rounded-xl hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-650 text-slate-500 cursor-pointer transition-colors shadow-xs"
                                      title="Download document"
                                    >
                                      <Download size={12} />
                                    </button>
                                  </div>
                                );
                              })()}
                            </div>
                          )}
                        </div>

                        {selectedTicket?.replies?.map((reply) => {
                          const isClientReply = reply.user?.role === "CLIENT";
                          const parsedReply = parseReplyMessage(reply.message);

                          // Internal notes handling (if any, though usually staff see them as amber cards in admin view, let's keep it simple here)
                          if (parsedReply.isInternal) {
                            return (
                              <div 
                                key={reply.id} 
                                onClick={() => setSelectedResponseForModal(reply)}
                                className="bg-amber-50/40 border border-amber-205 rounded-xl p-4 shadow-2xs hover:border-amber-400 hover:shadow-xs transition-all cursor-pointer flex flex-col gap-2 text-left relative"
                              >
                                <div className="flex items-center justify-between gap-2 border-b border-amber-100 pb-2">
                                  <div className="flex items-center gap-2">
                                    <Lock size={10} className="text-amber-600" />
                                    <span className="font-bold text-slate-800 text-xs">{reply.user?.fullName}</span>
                                    <span className="text-[8px] font-extrabold px-1.5 py-0.5 rounded border border-amber-200 bg-amber-100 text-amber-700 uppercase">INTERNAL NOTE</span>
                                  </div>
                                  <span className="text-[9px] font-medium text-amber-500 flex items-center gap-0.5">
                                    <Clock size={9} />
                                    {new Date(reply.createdAt).toLocaleString()}
                                  </span>
                                </div>
                                <div className="space-y-1">
                                  <h4 className="text-xs font-bold text-amber-900 truncate">
                                    {parsedReply.subject || "Internal Note"}
                                  </h4>
                                  <p className="text-xs text-amber-800 font-medium line-clamp-2">
                                    {parsedReply.message}
                                  </p>
                                </div>
                                <div className="flex justify-end pt-1 border-t border-amber-100/50 mt-1">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedResponseForModal(reply);
                                    }}
                                    className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 hover:text-amber-800 bg-transparent border-none p-0 cursor-pointer"
                                  >
                                    <Eye size={11} />
                                    <span>Open Note</span>
                                  </button>
                                </div>
                              </div>
                            );
                          }

                          return (
                            <div 
                              key={reply.id} 
                              onClick={() => setSelectedResponseForModal(reply)}
                                className="bg-white border border-slate-100 rounded-xl p-4 shadow-2xs hover:border-indigo-400/60 hover:shadow-xs transition-all cursor-pointer flex flex-col gap-3 text-left relative group"
                              >
                                <div className="flex items-center justify-between gap-2 border-b border-slate-50 pb-2.5">
                                  <div className="flex items-center gap-2.5 text-left">
                                    <div className={`w-7 h-7 rounded-full text-white font-bold text-[10px] flex items-center justify-center shadow-2xs shrink-0 ${
                                      isClientReply ? "bg-indigo-500" : "bg-emerald-600"
                                    }`}>
                                      {reply.user?.fullName ? reply.user.fullName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "US"}
                                    </div>
                                    <div>
                                      <span className="font-bold text-slate-800 text-xs">{reply.user?.fullName}</span>
                                      <span className={`ml-2 text-[8px] font-extrabold px-1.5 py-0.5 rounded border uppercase ${
                                        isClientReply ? "bg-blue-50 text-blue-700 border-blue-100" : "bg-emerald-50 text-emerald-700 border-emerald-100"
                                      }`}>
                                        {reply.user?.role || "Staff"}
                                      </span>
                                    </div>
                                  </div>
                                  <span className="text-[9px] font-bold text-slate-400 flex items-center gap-0.5">
                                    <Clock size={9} />
                                    {new Date(reply.createdAt).toLocaleString()}
                                  </span>
                                </div>

                                <div className="space-y-1">
                                  <div className="flex items-center justify-between gap-1.5">
                                    <h4 className="text-xs font-bold text-slate-900 truncate">
                                      {parsedReply.subject || "Response Update"}
                                    </h4>
                                    {parsedReply.priority && (
                                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border uppercase ${getPriorityBadge(parsedReply.priority)}`}>
                                        {parsedReply.priority}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-xs text-slate-650 font-medium leading-relaxed line-clamp-3 select-none text-left">
                                    {parsedReply.message}
                                  </div>
                                </div>

                                {parsedReply.attachment && (
                                  <div className="flex items-center gap-1 text-[10px] text-slate-450 font-bold mt-1">
                                    <Paperclip size={10} className="text-slate-405" />
                                    <span className="truncate max-w-[200px] text-slate-405">{parsedReply.attachmentName || "Attachment"}</span>
                                  </div>
                                )}

                                <div className="flex justify-end pt-1 border-t border-slate-50/50 mt-1">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedResponseForModal(reply);
                                    }}
                                    className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-650 hover:text-indigo-855 bg-transparent border-none p-0 cursor-pointer"
                                  >
                                    <Eye size={12} />
                                    <span>Open Response</span>
                                  </button>
                                </div>
                              </div>
                            );
                          })}

                        {/* 3. Post Response / Update Ticket Card */}
                        {ticket.status === "Closed" ? (
                          <div className="bg-slate-100 border border-slate-200 rounded-2xl p-5 text-center text-xs text-slate-550 font-bold select-none mt-6 shadow-2xs shrink-0">
                            This ticket has been closed and cannot receive further replies.
                          </div>
                        ) : (
                          <form onSubmit={handleReplyTicketSubmit} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 mt-6 text-left shrink-0">
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-display">Post Response</h3>
                              <span className="text-[10px] text-slate-400 font-medium">Add an update to this support ticket</span>
                            </div>

                            <div className="space-y-3.5">
                              {/* Subject */}
                              <div className="space-y-1.5 text-xs font-semibold text-slate-700">
                                <label className="block text-slate-700">Response Subject</label>
                                <input 
                                  type="text" 
                                  required
                                  value={replySubject}
                                  onChange={(e) => setReplySubject(e.target.value)}
                                  placeholder="Enter summary/subject of response..." 
                                  aria-label="Response Subject"
                                  className="w-full h-9 px-3 border border-slate-200 bg-white text-slate-900 rounded-lg outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-semibold text-xs"
                                />
                              </div>

                              {/* Priority */}
                              <div className="space-y-1.5 text-xs font-semibold text-slate-700">
                                <label className="block text-slate-700">Update Priority</label>
                                <select
                                  value={replyPriority}
                                  onChange={(e) => setReplyPriority(e.target.value)}
                                  aria-label="Update Priority"
                                  className="w-full h-9 px-3 border border-slate-200 bg-white text-slate-900 rounded-lg outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all cursor-pointer font-semibold text-xs"
                                >
                                  <option value="Low">Low</option>
                                  <option value="Medium">Medium</option>
                                  <option value="High">High</option>
                                </select>
                              </div>

                              {/* Message Textarea */}
                              <div className="space-y-1.5 text-xs font-semibold text-slate-700">
                                <label className="block text-slate-700">Message</label>
                                <textarea 
                                  required
                                  value={ticketReplyText}
                                  onChange={(e) => setTicketReplyText(e.target.value)}
                                  rows={3}
                                  placeholder="Type details of your response update here..." 
                                  className="w-full p-3 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-semibold text-xs resize-none bg-white text-slate-800"
                                />
                              </div>

                              {/* Optional Attachment */}
                              <div className="space-y-1.5 text-xs font-semibold text-slate-705 text-left">
                                <label className="block text-slate-700 font-bold">Attachment (Optional)</label>
                                <div className="flex items-center gap-3">
                                  <label 
                                    htmlFor="staff-reply-ticket-file"
                                    className="px-3 py-1.5 border border-slate-200 hover:border-slate-350 bg-white text-slate-700 rounded-lg cursor-pointer shadow-xs font-bold transition-all hover:bg-slate-50 flex items-center gap-1 text-[11px] select-none"
                                  >
                                    <Paperclip size={12} />
                                    <span>Choose File</span>
                                  </label>
                                  <input 
                                    type="file" 
                                    id="staff-reply-ticket-file" 
                                    onChange={handleReplyAttachmentChange}
                                    className="hidden" 
                                  />
                                  
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <span className="text-[11px] text-slate-400 truncate max-w-[150px]">
                                      {replyAttachment ? replyAttachmentName : "No file chosen (Max 5MB)"}
                                    </span>
                                    {replyAttachment && (
                                      <button
                                        type="button"
                                        onClick={() => { setReplyAttachment(""); setReplyAttachmentName(""); }}
                                        className="p-1 hover:bg-slate-100 hover:text-rose-600 rounded text-slate-400 border-none bg-transparent cursor-pointer transition-colors"
                                        title="Remove attachment"
                                      >
                                        <X size={12} />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Submit Actions */}
                              <div className="flex flex-wrap items-center justify-end gap-3 pt-2 border-t border-slate-100">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setReplySubject("");
                                    setReplyPriority("Medium");
                                    setTicketReplyText("");
                                    setReplyAttachment("");
                                    setReplyAttachmentName("");
                                  }}
                                  className="px-3 py-1.5 text-[11px] font-bold text-slate-500 hover:text-slate-800 rounded-lg cursor-pointer bg-transparent border-none transition-colors"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="submit"
                                  className="px-4.5 py-2 text-[11px] font-bold rounded-lg cursor-pointer transition-colors border-none shadow-xs bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1"
                                >
                                  <span>Send Response</span>
                                </button>
                              </div>
                            </div>
                          </form>
                        )}
                        <div ref={threadEndRef} />
                      </div>
                    )}
                  </div>
                </div>
              );
            })()
          )}
        </div>
      </div>
    )}

      {/* Response Detail Modal */}
      {selectedResponseForModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in text-left"
          onClick={() => setSelectedResponseForModal(null)}
        >
          <div 
            className="bg-white w-full max-w-2xl rounded-2xl shadow-xl flex flex-col overflow-hidden border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <MessageSquare size={16} className="text-indigo-650" />
                <h3 className="font-display font-bold text-slate-905 text-sm">Response Detail</h3>
              </div>
              <button 
                onClick={() => setSelectedResponseForModal(null)}
                aria-label="Close response modal"
                className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-650 transition-colors border-none bg-transparent cursor-pointer font-bold text-lg"
              >
                &times;
              </button>
            </div>
            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-4 max-h-[70vh] text-left">
              {(() => {
                const parsedReply = parseReplyMessage(selectedResponseForModal.message);
                return (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full text-white font-bold text-xs flex items-center justify-center shadow-xs ${
                          selectedResponseForModal.user?.role === "CLIENT" ? "bg-indigo-500" : "bg-emerald-600"
                        }`}>
                          {selectedResponseForModal.user?.fullName ? selectedResponseForModal.user.fullName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "US"}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-xs">{selectedResponseForModal.user?.fullName}</h4>
                          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                            {selectedResponseForModal.user?.role || "Staff"} • {new Date(selectedResponseForModal.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {parsedReply.isInternal && (
                          <span className="text-[9px] font-extrabold px-2.5 py-0.5 rounded-full border border-amber-200 bg-amber-50 text-amber-700 uppercase">
                            Internal
                          </span>
                        )}
                        {parsedReply.priority && (
                          <span className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full border uppercase ${getPriorityBadge(parsedReply.priority)}`}>
                            {parsedReply.priority} Priority
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-3 select-text text-left">
                      <h3 className="text-sm font-extrabold text-slate-905">{parsedReply.subject || "Response Update"}</h3>
                      <div 
                        className="text-xs text-slate-705 font-medium leading-relaxed whitespace-pre-wrap select-text break-words prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: parsedReply.message || "" }}
                      />
                    </div>

                    {parsedReply.attachment && (
                      <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <Paperclip size={14} className="text-slate-400 shrink-0" />
                          <span className="text-xs text-slate-500 font-semibold truncate max-w-[300px]">{parsedReply.attachmentName}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const link = document.createElement("a");
                            link.href = parsedReply.attachment;
                            link.download = parsedReply.attachmentName || "attachment";
                            link.click();
                          }}
                          className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg text-xs font-bold transition-colors shadow-2xs inline-flex items-center gap-1.5 cursor-pointer border-none"
                        >
                          <Download size={12} />
                          Download File
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-100 flex justify-end bg-slate-50/50">
              <button
                onClick={() => setSelectedResponseForModal(null)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-750 rounded-xl text-xs font-bold transition-all cursor-pointer bg-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
