// Inbox layout compiling notifications, tickets updates, and milestone logs.
// Updates read counts.

import React from "react";
import NotificationsWidget from "../../components/client/NotificationsWidget";
import NotificationFeed from "../../components/layout/NotificationFeed";

export default function ClientNotifications() {
  return (
    <div className="space-y-6 font-sans">
      <div>
        <h1 className="text-[1.75rem] font-bold text-[#0F172A] font-display">Notifications</h1>
        <p className="text-sm text-[#64748B] mt-1">
          Stay informed on project status updates, deliverables, and invoices.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Real-time notification feed */}
        <div className="lg:col-span-2">
          <NotificationFeed />
        </div>

        {/* Action items widget (unpaid invoices, tickets) */}
        <div className="lg:col-span-1">
          <NotificationsWidget />
        </div>
      </div>
    </div>
  );
}
