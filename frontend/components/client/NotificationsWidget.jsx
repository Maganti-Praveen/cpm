// Renders a dropdown list of recent notifications with actions to clear them.
// Keeps alerts lists current.


import React, { useState, useEffect } from "react";
import { getProjects } from "../../services/projectService";
import { getDeliverables } from "../../services/deliverableService";
import { getInvoices } from "../../services/invoiceService";
import { getTickets } from "../../services/ticketService";
import { Loader2, Bell } from "lucide-react";

export default function NotificationsWidget({
  invoices = null,
  tickets = null,
  projects = null,
  deliverablesCount = null,
  loading: parentLoading = false
}) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If parent is loading, keep this widget in loading state
    if (parentLoading) {
      setLoading(true);
      return;
    }

    const fetchNotifications = async () => {
      try {
        const newAlerts = [];
        
        // 1. Resolve unpaid invoices (use preloaded data if available)
        let unpaidList = [];
        if (invoices !== null) {
          unpaidList = invoices.filter(i => i.status === "Unpaid");
        } else {
          try {
            const invoicesRes = await getInvoices();
            unpaidList = (invoicesRes.data?.data || []).filter(i => i.status === "Unpaid");
          } catch (e) {
            console.error(e);
          }
        }

        if (unpaidList.length > 0) {
          newAlerts.push({
            id: "unpaid_invoices",
            text: `${unpaidList.length} Unpaid Invoice${unpaidList.length > 1 ? "s" : ""}`,
            subtext: "Please review and process outstanding payments.",
            type: "invoice",
          });
        }

        // 2. Resolve open tickets (use preloaded data if available)
        let openList = [];
        if (tickets !== null) {
          openList = tickets.filter(t => t.status !== "Closed" && t.status !== "Resolved");
        } else {
          try {
            const ticketsRes = await getTickets();
            openList = (ticketsRes.data || []).filter(t => t.status !== "Closed" && t.status !== "Resolved");
          } catch (e) {
            console.error(e);
          }
        }

        if (openList.length > 0) {
          newAlerts.push({
            id: "open_tickets",
            text: `${openList.length} Open Support Ticket${openList.length > 1 ? "s" : ""}`,
            subtext: "Our team is working on your active support tickets.",
            type: "ticket",
          });
        }

        // 3. Resolve deliverables awaiting review (use preloaded count/projects if available)
        let pendingReviewCount = 0;
        if (deliverablesCount !== null) {
          pendingReviewCount = deliverablesCount;
        } else {
          try {
            const clientProjs = projects !== null ? projects : (await getProjects()).data?.data || [];
            const results = await Promise.all(clientProjs.map(p => getDeliverables(p.id)));
            results.forEach(r => {
              pendingReviewCount += (r.data?.data || []).filter(d => d.status === "Awaiting Review").length;
            });
          } catch (e) {
            console.error(e);
          }
        }

        if (pendingReviewCount > 0) {
          newAlerts.push({
            id: "pending_deliverables",
            text: `${pendingReviewCount} Deliverable${pendingReviewCount > 1 ? "s" : ""} Awaiting Review`,
            subtext: "Please review and approve the latest project files.",
            type: "deliverable",
          });
        }

        setAlerts(newAlerts);
      } catch (err) {
        console.error("Failed to load notifications:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [invoices, tickets, projects, deliverablesCount, parentLoading]);

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs font-sans">
      <h2 className="font-display font-bold text-slate-900 text-base mb-4 flex items-center gap-1.5">
        <Bell size={18} className="text-slate-500" />
        Notifications
      </h2>
      
      {loading ? (
        <div className="py-6 flex items-center justify-center gap-1.5 text-slate-450">
          <Loader2 className="animate-spin text-indigo-500" size={16} />
          <span className="text-xs font-semibold">Updating notifications...</span>
        </div>
      ) : alerts.length === 0 ? (
        <div className="py-8 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
          <p className="text-xs text-slate-400 font-semibold">
            All caught up! No new notifications.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alt) => {
            const isInvoice = alt.type === "invoice";
            const isTicket = alt.type === "ticket";
            
            return (
              <div key={alt.id} className="flex gap-3.5 items-start hover:bg-slate-50 p-2.5 rounded-xl transition-colors border border-slate-100/50 bg-white shadow-xs">
                <div className={`w-8.5 h-8.5 rounded-xl flex items-center justify-center shrink-0 border ${
                  isInvoice 
                    ? "bg-rose-50 border-rose-100 text-rose-500" 
                    : isTicket 
                    ? "bg-amber-50 border-amber-100 text-amber-500" 
                    : "bg-indigo-50 border-indigo-100 text-indigo-500"
                }`}>
                  {isInvoice ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  ) : isTicket ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  )}
                </div>
                <div className="space-y-0.5">
                  <h3 className="font-display font-bold text-slate-800 text-xs leading-none">
                    {alt.text}
                  </h3>
                  <p className="text-slate-400 text-[11px] font-semibold leading-relaxed">
                    {alt.subtext}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
