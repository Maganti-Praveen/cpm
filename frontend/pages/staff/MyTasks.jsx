// Customized kanban workspace listing tasks assigned to the active staff user.
// Tracks task details.

import React, { useState, useEffect, useMemo, useCallback } from "react";
import API from "../../services/api";
import { CheckCircle2, Eye, X, AlertCircle, Download } from "lucide-react";
import { exportToExcel } from "../../utils/excelExport";
import Pagination from "../../components/common/Pagination";

// Stable child component to prevent re-rendering all rows on page state change
const TaskRow = React.memo(function TaskRow({ task, onMarkComplete, onViewDetails }) {
  const isDone = task.status?.toLowerCase() === "done" || task.status?.toLowerCase() === "completed";
  
  // Inline event wrapper callbacks
  const handleMark = useCallback(() => {
    onMarkComplete(task.id);
  }, [task.id, onMarkComplete]);

  const handleView = useCallback(() => {
    onViewDetails(task);
  }, [task, onViewDetails]);

  return (
    <tr className="hover:bg-slate-50/40 transition-colors group h-[65px]">
      {/* 1. TASK NAME */}
      <td className="px-6 py-4.5">
        <div className="flex flex-col">
          <span className={`text-xs font-bold text-slate-800 font-display ${isDone ? "line-through text-slate-400" : ""}`}>
            {task.taskName}
          </span>
          {isDone && (
            <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded mt-1 self-start uppercase border border-emerald-150">
              Done
            </span>
          )}
        </div>
      </td>
      
      {/* 2. ASSIGNED TO */}
      <td className="px-6 py-4.5 hidden md:table-cell">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-[11px] text-slate-600">
            {task.assignedTo.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "??"}
          </div>
          <span className="text-xs font-semibold text-slate-650">{task.assignedTo}</span>
        </div>
      </td>

      {/* 3. DUE DATE */}
      <td className="px-6 py-4.5 hidden sm:table-cell">
        <span className="text-xs font-semibold text-slate-500">{task.dueDate}</span>
      </td>

      {/* 4. IN RELATION TO */}
      <td className="px-6 py-4.5 hidden sm:table-cell">
        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 uppercase tracking-wide">
          {task.inRelationTo}
        </span>
      </td>

      {/* 5. TASK DESCRIPTION */}
      <td className="px-6 py-4.5 max-w-xs hidden lg:table-cell">
        <p className="text-xs text-slate-450 truncate font-medium" title={task.taskDescription}>
          {task.taskDescription}
        </p>
      </td>

      {/* 6. ACTIONS */}
      <td className="px-6 py-4.5 text-center">
        <div className="flex items-center justify-center gap-2.5">
          <button
            onClick={handleMark}
            disabled={isDone}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer shadow-sm border ${
              isDone
                ? "bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed"
                : "bg-[#059669] hover:bg-[#047857] text-white border-emerald-650 hover:shadow-md hover:scale-[1.02] active:scale-95"
            }`}
            title="Mark task status as completed"
           aria-label="Mark task status as completed">
            <CheckCircle2 size={13} />
            <span className="hidden sm:inline">Mark Complete</span>
          </button>

          <button
            onClick={handleView}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#0284C7] bg-[#E0F2FE] hover:bg-[#BAE6FD] hover:text-[#0369A1] transition-all duration-200 cursor-pointer shadow-sm border border-sky-100 hover:scale-[1.02] active:scale-95"
            title="View detailed description"
           aria-label="View detailed description">
            <Eye size={13} />
            <span className="hidden sm:inline">View Details</span>
          </button>
        </div>
      </td>
    </tr>
  );
});

export default function MyTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewingTask, setViewingTask] = useState(null);
  const [toast, setToast] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [renderLazy, setRenderLazy] = useState(false);
  const ITEMS_PER_PAGE = 15;

  useEffect(() => {
    const id = typeof window.requestIdleCallback === 'function'
      ? window.requestIdleCallback(() => setRenderLazy(true), { timeout: 200 })
      : setTimeout(() => setRenderLazy(true), 80);
    return () => {
      if (typeof window.cancelIdleCallback === 'function') window.cancelIdleCallback(id);
      else clearTimeout(id);
    };
  }, []);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(tasks.length / ITEMS_PER_PAGE)), [tasks.length]);
  
  const paginatedTasks = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return tasks.slice(start, start + ITEMS_PER_PAGE);
  }, [tasks, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [tasks.length]);

  const showToast = useCallback((message) => {
    setToast(message);
  }, []);

  // Proper cleanup of toast timeouts
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Fetch tasks dynamically on mount
  useEffect(() => {
    let active = true;
    const fetchTasks = async () => {
      try {
        setLoading(true);
        const response = await API.get("/tasks");
        
        if (!active) return;
        
        const rawData = response.data?.data || response.data || [];
        const parsed = Array.isArray(rawData) ? rawData.map((t) => ({
          id: t.id,
          taskName: t.title || t.taskName || "Untitled Task",
          assignedTo: t.assignee?.name || t.assignedTo || "Unassigned",
          dueDate: t.dueDate || "No Due Date",
          inRelationTo: t.project || t.inRelationTo || "General",
          taskDescription: t.description || t.taskDescription || "No description provided.",
          status: t.status || "Pending"
        })) : [];

        setTasks(parsed);
      } catch (err) {
        console.error("Error fetching tasks:", err);
        if (active) {
          showToast("Error loading tasks. Using sandbox mode.");
          setTasks([]);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchTasks();
    return () => {
      active = false;
    };
  }, [showToast]);

  // Mark task as complete with API put
  const handleMarkComplete = useCallback(async (id) => {
    try {
      await API.put(`/tasks/${id}`, { status: "Done" });
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status: "Done" } : t))
      );
      showToast("Task marked as completed successfully!");
    } catch (err) {
      console.error("Failed to update status back to database pipeline:", err);
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status: "Done" } : t))
      );
      showToast("Updated task status locally (sandbox mode).");
    }
  }, [showToast]);

  const handleExport = useCallback(() => {
    try {
      if (tasks.length === 0) {
        showToast("No tasks to export.");
        return;
      }
      const mapped = tasks.map(task => ({
        "Task Name": task.taskName,
        "Assigned To": task.assignedTo,
        "Due Date": task.dueDate,
        "In Relation To": task.inRelationTo,
        "Description": task.taskDescription,
        "Status": task.status
      }));
      exportToExcel(mapped, "Staff_Tasks_Export");
    } catch (err) {
      console.error("Failed to export tasks:", err);
      showToast("Failed to export tasks data.");
    }
  }, [tasks, showToast]);

  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
  }, []);

  const handleViewDetails = useCallback((task) => {
    setViewingTask(task);
  }, []);

  const handleCloseDetails = useCallback(() => {
    setViewingTask(null);
  }, []);

  return (
    <div className="space-y-6 w-full font-sans antialiased">
      {/* Toast Notification Banner */}
      {toast && (
        <div className="fixed top-5 right-5 bg-white border border-slate-200 text-slate-800 text-xs font-semibold px-4 py-3 rounded-lg shadow-md z-50 flex items-center">
          <span>{toast}</span>
        </div>
      )}

      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div className="text-left">
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight font-display">My Tasks</h2>
          <p className="text-sm text-slate-500 font-normal mt-0.5">Manage and track your operational integration tasks.</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleExport}
            disabled={tasks.length === 0}
            title={tasks.length === 0 ? "No data to export" : "Export to Excel"}
            className="inline-flex items-center gap-1.5 px-4 h-9 rounded-lg border border-indigo-200 hover:border-indigo-400 text-[#4F46E5] bg-[#4F46E5]/5 hover:bg-[#4F46E5]/10 text-sm font-medium transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
           aria-label={tasks.length === 0 ? "No data to export" : "Export to Excel"}>
            <Download size={15} />
            Export Data
          </button>
        </div>
      </div>

      {/* Table Canvas Grid Wrapper */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-300">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50">
                <th scope="col" className="px-6 py-4 text-[11px] font-bold text-slate-400 tracking-wider uppercase">
                  Task Name
                </th>
                <th scope="col" className="px-6 py-4 text-[11px] font-bold text-slate-400 tracking-wider uppercase hidden md:table-cell">
                  Assigned To
                </th>
                <th scope="col" className="px-6 py-4 text-[11px] font-bold text-slate-400 tracking-wider uppercase hidden sm:table-cell">
                  Due Date
                </th>
                <th scope="col" className="px-6 py-4 text-[11px] font-bold text-slate-400 tracking-wider uppercase hidden sm:table-cell">
                  In Relation To
                </th>
                <th scope="col" className="px-6 py-4 text-[11px] font-bold text-slate-400 tracking-wider uppercase hidden lg:table-cell">
                  Task Description
                </th>
                <th scope="col" className="px-6 py-4 text-[11px] font-bold text-slate-400 tracking-wider uppercase text-center">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading || !renderLazy ? (
                // Skeletons are height-locked to exactly 65px per row to guarantee zero layout shift
                [...Array(3)].map((_, i) => (
                  <tr key={i} className="animate-pulse h-[65px] border-b border-slate-100">
                    <td className="px-6 py-4.5"><div className="h-4 bg-slate-200 rounded w-3/4" /></td>
                    <td className="px-6 py-4.5 hidden md:table-cell"><div className="h-4 bg-slate-200 rounded w-1/2" /></td>
                    <td className="px-6 py-4.5 hidden sm:table-cell"><div className="h-4 bg-slate-200 rounded w-1/3" /></td>
                    <td className="px-6 py-4.5 hidden sm:table-cell"><div className="h-4 bg-slate-200 rounded w-2/3" /></td>
                    <td className="px-6 py-4.5 hidden lg:table-cell"><div className="h-4 bg-slate-200 rounded w-5/6" /></td>
                    <td className="px-6 py-4.5 flex justify-center items-center gap-2"><div className="h-8 bg-slate-200 rounded w-24" /></td>
                  </tr>
                ))
              ) : tasks.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-sm font-semibold text-slate-450 bg-slate-50/20">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <AlertCircle className="w-5 h-5 text-slate-400" />
                      <span className="text-slate-400">No tasks assigned. Waiting for Admin Panel synchronization.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedTasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    onMarkComplete={handleMarkComplete}
                    onViewDetails={handleViewDetails}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-4 border-t border-[#E2E8F0] bg-[#F8FAFC]/30">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={tasks.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={handlePageChange}
          />
        </div>
      </div>

      {/* Drawer/Modal for Task Details */}
      {viewingTask && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden transform transition-all scale-100 animate-zoom-in duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex flex-col text-left">
                <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">
                  Task Details
                </span>
                <h3 className="text-base font-bold text-slate-800 font-display mt-0.5">
                  {viewingTask.taskName}
                </h3>
              </div>
              <button
                onClick={handleCloseDetails}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 text-left">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-2 border-b border-slate-100">
                <div>
                  <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                    Assigned To
                  </span>
                  <span className="text-xs font-semibold text-slate-700 mt-0.5 block">
                    {viewingTask.assignedTo}
                  </span>
                </div>
                <div>
                  <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                    Due Date
                  </span>
                  <span className="text-xs font-semibold text-slate-700 mt-0.5 block">
                    {viewingTask.dueDate}
                  </span>
                </div>
                <div>
                  <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                    In Relation To
                  </span>
                  <span className="text-xs font-semibold text-slate-700 mt-0.5 block">
                    {viewingTask.inRelationTo}
                  </span>
                </div>
                <div>
                  <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                    Status
                  </span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold uppercase mt-1 ${
                    viewingTask.status?.toLowerCase() === "done" || viewingTask.status?.toLowerCase() === "completed"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                      : "bg-indigo-50 text-indigo-700 border border-indigo-100"
                  }`}>
                    {viewingTask.status}
                  </span>
                </div>
              </div>

              {/* Full Description text area */}
              <div className="space-y-1.5">
                <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                  Full Description
                </span>
                <div className="bg-slate-50/50 border border-slate-100 rounded-lg p-4 max-h-48 overflow-y-auto custom-scrollbar">
                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
                    {viewingTask.taskDescription}
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-150 flex justify-end gap-2.5">
              <button
                onClick={handleCloseDetails}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-350 text-slate-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
