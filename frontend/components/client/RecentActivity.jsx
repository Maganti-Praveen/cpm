// Condenses recent updates on files and invoicing onto the client dashboard.
// Feeds recent operations streams.

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import API from "../../services/api";

export default function RecentActivity({ projectId }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectId) {
      setLoading(false);
      return;
    }

    API.get(`/activities?projectId=${projectId}`)
      .then((res) => {
        if (res.data && res.data.success) {
          const formatted = res.data.data.map((act) => {
            // Derive initials and details from activity data
            const titleParts = act.title.split(":");
            const userFullName = titleParts.length > 1 ? titleParts[1].trim() : "System";
            const initials = userFullName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "S";
            return {
              id: act.id,
              user: userFullName,
              initials,
              avatarBg: act.type === "create" ? "bg-indigo-500" : "bg-emerald-500",
              action: act.description,
              time: new Date(act.createdAt).toLocaleString(),
            };
          });
          setActivities(formatted.slice(0, 5));
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch client dashboard activities:", err);
        setLoading(false);
      });
  }, [projectId]);

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm font-sans min-h-[200px] flex items-center justify-center text-xs text-slate-400 font-medium">
        Loading updates...
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm font-sans">
      <h3 className="font-display font-bold text-slate-900 text-base mb-6">
        Recent Updates
      </h3>

      {/* Timeline Wrapper */}
      <div className="relative pl-6 space-y-6">
        {/* Vertical Line */}
        <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-slate-100" />

        {/* Iterates history logs to build timeline items with color badges */}
        {activities.map((item) => (
          <div key={item.id} className="relative flex gap-3 items-start">
            {/* Timeline Dot / Avatar */}
            <div className="absolute -left-[27px] top-0.5 w-6 h-6 rounded-full flex items-center justify-center border-2 border-white shadow-sm shrink-0 overflow-hidden">
              <div className={`w-full h-full flex items-center justify-center text-white text-[9px] font-bold ${item.avatarBg}`}>
                {item.initials}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-700 leading-normal">
                <span className="font-semibold text-slate-900">{item.user}</span>{" "}
                {item.action}
              </p>
              <span className="text-[11px] text-slate-400 font-medium block mt-1">
                {item.time}
              </span>
            </div>
          </div>
        ))}

        {activities.length === 0 && (
          <p className="text-xs text-slate-400 italic">No recent updates.</p>
        )}
      </div>

      {/* View All Button */}
      <div className="mt-6 pt-4 border-t border-slate-100 text-center">
        <Link to="/client/notifications" className="text-xs font-semibold text-primary hover:text-primary-dark hover:underline cursor-pointer transition-colors inline-block">
          View All Activity
        </Link>
      </div>
    </div>
  );
}
