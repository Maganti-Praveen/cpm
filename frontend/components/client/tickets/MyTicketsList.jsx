import React from "react";
import { MessageSquare, Loader2 } from "lucide-react";

export default function MyTicketsList({ tickets, loading, onSelectTicket }) {
  
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

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
  };

  return (
    <div className="flex-1 bg-white border border-slate-200 rounded-2xl flex flex-col overflow-hidden shadow-xs h-full">
      <div className="p-5 border-b border-slate-100 bg-white flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-slate-900 text-lg">My Support Tickets</h2>
          <p className="text-[11px] text-slate-500 font-medium mt-1">View and manage your current and past tickets</p>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto bg-slate-50/30">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="animate-spin text-indigo-600 mb-2" size={24} />
            <span className="text-[11px] font-medium">Loading tickets...</span>
          </div>
        ) : tickets.length === 0 ? (
          <div className="py-20 text-center text-slate-400">
            <MessageSquare className="mx-auto text-slate-300 mb-2" size={32} />
            <p className="text-sm font-bold text-slate-500">No tickets found</p>
            <p className="text-xs mt-1">You haven't opened any support tickets yet.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="p-4 font-bold">Department</th>
                <th className="p-4 font-bold">Subject</th>
                <th className="p-4 font-bold">Status</th>
                <th className="p-4 font-bold">Last Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {tickets.map((ticket) => (
                <tr 
                  key={ticket.id} 
                  onClick={() => onSelectTicket(ticket.id)}
                  className="hover:bg-slate-50 transition-colors cursor-pointer group"
                >
                  <td className="p-4 text-xs font-semibold text-slate-700">
                    {ticket.category || "General"}
                  </td>
                  <td className="p-4 text-xs font-bold text-slate-900 max-w-xs truncate">
                    <span className="text-indigo-600 font-extrabold mr-1.5">#TCK-{ticket.id}</span>
                    <span className="group-hover:text-indigo-600 transition-colors">{ticket.subject}</span>
                  </td>
                  <td className="p-4">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase ${getStatusBadge(ticket.status)}`}>
                      {ticket.status}
                    </span>
                  </td>
                  <td className="p-4 text-[11px] font-semibold text-slate-500">
                    {formatDate(ticket.updatedAt || ticket.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
