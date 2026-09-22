import React from "react";
import { MessageSquare, PlusCircle } from "lucide-react";

export default function TicketSidebar({ activeView, setActiveView }) {
  return (
    <div className="w-full lg:w-[280px] shrink-0 bg-white border border-slate-200 rounded-2xl flex flex-col overflow-hidden shadow-xs h-full">
      <div className="p-5 border-b border-slate-100 bg-slate-50/50">
        <h2 className="font-display font-bold text-slate-900 text-lg">Support Menu</h2>
        <p className="text-[11px] text-slate-500 font-medium mt-1">Manage your support requests</p>
      </div>
      
      <div className="p-3 space-y-1.5 flex-1 bg-white">
        <button
          onClick={() => setActiveView("MY_TICKETS")}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer border-none text-left ${
            activeView === "MY_TICKETS" || activeView === "TICKET_DETAIL"
              ? "bg-indigo-50 text-indigo-700 shadow-2xs shadow-indigo-100"
              : "bg-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          }`}
        >
          <MessageSquare size={18} className={activeView === "MY_TICKETS" || activeView === "TICKET_DETAIL" ? "text-indigo-600" : "text-slate-400"} />
          <span>My Support Tickets</span>
        </button>

        <button
          onClick={() => setActiveView("OPEN_TICKET")}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer border-none text-left ${
            activeView === "OPEN_TICKET"
              ? "bg-indigo-50 text-indigo-700 shadow-2xs shadow-indigo-100"
              : "bg-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          }`}
        >
          <PlusCircle size={18} className={activeView === "OPEN_TICKET" ? "text-indigo-600" : "text-slate-400"} />
          <span>Open Ticket</span>
        </button>
      </div>
    </div>
  );
}
