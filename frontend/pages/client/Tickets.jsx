import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import * as ticketService from "../../services/ticketService";
import { useToast } from "../../context/ToastContext";
import { Search, Plus, Loader2, MessageSquare, Clock, X } from "lucide-react";

// Child Components
import OpenTicketForm from "../../components/client/tickets/OpenTicketForm";
import TicketDetailView from "../../components/client/tickets/TicketDetailView";

// Helpers
const getStatusBadge = (status) => {
  switch (status) {
    case "Open": return "bg-sky-50 text-sky-700 border-sky-100";
    case "In Progress": return "bg-indigo-50 text-indigo-700 border-indigo-100";
    case "Resolved": return "bg-emerald-50 text-emerald-700 border-emerald-100";
    case "Closed": return "bg-slate-100 text-slate-600 border-slate-200";
    default: return "bg-slate-50 text-slate-600 border-slate-100";
  }
};

const getPriorityBadge = (priority) => {
  switch (priority) {
    case "Urgent":
    case "High": return "bg-rose-50 text-rose-700 border-rose-100";
    case "Medium": return "bg-amber-50 text-amber-700 border-amber-100";
    case "Low": return "bg-slate-50 text-slate-600 border-slate-100";
    default: return "bg-slate-50 text-slate-600 border-slate-100";
  }
};

const getRelativeTime = (dateStr) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
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

export default function ClientTickets() {
  const { showToast } = useToast();
  const { user } = useSelector((state) => state.auth);
  
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Selection
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketDetailsLoading, setTicketDetailsLoading] = useState(false);
  const [replyLoading, setReplyLoading] = useState(false);
  
  // Modal state
  const [isNewTicketModalOpen, setIsNewTicketModalOpen] = useState(false);
  const [newTicketLoading, setNewTicketLoading] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Open"); // 'Open', 'Pending', 'Closed'

  useEffect(() => {
    fetchTickets();
  }, []);

  useEffect(() => {
    if (!selectedTicketId) {
      setSelectedTicket(null);
      return;
    }
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

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await ticketService.getTickets();
      if (res.success) {
        setTickets(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicketSubmit = async (payload) => {
    try {
      setNewTicketLoading(true);
      const res = await ticketService.createTicket({
        ...payload,
        attachment: payload.attachment ? JSON.stringify({
          name: payload.attachmentName,
          data: payload.attachment
        }) : null
      });

      if (res.success) {
        showToast("Ticket created successfully!", "success");
        await fetchTickets();
        setSelectedTicketId(res.data.id);
        setIsNewTicketModalOpen(false);
      } else {
        showToast(res.message || "Failed to create ticket.", "error");
      }
    } catch (err) {
      showToast(err.message || "An error occurred.", "error");
    } finally {
      setNewTicketLoading(false);
    }
  };

  const handleReplySubmit = async (payload, onSuccess) => {
    try {
      setReplyLoading(true);
      const res = await ticketService.replyToTicket(selectedTicketId, JSON.stringify(payload));
      if (res.success) {
        setSelectedTicket(prev => ({
          ...prev,
          status: (prev.status === "Closed" || prev.status === "Resolved") ? prev.status : "Open",
          replies: [...(prev?.replies || []), res.data]
        }));
        
        setTickets(prevList => prevList.map(t => 
          t.id === selectedTicketId ? { ...t, status: "Open", updatedAt: new Date().toISOString() } : t
        ));

        if (onSuccess) onSuccess();
      } else {
        showToast(res.message || "Failed to submit reply.", "error");
      }
    } catch (err) {
      showToast(err.message || "Failed to submit reply.", "error");
    } finally {
      setReplyLoading(false);
    }
  };

  // Filter list
  const filteredTickets = tickets.filter((t) => {
    const matchesSearch = 
      t.subject.toLowerCase().includes(searchQuery.toLowerCase()) || 
      String(t.id).includes(searchQuery);

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

  const openCount = tickets.filter(t => t.status === "Open" || t.status === "In Progress").length;
  const pendingCount = tickets.filter(t => t.status === "Pending").length;
  const closedCount = tickets.filter(t => t.status === "Closed" || t.status === "Resolved").length;

  return (
    <div className="flex flex-col min-h-[calc(100vh-8.5rem)] lg:h-[calc(100vh-8.5rem)] font-sans antialiased text-slate-800 p-2 md:p-0">
      
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 shrink-0">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 font-display">Support Tickets</h2>
          <p className="text-xs text-slate-500 font-medium">Need assistance? Open a new support request or manage existing ticket threads.</p>
        </div>
      </div>

      {/* Main Workspace: Split View */}
      <div className="flex flex-col lg:flex-row flex-1 lg:overflow-hidden mt-4 gap-5 items-stretch">
        
        {/* ================= LEFT COLUMN: TICKETS LIST ================= */}
        <div className={`w-full lg:w-[350px] shrink-0 bg-white border border-slate-200 rounded-2xl flex flex-col overflow-hidden shadow-xs h-[400px] lg:h-auto ${selectedTicketId ? 'hidden lg:flex' : 'flex'}`}>
          
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
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold rounded-full cursor-pointer transition-colors shadow-sm"
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

          {/* Ticket Cards List */}
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

        {/* ================= RIGHT COLUMN: CONVERSATION ================= */}
        <div className={`flex-1 overflow-hidden h-full ${!selectedTicketId ? 'hidden lg:flex' : 'flex'}`}>
          {!selectedTicketId ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-white border border-slate-200 rounded-2xl h-[500px] lg:h-auto">
              <MessageSquare className="text-slate-200 mb-3" size={48} />
              <p className="text-sm font-bold text-slate-600">Select a ticket</p>
              <p className="text-xs mt-0.5">Choose a support ticket from the list to view its conversation timeline.</p>
            </div>
          ) : (
            <TicketDetailView 
              ticket={selectedTicket} 
              user={user}
              loading={ticketDetailsLoading}
              replyLoading={replyLoading}
              onBack={() => setSelectedTicketId(null)}
              onReplySubmit={handleReplySubmit}
            />
          )}
        </div>
      </div>

      {/* New Ticket Modal overlay */}
      {isNewTicketModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !newTicketLoading && setIsNewTicketModalOpen(false)}></div>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl relative z-10 animate-fade-in flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
              <h3 className="font-bold text-slate-900 text-lg">Open New Ticket</h3>
              <button 
                onClick={() => setIsNewTicketModalOpen(false)} 
                disabled={newTicketLoading}
                className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors border-none bg-transparent cursor-pointer disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="overflow-y-auto flex-1">
              {/* Reuse OpenTicketForm but remove padding/margins to fit nicely inside the modal */}
              <div className="p-1">
                <OpenTicketForm 
                  user={user}
                  loading={newTicketLoading}
                  onSubmit={handleCreateTicketSubmit}
                  onCancel={() => setIsNewTicketModalOpen(false)}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
