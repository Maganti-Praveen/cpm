import React, { useState, useEffect, Suspense } from "react";

const NotificationFeed = React.lazy(() => import("../../components/layout/NotificationFeed"));

export default function StaffNotifications() {
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
        <h1 className="text-[1.75rem] font-bold text-[#0F172A] font-display">My Alerts & Tasks Notifications</h1>
        <p className="text-sm text-[#64748B] mt-1">
          Review updates on assigned projects, task completions, and messages.
        </p>
      </div>

      <div className="max-w-4xl">
        {renderLazy ? (
          <Suspense fallback={
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm animate-pulse h-48 min-h-[192px] flex items-center justify-center">
              <span className="text-xs text-slate-400 font-medium">Loading alerts...</span>
            </div>
          }>
            <NotificationFeed />
          </Suspense>
        ) : (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm animate-pulse h-48 min-h-[192px] flex items-center justify-center">
            <span className="text-xs text-slate-400 font-medium">Loading alerts...</span>
          </div>
        )}
      </div>
    </div>
  );
}
