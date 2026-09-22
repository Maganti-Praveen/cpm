import React, { useState, useMemo } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Settings, 
  Edit3, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Sliders, 
  Eye, 
  List, 
  Filter 
} from "lucide-react";
import API from "../../services/api";

export default function ProjectTimelineGantt({ projects = [], loading = false, userRole = "CLIENT", onRefresh }) {
  const [viewMode, setViewMode] = useState(() => {
    return typeof window !== "undefined" && window.innerWidth < 768 ? "list" : "gantt";
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  
  // Date viewport range (controls current calendar window)
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  
  // Modal Edit States
  const [editingProject, setEditingProject] = useState(null);
  const [editingMilestone, setEditingMilestone] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const { user } = useSelector((state) => state.auth);

  const userPermissions = useMemo(() => {
    let perms = {};
    if (!user || user.role !== 'ADMIN') return perms;
    if (user.isSuperAdmin === true) return null;

    if (typeof user.permissions === 'string') {
      try {
        perms = JSON.parse(user.permissions);
      } catch (_) {
        perms = {};
      }
    } else if (user.permissions && typeof user.permissions === 'object') {
      perms = user.permissions;
    }
    return perms;
  }, [user]);

  const canEditProjectDates = useMemo(() => {
    if (!user) return false;
    if (user.role === "STAFF") return true;
    if (user.role !== "ADMIN") return false;
    if (user.isSuperAdmin === true) return true;
    return !!userPermissions.projects;
  }, [user, userPermissions]);

  const canEditMilestones = useMemo(() => {
    if (!user) return false;
    if (user.role === "STAFF") return true;
    if (user.role !== "ADMIN") return false;
    if (user.isSuperAdmin === true) return true;
    return !!userPermissions.milestones;
  }, [user, userPermissions]);

  // Filter projects
  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      let clientName = "Independent";
      if (p.client) {
        if (typeof p.client === "object") {
          clientName = p.client.company || p.client.fullName || "Independent";
        } else if (typeof p.client === "string") {
          clientName = p.client;
        }
      }
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        clientName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "All" || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [projects, searchQuery, statusFilter]);

  // Standardize project dates for timeline calculations
  const projectsWithDates = useMemo(() => {
    return filteredProjects.map(p => {
      const now = new Date();
      // Ensure we have a valid start date (fallback to createdAt or now)
      const start = p.startDate ? new Date(p.startDate) : new Date(now.getFullYear(), now.getMonth() - 1, 1);
      // Ensure we have a valid end date (fallback to dueDate or now + 1 month)
      const end = p.rawDueDate ? new Date(p.rawDueDate) : (p.dueDate && p.dueDate !== "N/A" ? new Date(p.dueDate) : new Date(now.getFullYear(), now.getMonth() + 2, 1));
      
      let clientName = "Independent";
      if (p.client) {
        if (typeof p.client === "object") {
          clientName = p.client.company || p.client.fullName || "Independent";
        } else if (typeof p.client === "string") {
          clientName = p.client;
        }
      }

      return {
        ...p,
        clientName,
        startDateObj: start,
        dueDateObj: end,
        milestones: (p.milestones || []).map(m => ({
          ...m,
          dateObj: m.date ? new Date(m.date) : null
        }))
      };
    });
  }, [filteredProjects]);

  // Calendar Months Definition
  const months = [
    { name: "Jan", index: 0 },
    { name: "Feb", index: 1 },
    { name: "Mar", index: 2 },
    { name: "Apr", index: 3 },
    { name: "May", index: 4 },
    { name: "Jun", index: 5 },
    { name: "Jul", index: 6 },
    { name: "Aug", index: 7 },
    { name: "Sep", index: 8 },
    { name: "Oct", index: 9 },
    { name: "Nov", index: 10 },
    { name: "Dec", index: 11 }
  ];

  // Gantt Chart coordinates calculation helper
  // Determines left % and width % within the active year
  const getGanttPlacement = (start, end) => {
    const yearStart = new Date(currentYear, 0, 1);
    const yearEnd = new Date(currentYear, 11, 31);
    
    // Clamp project dates to year boundaries for layout display
    const clampedStart = start < yearStart ? yearStart : start;
    const clampedEnd = end > yearEnd ? yearEnd : end;
    
    if (clampedEnd < yearStart || clampedStart > yearEnd) {
      return { show: false, left: 0, width: 0 };
    }
    
    const yearDuration = yearEnd - yearStart;
    const projectDuration = clampedEnd - clampedStart;
    const offset = clampedStart - yearStart;
    
    const left = (offset / yearDuration) * 100;
    const width = Math.max((projectDuration / yearDuration) * 100, 4); // Min 4% width so it's visible
    
    return { show: true, left, width };
  };

  // Milestone marker coordinate calculation helper
  const getMilestonePlacement = (mDate) => {
    if (!mDate) return { show: false, left: 0 };
    const yearStart = new Date(currentYear, 0, 1);
    const yearEnd = new Date(currentYear, 11, 31);
    
    if (mDate < yearStart || mDate > yearEnd) {
      return { show: false, left: 0 };
    }
    
    const yearDuration = yearEnd - yearStart;
    const offset = mDate - yearStart;
    const left = (offset / yearDuration) * 100;
    
    return { show: true, left };
  };

  // Save project date updates
  const handleSaveProjectDates = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveError("");
    try {
      await API.put(`/projects/${editingProject.id}`, {
        startDate: editingProject.startDate,
        dueDate: editingProject.dueDate
      });
      setEditingProject(null);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(err);
      setSaveError(err.response?.data?.message || "Failed to update project dates");
    } finally {
      setSaving(false);
    }
  };

  // Save milestone updates
  const handleSaveMilestone = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveError("");
    try {
      await API.put(`/milestones/${editingMilestone.id}`, {
        title: editingMilestone.title,
        date: editingMilestone.date,
        progress: parseInt(editingMilestone.progress),
        status: editingMilestone.status
      });
      setEditingMilestone(null);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(err);
      setSaveError(err.response?.data?.message || "Failed to update milestone");
    } finally {
      setSaving(false);
    }
  };

  // Render Milestones Checkpoints view
  const renderMilestonesTimeline = () => {
    const allMilestones = [];
    projectsWithDates.forEach(p => {
      p.milestones.forEach(m => {
        allMilestones.push({
          ...m,
          projectName: p.name,
          projectId: p.id
        });
      });
    });

    // Sort by date ascending
    allMilestones.sort((a, b) => {
      if (!a.dateObj) return 1;
      if (!b.dateObj) return -1;
      return a.dateObj - b.dateObj;
    });

    if (allMilestones.length === 0) {
      return (
        <div className="text-center py-10 bg-slate-50/50 rounded-xl border border-slate-100 mt-4">
          <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-xs text-slate-400 font-medium">No milestone checkpoints set for these projects.</p>
        </div>
      );
    }

    return (
      <div className="mt-6 space-y-4">
        <div className="relative border-l-2 border-indigo-100 pl-6 ml-4 space-y-6">
          {allMilestones.map((m) => {
            const isOverdue = m.dateObj && m.dateObj < new Date() && m.status !== "Completed";
            return (
              <div key={m.id} className="relative group">
                {/* Node indicator */}
                <div className={`absolute -left-[31px] top-1 w-4 h-4 rounded-full border-2 bg-white flex items-center justify-center transition-transform duration-200 group-hover:scale-125 ${
                  m.status === "Completed" ? "border-emerald-500 bg-emerald-50" : 
                  isOverdue ? "border-rose-500 bg-rose-50 animate-pulse" : "border-indigo-500 bg-indigo-50"
                }`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${
                    m.status === "Completed" ? "bg-emerald-500" : 
                    isOverdue ? "bg-rose-500" : "bg-indigo-500"
                  }`} />
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-all duration-300">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div>
                      <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md uppercase tracking-wider block w-fit mb-1">
                        {m.projectName}
                      </span>
                      <h4 className="text-sm font-bold text-slate-800">{m.title}</h4>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase border ${
                        m.status === "Completed" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                        isOverdue ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-indigo-50 text-indigo-700 border-indigo-200"
                      }`}>
                        {m.status}
                      </span>

                      {canEditMilestones && (
                        <button
                          onClick={() => setEditingMilestone({
                            id: m.id,
                            title: m.title,
                            date: m.date ? m.date.substring(0, 10) : "",
                            progress: m.progress,
                            status: m.status
                          })}
                          className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                          title="Edit Milestone Details"
                         aria-label="Edit Milestone Details">
                          <Edit3 size={13} />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                    <span className="flex items-center gap-1">
                      <Calendar size={13} />
                      Target Date: {m.dateObj ? m.dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Unscheduled"}
                    </span>
                    <span className="font-bold text-slate-500">
                      Progress: {m.progress}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="hidden md:block bg-white rounded-2xl p-6 border border-slate-200 shadow-sm transition-all duration-300">
      
      {/* Widget Header & Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5 mb-5">
        <div>
          <h2 className="text-lg font-bold text-slate-800 font-display flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-500" />
            Project Timeline &amp; Gantt
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Monitor phase schedules, track completion windows, and map upcoming milestones.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
          {/* Search bar */}
          <div className="relative w-full sm:w-auto">
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-48 pl-3 pr-8 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-500"
             aria-label="Search projects..."/>
          </div>

          {/* Status Filter */}
          <div className="relative w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-auto text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 text-slate-600 font-semibold cursor-pointer"
              aria-label="Filter projects by status">
              <option value="All">All Statuses</option>
              <option value="Planning">Planning</option>
              <option value="In Progress">In Progress</option>
              <option value="Review">Review</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          {/* View Toggles */}
          <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden shrink-0 bg-slate-50 p-0.5 w-full sm:w-auto justify-center sm:justify-start">
            <button
              onClick={() => setViewMode("gantt")}
              className={`px-3 py-1.5 text-xs font-bold rounded-md flex items-center gap-1.5 transition-all duration-200 border-none cursor-pointer flex-1 sm:flex-initial justify-center ${
                viewMode === "gantt" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Sliders size={13} />
              Gantt View
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-1.5 text-xs font-bold rounded-md flex items-center gap-1.5 transition-all duration-200 border-none cursor-pointer flex-1 sm:flex-initial justify-center ${
                viewMode === "list" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <List size={13} />
              Milestones View
            </button>
          </div>
        </div>
      </div>

      {/* Gantt View Controls */}
      {viewMode === "gantt" && (
        <div className="flex items-center justify-between mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setCurrentYear(prev => prev - 1)}
              className="p-1 rounded-md bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 cursor-pointer"
              aria-label="Previous year"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs font-extrabold text-slate-700 tracking-wider">
              {currentYear} Calendar Year
            </span>
            <button 
              onClick={() => setCurrentYear(prev => prev + 1)}
              className="p-1 rounded-md bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 cursor-pointer"
              aria-label="Next year"
            >
              <ChevronRight size={16} />
            </button>
          </div>
          
          <div className="flex items-center gap-3 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-indigo-500 inline-block" /> Active Phase</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-indigo-200 inline-block" /> Planned Phase</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full border border-indigo-500 bg-white inline-block w-2 h-2" /> Milestone</span>
          </div>
        </div>
      )}

      {/* Main Timeline Render Block */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-6 bg-slate-100 rounded w-full" />
          <div className="h-10 bg-slate-100 rounded w-full" />
          <div className="h-10 bg-slate-100 rounded w-full" />
        </div>
      ) : projectsWithDates.length === 0 ? (
        <div className="text-center py-12 bg-slate-50/50 rounded-2xl border border-slate-100">
          <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500 font-semibold">No project details found.</p>
          <p className="text-xs text-slate-400 mt-1">Adjust your filter parameters or create new projects.</p>
        </div>
      ) : viewMode === "gantt" ? (
        <div className="overflow-x-auto border border-slate-100 rounded-xl">
          <div className="min-w-[800px] bg-white">
            
            {/* Calendar timeline header */}
            <div className="flex border-b border-slate-100 bg-slate-50/40">
              <div className="w-[220px] shrink-0 border-r border-slate-100 p-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-left sticky left-0 bg-slate-50 z-20">
                Projects List
              </div>
              <div className="flex-1 grid grid-cols-12 relative">
                {months.map((m) => (
                  <div 
                    key={m.index} 
                    className="p-3 text-center text-xs font-bold text-slate-400 border-r border-slate-100 last:border-r-0"
                  >
                    {m.name}
                  </div>
                ))}
              </div>
            </div>

            {/* Project Rows Grid */}
            <div className="divide-y divide-slate-100">
              {projectsWithDates.map((proj) => {
                const placement = getGanttPlacement(proj.startDateObj, proj.dueDateObj);
                
                return (
                  <div key={proj.id} className="flex hover:bg-slate-50/20 transition-all duration-150">
                    {/* Left Column (Info) */}
                    <div className="w-[220px] shrink-0 border-r border-slate-100 p-3.5 text-left flex flex-col justify-center min-w-0 sticky left-0 bg-white z-10 shadow-[2px_0_5px_rgba(0,0,0,0.03)]">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-xs font-bold text-slate-800 truncate block max-w-[140px] font-display" title={proj.name}>
                          {proj.name}
                        </span>
                        
                        {canEditProjectDates && (
                          <button
                            onClick={() => setEditingProject({
                              id: proj.id,
                              name: proj.name,
                              startDate: proj.startDate ? proj.startDate.substring(0, 10) : "",
                              dueDate: proj.rawDueDate ? proj.rawDueDate.substring(0, 10) : ""
                            })}
                            className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors shrink-0"
                            title="Edit Phase Schedule"
                           aria-label="Edit Phase Schedule">
                            <Edit3 size={12} />
                          </button>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400 mt-0.5">
                        <span className="truncate max-w-[100px]">{proj.clientName}</span>
                        <span className="text-indigo-600 font-extrabold">{proj.progress}%</span>
                      </div>
                    </div>

                    {/* Right Column (Bar Track Area) */}
                    <div className="flex-1 grid grid-cols-12 relative items-center py-4 bg-slate-50/10">
                      {/* Drawing Vertical grid column guides */}
                      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((idx) => (
                        <div key={idx} className="absolute top-0 bottom-0 border-r border-slate-100/50" style={{ left: `${(idx + 1) * (100 / 12)}%` }} />
                      ))}

                      {/* Horizontal Duration bar */}
                      {placement.show ? (
                        <div 
                          className="absolute h-7 rounded-xl bg-indigo-50 border border-indigo-100 shadow-xs flex items-center transition-all duration-300 group/bar select-none"
                          style={{ 
                            left: `${placement.left}%`, 
                            width: `${placement.width}%`,
                            top: '50%',
                            transform: 'translateY(-50%)'
                          }}
                        >
                          {/* Inner Progress overlay */}
                          <div 
                            className="absolute left-0 top-0 bottom-0 bg-indigo-500/15 rounded-l-xl transition-all duration-500" 
                            style={{ 
                              width: `${proj.progress}%`,
                              borderRadius: proj.progress >= 100 ? '11px' : '11px 0 0 11px' 
                            }} 
                          />

                          {/* Float details indicator */}
                          <span className="absolute left-3 text-[10px] font-bold text-indigo-700 truncate max-w-full z-10 pointer-events-none uppercase tracking-wide">
                            {proj.progress}% Completed
                          </span>

                          {/* Plotted Milestones Checkpoints inside bar */}
                          {proj.milestones.map((m) => {
                            const mPlacement = getMilestonePlacement(m.dateObj);
                            if (!mPlacement.show) return null;
                            
                            // Map local offset relative to project bar container width
                            const offsetPct = ((m.dateObj - proj.startDateObj) / (proj.dueDateObj - proj.startDateObj)) * 100;
                            // Clamp between 2% and 98% to avoid leaking
                            const clampedOffset = Math.max(Math.min(offsetPct, 96), 4);
                            const isOverdue = m.dateObj < new Date() && m.status !== "Completed";

                            return (
                              <button
                                key={m.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingMilestone({
                                    id: m.id,
                                    title: m.title,
                                    date: m.date ? m.date.substring(0, 10) : "",
                                    progress: m.progress,
                                    status: m.status
                                  });
                                }}
                                className={`absolute w-3.5 h-3.5 rotate-45 border-2 rounded bg-white flex items-center justify-center cursor-pointer shadow-xs transition-transform duration-200 hover:scale-130 z-20 ${
                                  m.status === "Completed" ? "border-emerald-500 hover:bg-emerald-50" : 
                                  isOverdue ? "border-rose-500 hover:bg-rose-50 animate-pulse" : "border-indigo-500 hover:bg-indigo-50"
                                }`}
                                style={{ left: `${clampedOffset}%` }}
                                title={`${m.title} (${m.status} - ${m.progress}%)`}
                               aria-label={`${m.title} (${m.status} - ${m.progress}%)`}/>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-[10px] font-semibold text-slate-400 pl-4 uppercase tracking-wider select-none">
                          Outside timeline viewport
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </div>
      ) : (
        renderMilestonesTimeline()
      )}

      {/* MODAL 1: Project Dates Editor */}
      {editingProject && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 text-left">
            <h3 className="text-base font-bold text-slate-800 font-display mb-4">
              Edit Timeline Schedule: {editingProject.name}
            </h3>

            {saveError && (
              <div className="bg-rose-50 text-rose-600 border border-rose-100 rounded-lg p-3 text-xs mb-4">
                {saveError}
              </div>
            )}

            <form onSubmit={handleSaveProjectDates} className="space-y-4">
              <div>
                <label htmlFor="gantt-project-start-date" className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">
                  Phase Start Date
                </label>
                <input
                  id="gantt-project-start-date"
                  type="date"
                  value={editingProject.startDate}
                  onChange={(e) => setEditingProject({ ...editingProject, startDate: e.target.value })}
                  className="w-full text-sm border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-indigo-500"
                  required
                  aria-label="Phase start date"/>
              </div>

              <div>
                <label htmlFor="gantt-project-due-date" className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">
                  Target Due Date
                </label>
                <input
                  id="gantt-project-due-date"
                  type="date"
                  value={editingProject.dueDate}
                  onChange={(e) => setEditingProject({ ...editingProject, dueDate: e.target.value })}
                  className="w-full text-sm border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-indigo-500"
                  required
                  aria-label="Target due date"/>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingProject(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50 cursor-pointer bg-transparent"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 disabled:opacity-50 cursor-pointer border-none shadow-xs"
                >
                  {saving ? "Saving..." : "Save Schedule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Milestone Editor */}
      {editingMilestone && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 text-left">
            <h3 className="text-base font-bold text-slate-800 font-display mb-4 flex items-center justify-between">
              <span>Edit Milestone Checkpoint</span>
              {!canEditMilestones && <span className="text-[10px] font-extrabold text-amber-600 bg-amber-50 px-2 py-0.5 rounded uppercase tracking-wider">Read Only</span>}
            </h3>

            {saveError && (
              <div className="bg-rose-50 text-rose-600 border border-rose-100 rounded-lg p-3 text-xs mb-4">
                {saveError}
              </div>
            )}

            <form onSubmit={handleSaveMilestone} className="space-y-4">
              <div>
                <label htmlFor="gantt-milestone-name" className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">
                  Milestone Name
                </label>
                <input
                  id="gantt-milestone-name"
                  type="text"
                  value={editingMilestone.title}
                  onChange={(e) => setEditingMilestone({ ...editingMilestone, title: e.target.value })}
                  className="w-full text-sm border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-indigo-500"
                  required
                  disabled={!canEditMilestones}
                  aria-label="Milestone name"
                />
              </div>

              <div>
                <label htmlFor="gantt-milestone-date" className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">
                  Scheduled Checkpoint Date
                </label>
                <input
                  id="gantt-milestone-date"
                  type="date"
                  value={editingMilestone.date}
                  onChange={(e) => setEditingMilestone({ ...editingMilestone, date: e.target.value })}
                  className="w-full text-sm border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-indigo-500"
                  required
                  disabled={!canEditMilestones}
                  aria-label="Scheduled checkpoint date"
                />
              </div>

              <div>
                <label htmlFor="gantt-milestone-progress" className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">
                  Checkpoint Progress Completion ({editingMilestone.progress}%)
                </label>
                <input
                  id="gantt-milestone-progress"
                  type="range"
                  min="0"
                  max="100"
                  value={editingMilestone.progress}
                  onChange={(e) => setEditingMilestone({ ...editingMilestone, progress: e.target.value })}
                  className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  disabled={!canEditMilestones}
                  aria-label="Checkpoint progress percentage"
                />
              </div>

              <div>
                <label htmlFor="gantt-milestone-status" className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">
                  Status State
                </label>
                <select
                  id="gantt-milestone-status"
                  value={editingMilestone.status}
                  onChange={(e) => setEditingMilestone({ ...editingMilestone, status: e.target.value })}
                  className="w-full text-sm bg-white border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-indigo-500 text-slate-600 font-semibold cursor-pointer"
                  disabled={!canEditMilestones}
                >
                  <option value="Planning">Planning</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Review">Review</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingMilestone(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50 cursor-pointer bg-transparent"
                >
                  {canEditMilestones ? "Cancel" : "Close"}
                </button>
                {canEditMilestones && (
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 disabled:opacity-50 cursor-pointer border-none shadow-xs"
                  >
                    {saving ? "Saving..." : "Save Milestone"}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
