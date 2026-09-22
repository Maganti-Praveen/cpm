import { useToast } from '../../context/ToastContext';
// Support helpdesk listing client inquiries, priority statuses, and reply options.
// Handles support workflows.


import React, { useState, useEffect, useRef, Fragment } from "react";
import { 
  MessageSquare, 
  Loader2, 
  Search, 
  Send, 
  User, 
  Calendar, 
  Tag, 
  AlertCircle, 
  Plus, 
  Check, 
  MoreVertical, 
  Lock, 
  Paperclip, 
  Bold, 
  Italic, 
  List, 
  Link as LinkIcon, 
  FileText, 
  Download, 
  ChevronDown, 
  UserCheck, 
  RefreshCw,
  Clock,
  Eye,
  X
} from "lucide-react";
import * as ticketService from "../../services/ticketService";
import * as clientService from "../../services/clientService";
import * as authService from "../../services/authService";
import { useSelector } from "react-redux";

// Helper to render markdown links and base64 attachments in messages
const renderMessageContent = (text, onPreview) => {
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
    const isAttachment = linkUrl.startsWith("data:");
    
    if (isAttachment) {
      parts.push(
        <button
          key={match.index}
          type="button"
          onClick={() => {
            if (onPreview) {
              onPreview({ name: linkText, data: linkUrl });
            }
          }}
          className="inline-flex items-center gap-1 text-indigo-650 hover:text-indigo-850 hover:underline font-bold bg-transparent border-none p-0 cursor-pointer text-left"
        >
          <FileText size={12} className="inline mr-0.5" />
          {linkText}
          <Eye size={10} className="inline ml-1 text-slate-400" />
        </button>
      );
    } else {
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
    }
    
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

const formatTimeOnly = (dateStr) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
};

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

// Renders helpdesk ticket logs interface and support message editor columns
function AdminSupport() {
  const { showToast } = useToast();
  const { user } = useSelector((state) => state.auth);
  const [previewFile, setPreviewFile] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Open"); // 'Open', 'Pending', 'Closed'

  // Selection & Reply State
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketDetailsLoading, setTicketDetailsLoading] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replySubject, setReplySubject] = useState("");
  const [replyPriority, setReplyPriority] = useState("Medium");
  const [replyAttachment, setReplyAttachment] = useState("");
  const [replyAttachmentName, setReplyAttachmentName] = useState("");
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [replyLoading, setReplyLoading] = useState(false);

  // Lists for dropdowns
  const [staffAndAdmins, setStaffAndAdmins] = useState([]);
  const [clients, setClients] = useState([]);

  // Active Dropdowns
  const [showAssignDropdown, setShowAssignDropdown] = useState(false);
  const [showOptionsDropdown, setShowOptionsDropdown] = useState(false);

  // Modals
  const [isNewTicketModalOpen, setIsNewTicketModalOpen] = useState(false);
  const [newTicketLoading, setNewTicketLoading] = useState(false);
  const [newTicketData, setNewTicketData] = useState({
    clientId: "",
    subject: "",
    category: "Technical",
    priority: "Medium",
    description: "",
    attachment: ""
  });
  const [newTicketErrors, setNewTicketErrors] = useState({});
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [selectedResponseForModal, setSelectedResponseForModal] = useState(null);

  const threadEndRef = useRef(null);
  const chatThreadContainerRef = useRef(null);
  const assignDropdownRef = useRef(null);
  const optionsDropdownRef = useRef(null);

  // Fetch all tickets on mount and set up periodic refresh with cleanup
  useEffect(() => {
    fetchTickets();
    fetchStaffAndAdmins();
    fetchClients();

    const intervalId = setInterval(() => {
      fetchTickets();
    }, 30000);

    return () => clearInterval(intervalId);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (assignDropdownRef.current && !assignDropdownRef.current.contains(event.target)) {
        setShowAssignDropdown(false);
      }
      if (optionsDropdownRef.current && !optionsDropdownRef.current.contains(event.target)) {
        setShowOptionsDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Scroll to bottom of conversation thread
  useEffect(() => {
    if (selectedTicket && chatThreadContainerRef.current) {
      chatThreadContainerRef.current.scrollTo({
        top: chatThreadContainerRef.current.scrollHeight,
        behavior: "smooth"
      });
    } else if (selectedTicket) {
      threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedTicket]);

  // Load ticket details when selected ID changes
  useEffect(() => {
    if (!selectedTicketId) {
      setSelectedTicket(null);
      return;
    }
    // Fetches message threads updates matched to active ticket item
  const fetchTicketDetails = async () => {
      try {
        setTicketDetailsLoading(true);
        const res = await ticketService.getTicketById(selectedTicketId);
        if (res.success) {
          setSelectedTicket(res.data);
        }
      } catch (err) {
        console.error("Error fetching ticket details:", err);
      } finally {
        setTicketDetailsLoading(false);
      }
    };
    fetchTicketDetails();
  }, [selectedTicketId]);

  // Queries lists of active ticket records with pagination filters
  const fetchTickets = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await ticketService.getTickets();
      if (res.success) {
        setTickets(res.data);
        if (res.data.length > 0 && !selectedTicketId) {
          setSelectedTicketId(res.data[0].id);
        }
      } else {
        setError(res.message || "Failed to load support tickets.");
      }
    } catch (err) {
      setError(err.message || "An error occurred fetching tickets.");
    } finally {
      setLoading(false);
    }
  };

  // Resolves administrator profiles list for assignment options
  const fetchStaffAndAdmins = async () => {
    try {
      const [staffRes, adminRes] = await Promise.all([
        authService.getUsers({ role: "STAFF" }),
        authService.getUsers({ role: "ADMIN" })
      ]);
      const staffList = staffRes.data?.data || [];
      const adminList = adminRes.data?.data || [];
      setStaffAndAdmins([...adminList, ...staffList]);
    } catch (err) {
      console.error("Failed to load staff/admins:", err);
    }
  };

  // Loads list of clients for portal support references
  const fetchClients = async () => {
    try {
      const res = await clientService.getClients();
      if (res.data?.success || res.data?.data) {
        setClients(res.data.data || []);
      }
    } catch (err) {
      console.error("Failed to load clients:", err);
    }
  };

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

  // Posts messages replies to the active support ticket conversation
  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replySubject.trim() || !replyText.trim() || !selectedTicketId) {
      showToast("Subject and Message fields are required.", "error");
      return;
    }

    const payload = JSON.stringify({
      subject: replySubject,
      priority: replyPriority,
      message: replyText,
      attachment: replyAttachment || null,
      attachmentName: replyAttachmentName || ""
    });

    try {
      setReplyLoading(true);
      const res = await ticketService.replyToTicket(selectedTicketId, payload, isInternalNote);
      if (res.success) {
        // Add new reply to local list
        setSelectedTicket((prev) => ({
          ...prev,
          replies: [...(prev?.replies || []), res.data]
        }));
        
        // Update ticket in left list to reflect status update and updatedAt
        const newStatus = isInternalNote ? (selectedTicket?.status || "Open") : "In Progress";
        setTickets((prevList) =>
          prevList.map((t) =>
            t.id === selectedTicketId ? { ...t, status: newStatus, priority: replyPriority, updatedAt: new Date().toISOString() } : t
          )
        );

        if (selectedTicket) {
          setSelectedTicket(prev => ({
            ...prev,
            status: newStatus,
            priority: replyPriority
          }));
        }

        setReplySubject("");
        setReplyPriority("Medium");
        setReplyText("");
        setReplyAttachment("");
        setReplyAttachmentName("");
        setIsInternalNote(false);
        showToast(isInternalNote ? "Internal note added successfully!" : "Response posted successfully!", "success");
      }
    } catch (err) {
      console.error("Failed to submit reply:", err);
      showToast("Failed to submit response: " + err.message, "error");
    } finally {
      setReplyLoading(false);
    }
  };

  // Updates active status flags on active ticket
  const handleUpdateStatus = async (status) => {
    if (!selectedTicketId) return;
    try {
      const res = await ticketService.updateTicket(selectedTicketId, { status });
      if (res.success) {
        setTickets((prevList) =>
          prevList.map((t) => (t.id === selectedTicketId ? { ...t, status } : t))
        );
        setSelectedTicket((prev) => (prev ? { ...prev, status } : null));
        setShowOptionsDropdown(false);
      }
    } catch (err) {
      showToast("Failed to update status: " + err.message, "error");
    }
  };

  // Adjusts priority tier levels assigned to support ticket
  const handleUpdatePriority = async (priority) => {
    if (!selectedTicketId) return;
    try {
      const res = await ticketService.updateTicket(selectedTicketId, { priority });
      if (res.success) {
        setTickets((prevList) =>
          prevList.map((t) => (t.id === selectedTicketId ? { ...t, priority } : t))
        );
        setSelectedTicket((prev) => (prev ? { ...prev, priority } : null));
        setShowOptionsDropdown(false);
      }
    } catch (err) {
      showToast("Failed to update priority: " + err.message, "error");
    }
  };

  // Re-assigns active ticket to targeted staff support member
  const handleAssign = async (assigneeId) => {
    if (!selectedTicketId) return;
    try {
      const res = await ticketService.updateTicket(selectedTicketId, { assigneeId });
      if (res.success) {
        const assignedUser = staffAndAdmins.find(u => u.id === Number(assigneeId));
        setTickets((prevList) =>
          prevList.map((t) => (t.id === selectedTicketId ? { ...t, assigneeId, assignee: assignedUser } : t))
        );
        setSelectedTicket((prev) => (prev ? { ...prev, assigneeId, assignee: assignedUser } : null));
        setShowAssignDropdown(false);
      }
    } catch (err) {
      showToast("Failed to assign ticket: " + err.message, "error");
    }
  };

  // Submits support form properties to build tickets logs
  const handleCreateTicket = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!newTicketData.clientId) errors.clientId = "Client selection is required.";
    if (!newTicketData.subject.trim()) errors.subject = "Subject is required.";
    if (!newTicketData.description.trim()) errors.description = "Description is required.";

    if (Object.keys(errors).length > 0) {
      setNewTicketErrors(errors);
      return;
    }

    try {
      setNewTicketLoading(true);
      const res = await ticketService.createTicket({
        clientId: Number(newTicketData.clientId),
        subject: newTicketData.subject,
        category: newTicketData.category,
        priority: newTicketData.priority,
        description: newTicketData.description,
        attachment: newTicketData.attachment || null
      });

      if (res.success) {
        setIsNewTicketModalOpen(false);
        setNewTicketData({
          clientId: "",
          subject: "",
          category: "Technical",
          priority: "Medium",
          description: "",
          attachment: ""
        });
        setNewTicketErrors({});
        setShowSuccessPopup(true);
        fetchTickets(); // Refresh ticket list
        setSelectedTicketId(res.data.id);
      }
    } catch (err) {
      console.error(err);
      setNewTicketErrors({ global: err.message || "Failed to create ticket." });
    } finally {
      setNewTicketLoading(false);
    }
  };

  // Convert attachment to base64
  const handleAttachmentChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setNewTicketErrors(prev => ({ ...prev, attachment: "Attachment must be under 5MB." }));
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setNewTicketData(prev => ({
        ...prev,
        attachment: JSON.stringify({ name: file.name, data: reader.result })
      }));
      setNewTicketErrors(prev => ({ ...prev, attachment: null }));
    };
    reader.readAsDataURL(file);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Open":
        return "bg-sky-50 text-sky-700 border-sky-100";
      case "In Progress":
        return "bg-indigo-50 text-indigo-700 border-indigo-100";
      case "Resolved":
        return "bg-emerald-50 text-emerald-700 border-emerald-100";
      case "Closed":
        return "bg-slate-100 text-slate-600 border-slate-200";
      default:
        return "bg-slate-50 text-slate-600 border-slate-100";
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case "Urgent":
      case "High":
        return "bg-rose-50 text-rose-700 border-rose-100";
      case "Medium":
        return "bg-amber-50 text-amber-750 border-amber-100";
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

  const getRelativeTime = (dateStr) => {
    if (!dateStr) return "";
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHr / 24);

    if (diffSec < 60) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    if (diffDays === 1) return "Yesterday";
    return `${diffDays}d ago`;
  };

  // Dynamically count for status tabs
  const openCount = tickets.filter(t => t.status === "Open" || t.status === "In Progress").length;
  const pendingCount = tickets.filter(t => t.status === "Pending").length;
  const closedCount = tickets.filter(t => t.status === "Closed" || t.status === "Resolved").length;

  // Filter list
  const filteredTickets = tickets.filter((t) => {
    // Search filter
    const matchesSearch = 
      t.subject.toLowerCase().includes(searchQuery.toLowerCase()) || 
      String(t.id).includes(searchQuery) ||
      (t.client?.fullName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.client?.company || "").toLowerCase().includes(searchQuery.toLowerCase());

    // Status Tab filter
    let matchesStatus = false;
    if (statusFilter === "Open") {
      matchesStatus = t.status === "Open" || t.status === "In Progress";
    } else if (statusFilter === "Pending") {
      matchesStatus = t.status === "Pending";
    } else if (statusFilter === "Closed") {
      matchesStatus = t.status === "Closed" || t.status === "Resolved";
    }

    return matchesSearch && matchesStatus;
  });

  const activeTicket = tickets.find((t) => t.id === selectedTicketId) || selectedTicket;

  return (
    <div className="flex flex-col min-h-[calc(100vh-8.5rem)] lg:h-[calc(100vh-8.5rem)] font-sans antialiased text-slate-800">
      
      {/* Top Bar / Actions Header inside panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 shrink-0">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 font-display">Support Tickets</h2>
          <p className="text-xs text-slate-500 font-medium">Manage and resolve client queries, assign tickets, and log internal notes.</p>
        </div>
      </div>

      {/* Main Workspace: Split View */}
      <div className="flex flex-col lg:flex-row flex-1 lg:overflow-hidden mt-4 gap-5 items-stretch">
        
        {/* ================= MIDDLE COLUMN: TICKETS LIST ================= */}
        <div className="w-full lg:w-[350px] shrink-0 bg-white border border-slate-200 rounded-2xl flex flex-col overflow-hidden shadow-xs h-[400px] lg:h-auto">
          
          {/* List Search */}
          <div className="p-4 border-b border-slate-100">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Search size={15} />
              </span>
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tickets..." 
                className="w-full h-9 pl-9 pr-3.5 text-xs bg-[#F8FAFC] border border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 text-slate-900 rounded-lg outline-none transition-all placeholder-slate-400 font-semibold"
               aria-label="Search tickets..."/>
            </div>
          </div>

          {/* List Header */}
          <div className="px-4 py-3 flex items-center justify-between border-b border-slate-100">
            <span className="text-xs font-bold text-slate-900">Support Tickets</span>
            <button
              onClick={() => setIsNewTicketModalOpen(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold rounded-lg cursor-pointer transition-colors shadow-sm"
            >
              <Plus size={11} strokeWidth={3} />
              <span>New Ticket</span>
            </button>
          </div>

          {/* Tabs */}
          <div className="px-4 py-2 bg-slate-50/50 flex border-b border-slate-100 gap-1.5">
            <button
              onClick={() => setStatusFilter("Open")}
              className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg cursor-pointer transition-all border-none ${
                statusFilter === "Open" 
                  ? "bg-indigo-600 text-white shadow-xs" 
                  : "bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              }`}
            >
              Open ({openCount})
            </button>
            <button
              onClick={() => setStatusFilter("Pending")}
              className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg cursor-pointer transition-all border-none ${
                statusFilter === "Pending" 
                  ? "bg-indigo-600 text-white shadow-xs" 
                  : "bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              }`}
            >
              Pending ({pendingCount})
            </button>
            <button
              onClick={() => setStatusFilter("Closed")}
              className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg cursor-pointer transition-all border-none ${
                statusFilter === "Closed" 
                  ? "bg-indigo-600 text-white shadow-xs" 
                  : "bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              }`}
            >
              Closed ({closedCount})
            </button>
          </div>

          {/* Ticket Cards List (Scrollable) */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 no-scrollbar bg-slate-50/30">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <Loader2 className="animate-spin text-indigo-600 mb-2" size={24} />
                <span className="text-[11px] font-medium">Loading tickets...</span>
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="py-20 text-center text-slate-400">
                <MessageSquare className="mx-auto text-slate-300 mb-2" size={24} />
                <p className="text-[11px] font-bold text-slate-500">No tickets found</p>
                <p className="text-[9px] mt-0.5">Change tab or refine search query.</p>
              </div>
            ) : (
              filteredTickets.map((ticket) => {
                const isActive = selectedTicketId === ticket.id;
                return (
                  <div
                    key={ticket.id}
                    onClick={() => setSelectedTicketId(ticket.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer text-left select-none relative ${
                      isActive
                        ? "bg-white border-slate-200/90 shadow-md ring-1 ring-indigo-500/10 border-l-[3.5px] border-l-indigo-600"
                        : "bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50/20"
                    }`}
                  >
                    <div className="flex justify-between items-start gap-1">
                      <span className="text-[11px] font-bold text-indigo-600">#TCK-{ticket.id}</span>
                      <span className="text-[9px] font-medium text-slate-400 flex items-center gap-0.5">
                        <Clock size={9} />
                        {getRelativeTime(ticket.createdAt)}
                      </span>
                    </div>
                    
                    <h4 className="text-xs font-bold text-slate-800 leading-tight mt-1.5 truncate">
                      {ticket.subject}
                    </h4>

                    <p className="text-[11px] text-slate-400 font-semibold mt-1 truncate">
                      {ticket.client?.company || "Independent"} • Reported by {ticket.client?.fullName || "Client"}
                    </p>

                    <div className="flex items-center gap-1.5 mt-3">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase ${getPriorityBadge(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase ${getStatusBadge(ticket.status)}`}>
                        {ticket.status}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ================= RIGHT COLUMN: CONVERSATION & WORKSPACE ================= */}
        <div className="flex-1 bg-white border border-slate-200 rounded-2xl flex flex-col overflow-hidden shadow-xs relative h-[500px] lg:h-auto">
          
          {!selectedTicketId ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-12">
              <MessageSquare className="text-slate-200 mb-3" size={48} />
              <p className="text-sm font-bold text-slate-600">Select a ticket</p>
              <p className="text-xs mt-0.5">Choose a support ticket from the list to view its conversation timeline.</p>
            </div>
          ) : (
            <>
              {/* Ticket Header & Metadata */}
              <div className="px-6 py-4.5 border-b border-slate-100 flex flex-col xl:flex-row xl:items-center justify-between gap-4 shrink-0 bg-white z-10">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900 truncate font-display">
                      {activeTicket?.subject}
                    </h3>
                  </div>
                  <p className="text-[11px] text-slate-400 font-semibold mt-0.5 truncate">
                    #TCK-{activeTicket?.id} • {activeTicket?.client?.company || "Independent"}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {/* Priority badge */}
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase ${getPriorityBadge(activeTicket?.priority)}`}>
                    {activeTicket?.priority} Priority
                  </span>

                  {/* Assignee button */}
                  <div className="relative" ref={assignDropdownRef}>
                    <button
                      onClick={() => setShowAssignDropdown(!showAssignDropdown)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700 cursor-pointer transition-colors outline-none"
                    >
                      <UserCheck size={12} className="text-slate-500" />
                      <span>{activeTicket?.assignee ? activeTicket.assignee.fullName : "Assign"}</span>
                      <ChevronDown size={11} className="text-slate-400 ml-0.5" />
                    </button>

                    {showAssignDropdown && (
                      <div className="absolute right-0 mt-1 w-48 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-20 max-h-56 overflow-y-auto text-left animate-fade-in no-scrollbar">
                        <div className="px-2.5 py-1 text-[9px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-50 pb-1.5 mb-1">
                          Assign Support Agent
                        </div>
                        <button
                          onClick={() => handleAssign(null)}
                          className="w-full px-3 py-1.5 text-xs text-rose-600 hover:bg-slate-50 text-left font-semibold cursor-pointer border-none flex items-center justify-between"
                        >
                          Unassigned
                          {!activeTicket?.assignee && <Check size={11} className="text-rose-500" />}
                        </button>
                        {staffAndAdmins.map((user) => (
                          <button
                            key={user.id}
                            onClick={() => handleAssign(user.id)}
                            className="w-full px-3 py-1.5 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-900 text-left font-semibold cursor-pointer border-none flex items-center justify-between"
                          >
                            <div>
                              <span>{user.fullName}</span>
                              <span className="text-[8px] bg-slate-100 text-slate-505 px-1 rounded ml-1.5 font-bold uppercase">{user.role}</span>
                            </div>
                            {activeTicket?.assignee?.id === user.id && <Check size={11} className="text-indigo-600" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Resolve button */}
                  <button
                    onClick={() => handleUpdateStatus(activeTicket?.status === "Resolved" ? "In Progress" : "Resolved")}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer transition-colors border outline-none shadow-xs ${
                      activeTicket?.status === "Resolved" || activeTicket?.status === "Closed"
                        ? "bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200"
                        : "bg-slate-900 hover:bg-black text-white border-transparent"
                    }`}
                  >
                    {activeTicket?.status === "Resolved" || activeTicket?.status === "Closed" ? (
                      <>
                        <RefreshCw size={11} className="animate-spin-slow" />
                        <span>Reopen Ticket</span>
                      </>
                    ) : (
                      <>
                        <Check size={11} strokeWidth={2.5} />
                        <span>Resolve</span>
                      </>
                    )}
                  </button>

                  {/* Ellipsis Options Menu */}
                  <div className="relative" ref={optionsDropdownRef}>
                    <button
                      onClick={() => setShowOptionsDropdown(!showOptionsDropdown)}
                      className="p-2 bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-slate-200 rounded-lg text-slate-500 cursor-pointer transition-colors outline-none"
                      aria-label="Ticket options"
                    >
                      <MoreVertical size={13} />
                    </button>

                    {showOptionsDropdown && (
                      <div className="absolute right-0 mt-1 w-40 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-20 text-left animate-fade-in">
                        <div className="px-2.5 py-1 text-[8px] font-bold text-slate-400 uppercase tracking-wider pb-1">
                          Status
                        </div>
                        <button
                          onClick={() => handleUpdateStatus("Open")}
                          className="w-full px-3.5 py-1 text-xs text-slate-700 hover:bg-slate-50 text-left font-semibold border-none cursor-pointer"
                        >
                          Mark as Open
                        </button>
                        <button
                          onClick={() => handleUpdateStatus("In Progress")}
                          className="w-full px-3.5 py-1 text-xs text-slate-700 hover:bg-slate-50 text-left font-semibold border-none cursor-pointer"
                        >
                          Mark as In Progress
                        </button>
                        <button
                          onClick={() => handleUpdateStatus("Pending")}
                          className="w-full px-3.5 py-1 text-xs text-slate-700 hover:bg-slate-50 text-left font-semibold border-none cursor-pointer"
                        >
                          Mark as Pending
                        </button>
                        <button
                          onClick={() => handleUpdateStatus("Closed")}
                          className="w-full px-3.5 py-1 text-xs text-slate-700 hover:bg-slate-50 text-left font-semibold border-none cursor-pointer"
                        >
                          Mark as Closed
                        </button>
                        <div className="border-t border-slate-100 my-1"></div>
                        <div className="px-2.5 py-1 text-[8px] font-bold text-slate-400 uppercase tracking-wider pb-1">
                          Priority
                        </div>
                        {["Low", "Medium", "High", "Urgent"].map((p) => (
                          <button
                            key={p}
                            onClick={() => handleUpdatePriority(p)}
                            className="w-full px-3.5 py-1 text-xs text-slate-700 hover:bg-slate-50 text-left font-semibold border-none cursor-pointer"
                          >
                            Set {p}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div 
                ref={chatThreadContainerRef}
                className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar bg-slate-50/30 text-left"
              >
                {ticketDetailsLoading ? (
                  <div className="text-center py-12 text-slate-400 flex items-center justify-center gap-1.5">
                    <Loader2 className="animate-spin text-indigo-500" size={14} />
                    <span className="text-xs font-semibold">Loading conversation thread...</span>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {/* Original Support Request Card */}
                    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs text-left relative">
                      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800 text-xs">{activeTicket?.client?.fullName || "Client"}</span>
                          <span className="text-[8px] font-extrabold px-1.5 py-0.5 rounded border uppercase bg-indigo-50 text-indigo-700 border-indigo-100">Creator</span>
                        </div>
                        <span className="text-[9px] font-medium text-slate-400 flex items-center gap-0.5">
                          <Clock size={9} />
                          {new Date(activeTicket?.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 mb-1">{activeTicket?.subject}</h4>
                      <div 
                        className="text-xs text-slate-700 font-medium leading-relaxed whitespace-pre-wrap select-text break-words prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: activeTicket?.description || "" }}
                      />
                      {activeTicket?.attachment && (
                        <div className="mt-3 pt-2 border-t border-slate-100 flex items-center gap-2">
                          <span className="text-[10px] font-bold text-slate-500">Attachment:</span>
                          {(() => {
                            try {
                              const attObj = JSON.parse(activeTicket.attachment);
                              return (
                                <button
                                  type="button"
                                  onClick={() => setPreviewFile({ name: attObj.name, data: attObj.data })}
                                  className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-655 hover:underline bg-transparent border-none p-0 cursor-pointer"
                                >
                                  <Paperclip size={11} />
                                  <span>{attObj.name}</span>
                                </button>
                              );
                            } catch (e) {
                              return <span className="text-[10px] text-slate-400">Invalid attachment</span>;
                            }
                          })()}
                        </div>
                      )}
                    </div>

                    {selectedTicket?.replies?.map((reply) => {
                      const isClientReply = reply.user?.role === "CLIENT";
                      const parsedReply = parseReplyMessage(reply.message);

                      // Internal notes: centered amber banner or card
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
                          className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs hover:border-indigo-400/60 hover:shadow-xs transition-all cursor-pointer flex flex-col gap-2.5 text-left relative"
                        >
                          <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                            <div className="flex items-center gap-2">
                              <div className={`w-6 h-6 rounded-full text-white font-bold text-[9px] flex items-center justify-center shadow-xs shrink-0 bg-indigo-600`}>
                                {getInitials(reply.user?.fullName)}
                              </div>
                              <div>
                                <span className="font-bold text-slate-800 text-xs">{reply.user?.fullName}</span>
                                <span className={`ml-1.5 text-[8px] font-extrabold px-1 py-0.5 rounded border uppercase ${
                                  isClientReply ? "bg-slate-100 text-slate-600 border-slate-200" : "bg-indigo-50 text-indigo-700 border-indigo-100"
                                }`}>
                                  {isClientReply ? "Client" : "Agent"}
                                </span>
                              </div>
                            </div>
                            <span className="text-[9px] font-medium text-slate-400 flex items-center gap-0.5">
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
                            <p className="text-xs text-slate-600 font-medium line-clamp-2">
                              {parsedReply.message}
                            </p>
                          </div>

                          {parsedReply.attachment && (
                            <div className="flex items-center gap-1 text-[10px] text-slate-450 font-bold mt-1">
                              <Paperclip size={10} className="text-slate-405" />
                              <span className="truncate max-w-[200px] text-slate-405">{parsedReply.attachmentName || "Attachment"}</span>
                            </div>
                          )}

                          <div className="flex justify-end pt-1 border-t border-slate-55 mt-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedResponseForModal(reply);
                              }}
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-650 hover:text-indigo-855 bg-transparent border-none p-0 cursor-pointer"
                            >
                              <Eye size={11} />
                              <span>Open Response</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 3. Post Response / Update Ticket Card */}
              {activeTicket?.status === "Closed" ? (
                <div className="bg-slate-100 border border-slate-200 rounded-2xl p-5 text-center text-xs text-slate-550 font-bold select-none mt-6 shadow-2xs shrink-0">
                  This ticket has been closed and cannot receive further replies.
                </div>
              ) : (
                <form onSubmit={handleSendReply} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 mt-6 text-left shrink-0">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-display">Post Response</h3>
                    <span className="text-[10px] text-slate-400 font-medium">Add an update or internal note to this ticket</span>
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
                        value={replyText}
                        onChange={(e) => {
                          setReplyText(e.target.value);
                          e.target.style.height = 'auto';
                          e.target.style.height = e.target.scrollHeight + 'px';
                        }}
                        rows={5}
                        placeholder={isInternalNote ? "Type internal note visible to team only..." : "Type details of your response update here..."} 
                        aria-label="Message"
                        className={`w-full p-3 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-semibold text-xs min-h-[120px] ${
                          isInternalNote ? "bg-amber-50 text-amber-800 focus:bg-white" : "bg-white text-slate-800"
                        }`}
                      />
                    </div>

                    {/* Optional Attachment */}
                    <div className="space-y-1.5 text-xs font-semibold text-slate-705 text-left">
                      <label className="block text-slate-700 font-bold">Attachment (Optional)</label>
                      <div className="flex items-center gap-3">
                        <label 
                          htmlFor="reply-ticket-file"
                          className="px-3 py-1.5 border border-slate-200 hover:border-slate-350 bg-white text-slate-700 rounded-lg cursor-pointer shadow-xs font-bold transition-all hover:bg-slate-50 flex items-center gap-1 text-[11px] select-none"
                        >
                          <Paperclip size={12} />
                          <span>Choose File</span>
                        </label>
                        <input 
                          type="file" 
                          id="reply-ticket-file" 
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
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
                      {/* Add as Internal Note Checkbox */}
                      <label className="flex items-center gap-1.5 text-slate-500 cursor-pointer hover:text-slate-800 select-none">
                        <input
                          type="checkbox"
                          checked={isInternalNote}
                          onChange={(e) => setIsInternalNote(e.target.checked)}
                          className="rounded border-slate-300 text-amber-500 focus:ring-amber-500/20 cursor-pointer"
                          disabled={replyLoading}
                        />
                        <span className="text-[11px] font-bold flex items-center gap-1">
                          <Lock size={10} className={isInternalNote ? "text-amber-505 animate-pulse" : ""} />
                          Add as Internal Note
                        </span>
                      </label>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setReplySubject("");
                            setReplyPriority("Medium");
                            setReplyText("");
                            setReplyAttachment("");
                            setReplyAttachmentName("");
                            setIsInternalNote(false);
                          }}
                          className="px-3 py-1.5 text-[11px] font-bold text-slate-500 hover:text-slate-800 rounded-lg cursor-pointer bg-transparent border-none transition-colors"
                          disabled={replyLoading}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={replyLoading}
                          className={`px-4.5 py-2 text-[11px] font-bold rounded-lg cursor-pointer transition-colors border-none shadow-xs disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 ${
                            isInternalNote
                              ? "bg-amber-500 hover:bg-amber-600 text-white"
                              : "bg-indigo-600 hover:bg-indigo-700 text-white"
                          }`}
                        >
                          {replyLoading && <Loader2 size={11} className="animate-spin" />}
                          <span>{isInternalNote ? "Post Internal Note" : "Post Response"}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              )}
                  <div ref={threadEndRef} />
            </div>
              </>
          )}
        </div>
      </div>

      {/* ==================== MODAL: CREATE TICKET ON BEHALF OF CLIENT ==================== */}
      {isNewTicketModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white w-full max-w-[500px] max-h-[90vh] rounded-2xl border border-slate-200 shadow-xl overflow-y-auto divide-y divide-slate-100">
            {/* Modal Header */}
            <div className="p-5.5 flex justify-between items-center text-left">
              <div>
                <h3 className="font-display font-extrabold text-slate-900 text-base">New Support Ticket</h3>
                <p className="text-slate-400 text-xs mt-0.5 font-medium">
                  Fill out the fields below to create a support ticket on behalf of a client.
                </p>
              </div>
              <button 
                onClick={() => {
                  setIsNewTicketModalOpen(false);
                  setNewTicketErrors({});
                }}
                className="text-slate-400 hover:text-slate-650 cursor-pointer text-lg font-bold bg-transparent border-none"
              >
                &times;
              </button>
            </div>

            <form 
              onSubmit={handleCreateTicket} 
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
                  e.preventDefault();
                }
              }}
              className="text-left"
            >
              <div className="p-5.5 space-y-4 text-xs font-semibold text-slate-700">
                {newTicketErrors.global && (
                  <div className="bg-rose-50 border border-rose-100 text-rose-700 rounded-xl px-4 py-3 text-xs flex items-center gap-2.5">
                    <AlertCircle size={16} className="text-rose-500" />
                    <span>{newTicketErrors.global}</span>
                  </div>
                )}

                {/* Client Account */}
                <div className="space-y-1.5">
                  <label className="block text-slate-700">Client Account</label>
                  <select
                    value={newTicketData.clientId}
                    onChange={(e) => setNewTicketData({ ...newTicketData, clientId: e.target.value })}
                    aria-label="Select a Client..."
                    className={`w-full h-10 px-3.5 border ${
                      newTicketErrors.clientId ? 'border-rose-400 focus:ring-rose-100' : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/10'
                    } bg-white text-slate-900 rounded-xl outline-none focus:ring-4 transition-all font-medium`}
                  >
                    <option value="">Select a Client...</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.company})
                      </option>
                    ))}
                  </select>
                  {newTicketErrors.clientId && <p className="text-rose-600 text-[11px] font-bold mt-1">{newTicketErrors.clientId}</p>}
                </div>

                {/* Subject */}
                <div className="space-y-1.5">
                  <label className="block text-slate-700">Subject</label>
                  <input 
                    type="text" 
                    value={newTicketData.subject}
                    onChange={(e) => setNewTicketData({ ...newTicketData, subject: e.target.value })}
                    placeholder="Enter short ticket summary..." 
                    aria-label="Enter short ticket summary..."
                    className={`w-full h-10 px-3.5 border ${
                      newTicketErrors.subject ? 'border-rose-400 focus:ring-rose-100' : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/10'
                    } bg-white text-slate-900 rounded-xl outline-none focus:ring-4 transition-all placeholder-slate-400`}
                  />
                  {newTicketErrors.subject && <p className="text-rose-600 text-[11px] font-bold mt-1">{newTicketErrors.subject}</p>}
                </div>

                {/* Category & Priority Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Priority */}
                  <div className="space-y-1.5">
                    <label className="block text-slate-700">Priority</label>
                    <select
                      value={newTicketData.priority}
                      onChange={(e) => setNewTicketData({ ...newTicketData, priority: e.target.value })}
                      aria-label="Select priority"
                      className="w-full h-10 px-3 border border-slate-200 bg-white text-slate-900 rounded-xl outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all cursor-pointer font-medium"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>

                  {/* Category */}
                  <div className="space-y-1.5">
                    <label className="block text-slate-700">Category</label>
                    <select
                      value={newTicketData.category}
                      onChange={(e) => setNewTicketData({ ...newTicketData, category: e.target.value })}
                      aria-label="Select category"
                      className="w-full h-10 px-3 border border-slate-200 bg-white text-slate-900 rounded-xl outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all cursor-pointer font-medium"
                    >
                      <option value="Technical">Technical</option>
                      <option value="Billing">Billing</option>
                      <option value="General">General</option>
                      <option value="Feedback">Feedback</option>
                    </select>
                  </div>
                </div>

                {/* Description/Message */}
                <div className="space-y-1.5">
                  <label className="block text-slate-700">Message</label>
                  <textarea 
                    value={newTicketData.description}
                    onChange={(e) => setNewTicketData({ ...newTicketData, description: e.target.value })}
                    rows={4}
                    placeholder="Provide details about the issue..." 
                    className={`w-full p-3.5 border ${
                      newTicketErrors.description ? 'border-rose-400 focus:ring-rose-100' : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/10'
                    } bg-white text-slate-900 rounded-xl outline-none focus:ring-4 transition-all placeholder-slate-400 font-medium`}
                  />
                  {newTicketErrors.description && <p className="text-rose-600 text-[11px] font-bold mt-1">{newTicketErrors.description}</p>}
                </div>

                {/* Optional Attachment */}
                <div className="space-y-1.5">
                  <label className="block text-slate-700">Attachment (Optional)</label>
                  <div className="flex items-center gap-3">
                    <label 
                      htmlFor="new-ticket-file"
                      className="px-4 py-2 border border-slate-200 hover:border-slate-350 bg-white text-slate-700 rounded-xl cursor-pointer shadow-xs font-bold transition-all hover:bg-slate-50 flex items-center gap-1.5"
                    >
                      <Paperclip size={14} />
                      <span>Choose File</span>
                    </label>
                    <input 
                      type="file" 
                      id="new-ticket-file" 
                      onChange={handleAttachmentChange}
                      className="hidden" 
                    />
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-[11px] text-slate-400 truncate max-w-[150px]">
                        {newTicketData.attachment ? JSON.parse(newTicketData.attachment).name : "No file chosen (Max 5MB)"}
                      </span>
                      {newTicketData.attachment && (
                        <button
                          type="button"
                          onClick={() => setNewTicketData(prev => ({ ...prev, attachment: "" }))}
                          className="p-1 hover:bg-slate-100 hover:text-rose-600 rounded text-slate-400 border-none bg-transparent cursor-pointer transition-colors"
                          title="Remove attachment"
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                  {newTicketErrors.attachment && <p className="text-rose-600 text-[11px] font-bold mt-1">{newTicketErrors.attachment}</p>}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="p-4 bg-slate-50 flex justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setIsNewTicketModalOpen(false);
                    setNewTicketErrors({});
                  }}
                  className="px-4 py-2 border border-slate-200 text-slate-750 text-xs font-bold rounded-xl cursor-pointer hover:bg-slate-100 transition-all shrink-0 bg-white"
                >
                  Cancel
                </button>
                <div className="flex gap-2">
                  {newTicketLoading ? (
                    <button
                      type="button"
                      disabled
                      className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shrink-0 border-none opacity-50 select-none animate-pulse"
                    >
                      <Loader2 size={14} className="animate-spin" />
                      <span>Creating Ticket...</span>
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl cursor-pointer transition-all border-none"
                    >
                      <span>Create Ticket</span>
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Response Detail Modal */}
      {selectedResponseForModal && (() => {
        const parsedReply = parseReplyMessage(selectedResponseForModal.message);
        return (
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
                  <h3 className="font-display font-bold text-slate-905 text-sm">
                    {parsedReply.isInternal ? "Internal Note Detail" : "Response Detail"}
                  </h3>
                </div>
                <button 
                  onClick={() => setSelectedResponseForModal(null)}
                  aria-label="Close response modal"
                  className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-655 transition-colors border-none bg-transparent cursor-pointer font-bold text-lg"
                >
                  &times;
                </button>
              </div>
              {/* Modal Content */}
              <div className="p-6 overflow-y-auto space-y-4 max-h-[70vh] text-left">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    {selectedResponseForModal.user?.avatar ? (
                      <img 
                        src={selectedResponseForModal.user.avatar} 
                        alt="Avatar" 
                        className="w-10 h-10 rounded-full object-cover shadow-xs" 
                      />
                    ) : (
                      <div className={`w-10 h-10 rounded-full text-white font-bold text-xs flex items-center justify-center shadow-xs bg-indigo-600`}>
                        {getInitials(selectedResponseForModal.user?.fullName)}
                      </div>
                    )}
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs">{selectedResponseForModal.user?.fullName}</h4>
                      <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                        {selectedResponseForModal.user?.role === "CLIENT" ? "Client" : "Support Agent"} • {new Date(selectedResponseForModal.createdAt).toLocaleString()}
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
                    className="text-xs text-slate-700 font-medium leading-relaxed whitespace-pre-wrap select-text break-words prose prose-sm max-w-none"
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
                      onClick={() => setPreviewFile({ name: parsedReply.attachmentName, data: parsedReply.attachment })}
                      className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg text-xs font-bold transition-colors shadow-2xs inline-flex items-center gap-1.5 cursor-pointer border-none"
                    >
                      <Eye size={12} />
                      Preview File
                    </button>
                  </div>
                )}
              </div>
              {/* Modal Footer */}
              <div className="px-6 py-3 border-t border-slate-100 flex justify-end bg-slate-50/50">
                <button
                  onClick={() => setSelectedResponseForModal(null)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer bg-white"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Attachment Preview Modal */}
      {previewFile && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4"
          onClick={() => setPreviewFile(null)}
        >
          <div 
            className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-xl flex flex-col overflow-hidden border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2 min-w-0">
                <FileText size={16} className="text-indigo-600 shrink-0" />
                <h3 className="font-display font-bold text-slate-900 text-sm truncate">
                  {previewFile.name}
                </h3>
              </div>
              <button 
                onClick={() => setPreviewFile(null)}
                className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600 transition-colors border-none bg-transparent cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto flex-1 flex items-center justify-center bg-slate-100/50 min-h-[400px]">
              {(() => {
                const data = previewFile.data;
                if (!data) return <p className="text-slate-500 text-xs font-semibold">No file data available.</p>;

                // Detect file type from data URI
                const isBase64 = data.startsWith("data:");
                let mimeType = "";
                if (isBase64) {
                  const match = data.match(/^data:([^;]+);/);
                  if (match) mimeType = match[1];
                } else {
                  // Guess from extension
                  const ext = previewFile.name.split('.').pop()?.toLowerCase();
                  if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext)) {
                    mimeType = 'image/png';
                  } else if (ext === 'pdf') {
                    mimeType = 'application/pdf';
                  } else if (['txt', 'log', 'md', 'json', 'js', 'html', 'css'].includes(ext)) {
                    mimeType = 'text/plain';
                  }
                }

                if (mimeType.startsWith("image/")) {
                  return (
                    <img 
                      src={data} 
                      alt={previewFile.name} 
                      className="max-w-full max-h-[65vh] object-contain rounded-lg shadow-md border border-slate-200/50" 
                    />
                  );
                }

                if (mimeType === "application/pdf") {
                  return (
                    <iframe 
                      src={data} 
                      title={previewFile.name} 
                      className="w-full h-[65vh] border border-slate-200 rounded-lg shadow-xs" 
                    />
                  );
                }

                if (mimeType.startsWith("text/") || ['txt', 'log', 'md', 'json'].includes(previewFile.name.split('.').pop()?.toLowerCase() || '')) {
                  // For base64 text, decode it if possible
                  let textContent = "";
                  try {
                    if (isBase64) {
                      const base64Str = data.split(',')[1];
                      textContent = atob(base64Str);
                    } else {
                      textContent = data; // fallback or URL
                    }
                  } catch (e) {
                    textContent = "Failed to parse text content.";
                  }

                  if (textContent) {
                    return (
                      <pre className="text-xs text-slate-800 bg-white p-5 rounded-lg border border-slate-200 w-full overflow-auto max-h-[65vh] font-mono whitespace-pre-wrap leading-relaxed shadow-xs">
                        {textContent}
                      </pre>
                    );
                  }
                }

                // Default fallback: Try to render in iframe, if browser fails, show message
                return (
                  <div className="text-center space-y-4 max-w-sm">
                    <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                      <FileText size={32} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">Preview Not Supported</h4>
                      <p className="text-slate-500 text-xs mt-1 font-medium leading-relaxed">
                        This file format cannot be previewed directly in the browser. Please download the file to view it.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        const link = document.createElement("a");
                        link.href = data;
                        link.download = previewFile.name;
                        link.click();
                      }}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download size={14} />
                      Download File
                    </button>
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-slate-100 flex justify-end gap-2.5 bg-slate-50/50 shrink-0">
              <button
                onClick={() => setPreviewFile(null)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-750 rounded-xl text-xs font-bold transition-all cursor-pointer bg-white"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const link = document.createElement("a");
                  link.href = previewFile.data;
                  link.download = previewFile.name;
                  link.click();
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border-none"
              >
                <Download size={13} />
                Download
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Popup Modal */}
      {showSuccessPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white w-full max-w-[400px] rounded-2xl border border-slate-200 shadow-xl p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h2 className="font-display font-extrabold text-slate-900 text-base">Ticket Created!</h2>
              <p className="text-slate-500 text-xs mt-1.5 font-medium leading-relaxed">
                The support ticket has been created successfully. Our team will review the query and reply shortly.
              </p>
            </div>
            <button
              onClick={() => setShowSuccessPopup(false)}
              className="w-full py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl cursor-pointer hover:bg-indigo-700 transition-all shadow-xs"
            >
              Okay, Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

export default AdminSupport;
