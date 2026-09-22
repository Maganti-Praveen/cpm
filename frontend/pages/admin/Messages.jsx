// Root messages portal page for system administrators.
// Coordinates direct user communication channels.

import React from "react";
import MessagesComponent from "../../components/common/MessagesComponent";

export default function AdminMessages() {
  return (
    <div className="space-y-6 font-sans">
      <div>
        <h1 className="text-[1.75rem] font-bold text-[#0F172A] font-display">Direct Messages</h1>
        <p className="text-sm text-[#64748B] mt-1">
          Secure, direct messaging workspace communicating with team agents and clients.
        </p>
      </div>

      {/* Main interactive Messaging console component wrapper */}
      <MessagesComponent />
    </div>
  );
}
