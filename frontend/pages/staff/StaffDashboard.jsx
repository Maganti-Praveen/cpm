import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../../services/api";

const ProjectTimelineGantt = React.lazy(() => import("../../components/dashboard/ProjectTimelineGantt"));

const KpiSkeleton = () => (
  <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center gap-4 animate-pulse min-h-[88px]">
    <div className="w-12 h-12 bg-slate-100 rounded-full shrink-0" />
    <div className="flex-1 space-y-2 text-left">
      <div className="h-3 bg-slate-100 rounded w-24" />
      <div className="h-7 bg-slate-100 rounded w-12" />
    </div>
  </div>
);

const TableSkeleton = () => (
  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden text-left animate-pulse min-h-[240px]">
    <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
      <div className="h-4 bg-slate-100 rounded w-24" />
      <div className="h-4 bg-slate-100 rounded w-16" />
    </div>
    <div className="px-6 py-4 space-y-4">
      {[1, 2, 3].map(n => (
        <div key={n} className="grid grid-cols-4 gap-4 items-center">
          <div className="h-4 bg-slate-100 rounded col-span-2" />
          <div className="h-4 bg-slate-100 rounded" />
          <div className="h-4 bg-slate-100 rounded" />
        </div>
      ))}
    </div>
  </div>
);

const ProjectsSkeleton = () => (
  <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 text-left animate-pulse min-h-[160px]">
    <div className="h-4 bg-slate-100 rounded w-36 mb-6" />
    <div className="space-y-4">
      {[1, 2].map(n => (
        <div key={n} className="flex justify-between items-center gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-8 h-8 bg-slate-100 rounded-lg shrink-0" />
            <div className="h-4 bg-slate-100 rounded w-28" />
          </div>
          <div className="h-2 bg-slate-100 rounded-full w-32" />
        </div>
      ))}
    </div>
  </div>
);

export default function StaffDashboard() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [renderLazy, setRenderLazy] = useState(false);
  const [renderPhase2, setRenderPhase2] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [projectsRes, tasksRes] = await Promise.all([
        API.get("/projects"),
        API.get("/tasks")
      ]);

      const rawProjects = projectsRes.data?.data || [];
      setProjects(rawProjects);

      const rawTasks = tasksRes.data?.data || [];
      const mappedTasks = rawTasks.map((t) => ({
        id: t.id,
        name: t.title,
        project: t.project?.name || "General",
        status: t.status,
        priority: t.priority,
        dueDate: t.dueDate ? new Date(t.dueDate).toLocaleDateString() : "No Date"
      }));
      setTasks(mappedTasks);
    } catch (err) {
      console.error("Failed to load staff dashboard core data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const fetchTimer = setTimeout(() => {
      fetchData();
    }, 100);
    // Use requestIdleCallback to defer heavy component mounting to browser idle time.
    // On 4x throttled mobile CPUs, this lets the browser paint the critical KPI
    // skeletons before mounting the Gantt chart and task table.
    const scheduleDeferred = (cb) => {
      if (typeof window.requestIdleCallback === 'function') {
        return window.requestIdleCallback(cb, { timeout: 200 });
      }
      return setTimeout(cb, 80);
    };
    const cancelDeferred = (id) => {
      if (typeof window.cancelIdleCallback === 'function') {
        window.cancelIdleCallback(id);
      } else {
        clearTimeout(id);
      }
    };
    const id1 = scheduleDeferred(() => setRenderLazy(true));
    const id2 = setTimeout(() => setRenderPhase2(true), 250);
    return () => { cancelDeferred(id1); clearTimeout(id2); clearTimeout(fetchTimer); };
  }, [fetchData]);

  const openTasksCount = React.useMemo(() => tasks.filter(t => t.status !== "Done").length, [tasks]);
  const overdueTasksCount = React.useMemo(() => tasks.filter(t => t.status === "Overdue" || t.priority === "Critical").length, [tasks]);
  const upcomingDeadlinesCount = React.useMemo(() => tasks.filter(t => t.status !== "Done" && (t.priority === "High" || t.priority === "Critical")).length, [tasks]);

  return (
    <div className="space-y-6">
      {/* Stats Grid (KPI Row) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <>
            <KpiSkeleton />
            <KpiSkeleton />
            <KpiSkeleton />
          </>
        ) : (
          <>
            {/* KPI Card 1: Assigned Projects */}
            <Link to="/staff/projects" className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-4 cursor-pointer no-underline text-inherit min-h-[88px]">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center shrink-0">
                <svg className="w-6 h-6" width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="text-left space-y-0.5">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Assigned Projects</p>
                <p className="text-3xl font-extrabold text-slate-900">{projects.length}</p>
              </div>
            </Link>

            {/* KPI Card 2: Open Tasks */}
            <Link to="/staff/tasks" className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-4 cursor-pointer no-underline text-inherit min-h-[88px]">
              <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center shrink-0">
                <svg className="w-6 h-6" width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <div className="text-left space-y-0.5">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Open Tasks</p>
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-extrabold text-slate-900">
                    {openTasksCount}
                  </span>
                  {overdueTasksCount > 0 && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-extrabold tracking-wider bg-rose-50 text-rose-700 border border-rose-200 uppercase animate-pulse">
                      {overdueTasksCount} OVERDUE
                    </span>
                  )}
                </div>
              </div>
            </Link>

            {/* KPI Card 3: Upcoming Deadlines */}
            <Link to="/staff/tasks" className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-4 cursor-pointer no-underline text-inherit min-h-[88px]">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center shrink-0">
                <svg className="w-6 h-6" width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="text-left space-y-0.5">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Upcoming Deadlines</p>
                <p className="text-3xl font-extrabold text-slate-900">
                  {upcomingDeadlinesCount}
                </p>
              </div>
            </Link>
          </>
        )}
      </div>

      {/* Project Timeline & Gantt Widget — deferred to phase 2 */}
      {renderPhase2 ? (
        <Suspense fallback={
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 h-64 animate-pulse flex items-center justify-center">
            <span className="text-xs text-slate-400">Loading project timeline...</span>
          </div>
        }>
          <ProjectTimelineGantt
            projects={projects}
            loading={loading}
            userRole="STAFF"
            onRefresh={fetchData}
          />
        </Suspense>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 h-64 animate-pulse flex items-center justify-center">
          <span className="text-xs text-slate-400">Loading project timeline...</span>
        </div>
      )}

      {/* My Tasks Table Preview */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden text-left">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">My Tasks</h2>
          <button
            onClick={() => navigate("/staff/tasks")}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer bg-transparent border-none"
          >
            View All
          </button>
        </div>

        {loading || !renderLazy ? (
          <TableSkeleton />
        ) : (
          <div className="overflow-x-auto overflow-y-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50">
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-400 tracking-wider uppercase">Task Name</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-400 tracking-wider uppercase">Project</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-400 tracking-wider uppercase">Status</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-400 tracking-wider uppercase">Due Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tasks.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-xs text-slate-400 font-medium">
                      No tasks assigned for today
                    </td>
                  </tr>
                ) : (
                  tasks.slice(0, 4).map((task, idx) => {
                    const isOverdue = task.status === "Overdue" || task.priority === "Critical";
                    return (
                      <tr key={idx} className="hover:bg-slate-50/40 transition-colors">
                        <td className="px-6 py-4 text-xs font-bold text-slate-800">
                          <Link to="/staff/tasks" className="text-slate-800 hover:text-indigo-600 transition-colors no-underline">
                            {task.name}
                          </Link>
                        </td>
                        <td className="px-6 py-4 text-xs font-semibold text-slate-500">
                          <Link to="/staff/projects" className="text-slate-500 hover:text-indigo-600 transition-colors no-underline">
                            {task.project}
                          </Link>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase ${isOverdue
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : task.status === "In Progress"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-indigo-50 text-indigo-600 border border-indigo-200"
                            }`}>
                            <span className={`w-1 h-1 rounded-full ${isOverdue
                                ? "bg-rose-500"
                                : task.status === "In Progress"
                                  ? "bg-emerald-500"
                                  : "bg-indigo-500"
                              }`} />
                            {task.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs font-semibold text-slate-500">
                          <span className={isOverdue ? "text-rose-600 font-bold" : ""}>
                            {task.dueDate}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* My Projects Overview Progress Bars */}
      {loading || !renderPhase2 ? (
        <ProjectsSkeleton />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 text-left">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-5">My Projects Overview</h2>

          <div className="space-y-4">
            {projects.length === 0 ? (
              <div className="text-center text-xs text-slate-400 py-8 font-medium">
                No projects assigned.
              </div>
            ) : (
              projects.map((project, idx) => (
                <div key={idx} className="flex items-center justify-between gap-4 py-1">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-indigo-50 text-indigo-500 shrink-0">
                      <svg className="w-4.5 h-4.5" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <Link to="/staff/projects" className="text-xs font-bold text-slate-800 hover:text-indigo-600 transition-colors truncate no-underline">
                      {project.name}
                    </Link>
                  </div>

                  <div className="flex items-center gap-4 flex-1 justify-end max-w-md">
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden hidden sm:block">
                      <div className="h-full rounded-full transition-all duration-500 bg-indigo-600" style={{ width: `${project.progress}%` }} />
                    </div>
                    <span className="text-xs font-extrabold w-10 text-right text-indigo-600">
                      {project.progress}%
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
