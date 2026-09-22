// Displays recent updates on deliverables, documents, and messages in a project stream.
// Feeds a clean chronological layout.


import React, { useState, useEffect } from "react";
import { getActivities } from "../../services/deliverableService";

export default function ActivityFeed({ projectId }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (projectId) {
      getActivities(projectId)
        .then((res) => {
          // Map backend activity keys to fit act list
          const formatted = res.data.data.map(act => ({
            id: act.id,
            title: act.title,
            desc: act.description,
            time: new Date(act.createdAt).toLocaleString()
          }));
          setActivities(formatted);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Error loading activities:", err);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [projectId]);

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs font-sans min-h-[200px] flex items-center justify-center text-xs text-slate-450 font-medium">
        Loading activity...
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs font-sans">
      <h2 className="font-display font-bold text-slate-900 text-base mb-5">
        Recent Activity
      </h2>
      <div className="relative pl-6 space-y-5">
        {/* Vertical Timeline Track */}
        <div className="absolute left-[9px] top-1.5 bottom-1.5 w-0.5 bg-slate-100" />

        {activities.map((act) => (
          <div key={act.id} className="relative flex items-start gap-3">
            {/* Success Check Node */}
            <div className="absolute -left-[27px] top-0.5 w-5 h-5 rounded-full bg-success-light text-success border border-white flex items-center justify-center shadow-xs">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-display font-semibold text-slate-800 text-xs leading-none">
                {act.title}
              </h3>
              <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                {act.desc}
              </p>
              <span className="text-[11px] text-slate-400 font-medium block mt-1.5">
                {act.time}
              </span>
            </div>
          </div>
        ))}
        {activities.length === 0 && (
          <p className="text-xs text-slate-400 italic">No recent activity logs.</p>
        )}
      </div>
    </div>
  );
}
