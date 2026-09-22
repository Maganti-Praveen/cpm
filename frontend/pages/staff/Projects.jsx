import { useToast } from '../../context/ToastContext';
// Project roster highlighting active milestones and tasks assignments for staff.
// Outlines progress ratios.

import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { LayoutList, Columns3, Download } from 'lucide-react';
import ProjectFilters from '../../components/projects/ProjectFilters';
import { exportToExcel } from '../../utils/excelExport';

const ProjectsTable = React.lazy(() => import('../../components/projects/ProjectsTable'));
const ProjectsKanban = React.lazy(() => import('../../components/projects/ProjectsKanban'));
import Pagination from '../../components/projects/Pagination';
import { getProjects } from '../../services/projectService';

import { useNavigate } from 'react-router-dom';

const ITEMS_PER_PAGE = 4;

function StaffProjects({ onProjectClick }) {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('table');
  const [status, setStatus] = useState('All Statuses');
  const [client, setClient] = useState('All Clients');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
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

  // Fetch projects from backend API
  const fetchProjects = useCallback(() => {
    setLoading(true);
    const params = {};
    if (status !== 'All Statuses') params.status = status;
    if (client !== 'All Clients') params.client = client;
    if (search) params.search = search;

    getProjects(params)
      .then((res) => {
        const colors = ['#6366F1', '#059669', '#D97706', '#DC2626', '#0284C7', '#7C3AED'];
        const formatted = res.data.data.map((p) => ({
          id: p.id,
          name: p.name,
          client: p.client ? p.client.company : "Independent",
          progress: p.progress,
          status: p.status,
          startDate: p.startDate ? new Date(p.startDate).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : "N/A",
          dueDate: p.dueDate ? new Date(p.dueDate).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : "N/A",
          team: (p.team || []).map((m, idx) => ({
            id: m.id,
            name: m.fullName,
            color: colors[idx % colors.length],
            src: m.avatar || null
          }))
        }));
        setProjects(formatted);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading staff projects:", err);
        setLoading(false);
      });
  }, [status, client, search]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(projects.length / ITEMS_PER_PAGE));
  const paginatedProjects = useMemo(() => {
    return projects.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE
    );
  }, [projects, currentPage]);

  const handleStatusChange = (v) => { setStatus(v); setCurrentPage(1); };
  const handleClientChange = (v) => { setClient(v); setCurrentPage(1); };
  const handleSearchChange = (v) => { setSearch(v); setCurrentPage(1); };

  const handleProjectClick = (proj) => {
    if (onProjectClick) {
      onProjectClick(proj.id);
    } else {
      navigate(`/staff/projects/${proj.id}`);
    }
  };

  const handleExport = () => {
    try {
      if (projects.length === 0) {
        showToast("No projects to export.", "error");
        return;
      }
      const mapped = projects.map(proj => ({
        "Project ID": proj.id,
        "Project Name": proj.name,
        "Client": proj.client,
        "Progress (%)": proj.progress,
        "Status": proj.status,
        "Start Date": proj.startDate,
        "Due Date": proj.dueDate,
        "Team Members": proj.team.map(m => m.name).join(', ')
      }));
      exportToExcel(mapped, "Staff_Projects_Export");
    } catch (err) {
      console.error("Failed to export projects:", err);
      showToast("Failed to export projects data.", "error");
    }
  };

  return (
    <div className="font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-[1.75rem] font-bold text-[#0F172A] font-display">
            My Projects
          </h1>
          <p className="text-sm text-[#64748B] mt-1">
            Tracking detailed milestone progress rates across projects.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Export to Excel */}
          <button
            onClick={handleExport}
            disabled={projects.length === 0}
            title={projects.length === 0 ? "No data to export" : "Export to Excel"}
            className="inline-flex items-center gap-1.5 px-4 h-9 rounded-lg border border-indigo-200 hover:border-indigo-400 text-[#4F46E5] bg-[#4F46E5]/5 hover:bg-[#4F46E5]/10 text-sm font-medium transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
           aria-label={projects.length === 0 ? "No data to export" : "Export to Excel"}>
            <Download size={15} />
            Export Data
          </button>

          {/* View Toggle */}
          <div className="flex items-center border border-[#CBD5E1] rounded-lg overflow-hidden bg-white">
            <button
              onClick={() => setView('table')}
              className={`flex items-center gap-1.5 px-3 h-9 text-sm font-medium transition-colors cursor-pointer ${
                view === 'table'
                  ? 'bg-[#F1F5F9] text-[#0F172A]'
                  : 'text-[#64748B] hover:bg-[#F8FAFC]'
              }`}
            >
              <LayoutList size={16} />
              Table
            </button>
            <button
              onClick={() => setView('kanban')}
              className={`flex items-center gap-1.5 px-3 h-9 text-sm font-medium border-l border-[#CBD5E1] transition-colors cursor-pointer ${
                view === 'kanban'
                  ? 'bg-[#F1F5F9] text-[#0F172A]'
                  : 'text-[#64748B] hover:bg-[#F8FAFC]'
              }`}
            >
              <Columns3 size={16} />
              Kanban
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-5">
        <ProjectFilters
          status={status}
          client={client}
          search={search}
          onStatusChange={handleStatusChange}
          onClientChange={handleClientChange}
          onSearchChange={handleSearchChange}
          showClientFilter={true}
        />
      </div>

      {/* Loading Indicator or Staggered render */}
      {loading || !renderLazy ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-xl border border-[#E2E8F0] shadow-sm animate-pulse min-h-[320px]">
          <svg className="animate-spin h-8 w-8 text-[#4F46E5] mb-3" width="32" height="32" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-sm text-slate-500 font-medium">Loading projects...</span>
        </div>
      ) : (
        /* Table or Kanban View with Suspense */
        view === 'table' ? (
          <div className="bg-white rounded-xl shadow-sm p-0 overflow-hidden border border-[#E2E8F0]">
            <div className="px-5">
              <Suspense fallback={
                <div className="flex flex-col items-center justify-center py-24">
                  <span className="text-xs text-slate-400 font-medium">Loading table...</span>
                </div>
              }>
                <ProjectsTable projects={paginatedProjects} onClickRow={handleProjectClick} />
              </Suspense>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={projects.length}
                itemsPerPage={ITEMS_PER_PAGE}
                onPageChange={setCurrentPage}
              />
            </div>
            <div className="h-4" />
          </div>
        ) : (
          <Suspense fallback={
            <div className="flex flex-col items-center justify-center py-24 bg-white rounded-xl border border-[#E2E8F0] shadow-sm">
              <span className="text-xs text-slate-400 font-medium">Loading kanban board...</span>
            </div>
          }>
            <ProjectsKanban projects={projects} onClickCard={handleProjectClick} />
          </Suspense>
        )
      )}
    </div>
  );
}

export default StaffProjects;
