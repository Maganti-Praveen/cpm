// Upgraded client portal direct messages view importing unified MessagesComponent.
import React from "react";
import MessagesComponent from "../../components/common/MessagesComponent";

export default function ClientMessages() {
  return (
    <div className="space-y-6 font-sans">
      <div>
        <h1 className="text-[1.75rem] font-bold text-[#0F172A] font-display">Messages</h1>
        <p className="text-sm text-[#64748B] mt-1">
          Communicate directly with your assigned project manager and support team.
        </p>
      </div>

      {/* Main interactive Messaging console component wrapper */}
      <MessagesComponent />
    </div>
  );
}
