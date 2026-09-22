// This file renders the roadmap milestones dashboard for the staff.
// It maps database milestone states into a visual road-map timeline and supports Excel exports.

import React, { useState, useEffect } from "react";
import API from "../../services/api";
import { useToast } from "../../context/ToastContext";
import { Download } from "lucide-react";
import { exportToExcel } from "../../utils/excelExport";

export default function StaffMilestones() {
  const { showToast } = useToast();
  const [milestonesData, setMilestonesData] = useState([]);
  const [loading, setLoading] = useState(true);
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

  // Queries milestones data records from backend API
  const fetchMilestones = async () => {
    try {
      setLoading(true);
      const res = await API.get("/milestones");
      const rawMilestones = res.data?.data || [];
      const mappedMilestones = rawMilestones.map(m => ({
        title: m.title || "Untitled Milestone",
        status: m.status || "Planning",
        info: `Project: ${m.project?.name || "General"} | Due: ${m.date ? new Date(m.date).toLocaleDateString() : "No Date"}`,
        rate: m.progress || 0
      }));
      setMilestonesData(mappedMilestones);
    } catch (err) {
      console.error("Failed to fetch milestones:", err);
    } finally {
      setLoading(false);
    }
  };

  // Triggers data query on initial screen mount
  useEffect(() => {
    fetchMilestones();
  }, []);

  // Maps local state and exports milestones data to excel workbook
  const handleExportMilestones = () => {
    try {
      if (milestonesData.length === 0) {
        showToast("No milestones to export.", "error");
        return;
      }
      const mapped = milestonesData.map(m => ({
        "Milestone Title": m.title,
        "Status": m.status,
        "Completion Rate (%)": m.rate,
        "Details": m.info
      }));
      exportToExcel(mapped, "Staff_Milestones_Timeline_Export");
      showToast("Milestones timeline exported successfully.", "success");
    } catch (err) {
      console.error("Failed to export milestones:", err);
      showToast("Failed to export milestones data.", "error");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1 text-left">
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Project Milestones</h2>
          <p className="text-sm text-slate-550 font-normal">Tracking timelines and completeness rates for active sprint timelines.</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleExportMilestones}
            disabled={milestonesData.length === 0 || loading}
            title={milestonesData.length === 0 ? "No data to export" : "Export to Excel"}
            className="inline-flex items-center gap-1.5 px-4 h-9 rounded-lg border border-indigo-200 hover:border-indigo-400 text-[#4F46E5] bg-[#4F46E5]/5 hover:bg-[#4F46E5]/10 text-sm font-medium transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
           aria-label={milestonesData.length === 0 ? "No data to export" : "Export to Excel"}>
            <Download size={15} />
            Export Data
          </button>
        </div>
      </div>

      {/* Timeline Tracker Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6 text-left">
        <h3 className="text-sm font-bold text-slate-800">Sprint Roadmap</h3>

        <div className="relative border-l-2 border-slate-100 ml-4 pl-6 space-y-6">
          {loading || !renderLazy ? (
            <div className="text-center text-xs text-slate-450 py-8 font-medium animate-pulse">
              Loading milestones roadmap...
            </div>
          ) : milestonesData.length === 0 ? (
            <div className="text-center text-xs text-slate-450 py-8 font-medium">
              No milestones configuration found.
            </div>
          ) : (
            milestonesData.map((milestone, idx) => (
              <div key={idx} className="relative">
                {/* Timeline dot bullet */}
                <span className={`absolute -left-[33px] top-0.5 w-4.5 h-4.5 rounded-full border-2 border-white flex items-center justify-center shadow-sm ${milestone.status === "Completed"
                    ? "bg-emerald-500"
                    : milestone.status === "In Progress"
                      ? "bg-indigo-600 animate-pulse"
                      : "bg-slate-300"
                  }`}>
                  {milestone.status === "Completed" && (
                    <svg className="w-2.5 h-2.5 text-white" width="10" height="10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </span>

                <div className="space-y-1 bg-slate-50/40 p-4 rounded-lg border border-slate-100">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <h4 className="text-xs font-bold text-slate-800">{milestone.title}</h4>
                    <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider self-start sm:self-auto ${milestone.status === "Completed"
                        ? "bg-emerald-50 text-emerald-700"
                        : milestone.status === "In Progress"
                          ? "bg-indigo-50 text-indigo-700"
                          : "bg-slate-100 text-slate-400"
                      }`}>
                      {milestone.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-550 leading-relaxed">{milestone.info}</p>
                  <div className="flex items-center gap-2 mt-2 w-48 text-[11px]">
                    <span className="font-semibold text-slate-650">{milestone.rate}% Complete</span>
                    <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div className={`h-full ${milestone.status === "Completed" ? "bg-emerald-500" : "bg-indigo-600"}`} style={{ width: `${milestone.rate}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
