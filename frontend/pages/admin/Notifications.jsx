// This page renders the administrator alerts inbox page.
// It integrates the global NotificationFeed component.

import React from "react";
import NotificationFeed from "../../components/layout/NotificationFeed";

export default function AdminNotifications() {
  return (
    <div className="space-y-6 font-sans">
      <div>
        <h1 className="text-[1.75rem] font-bold text-[#0F172A] font-display">System Alerts & Notifications</h1>
        <p className="text-sm text-[#64748B] mt-1">
          Review recent updates, client ticket actions, and system logs.
        </p>
      </div>

      <div className="max-w-4xl">
        <NotificationFeed />
      </div>
    </div>
  );
}
