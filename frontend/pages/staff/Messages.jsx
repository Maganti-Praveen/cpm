// Root messages dashboard page for project staff.
// Root messages dashboard page for project staff.
// Connects staff members with admins and clients.

import React, { useState, useEffect, Suspense } from "react";

const MessagesComponent = React.lazy(() => import("../../components/common/MessagesComponent"));

export default function StaffMessages() {
  const [renderLazy, setRenderLazy] = useState(false);

  useEffect(() => {
    const id = typeof window.requestIdleCallback === 'function'
      ? window.requestIdleCallback(() => setRenderLazy(true), { timeout: 200 })
      : setTimeout(() => setRenderLazy(true), 80);
    return () => {
      if (typeof window.cancelIdleCallback === 'function') window.cancelIdleCallback(id);
      else clearTimeout(id);
    };
  }, []);

  return (
    <div className="space-y-6 font-sans">
      <div>
        <h1 className="text-[1.75rem] font-bold text-[#0F172A] font-display">Inbox Messages</h1>
        <p className="text-sm text-[#64748B] mt-1">
          Coordinate deliverables and details directly with clients and admins.
        </p>
      </div>

      {/* Main interactive Messaging console component wrapper */}
      {renderLazy ? (
        <Suspense fallback={
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 h-64 min-h-[256px] animate-pulse flex items-center justify-center">
            <span className="text-xs text-slate-405 font-medium">Loading messages...</span>
          </div>
        }>
          <MessagesComponent />
        </Suspense>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 h-64 min-h-[256px] animate-pulse flex items-center justify-center">
          <span className="text-xs text-slate-405 font-medium">Loading messages...</span>
        </div>
      )}
    </div>
  );
}
