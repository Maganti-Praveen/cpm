import { useToast } from '../../context/ToastContext';
// Workspace focusing on tasks details and milestone timelines for client projects.
// Displays status checks.

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutList, Columns3, Download } from 'lucide-react';
import ProjectFilters from '../../components/projects/ProjectFilters';
import { exportToExcel } from '../../utils/excelExport';

import ProjectsTable from '../../components/projects/ProjectsTable';
import ProjectsKanban from '../../components/projects/ProjectsKanban';
import Pagination from '../../components/projects/Pagination';
import { getProjects } from '../../services/projectService';

const ITEMS_PER_PAGE = 4;

function ClientProjects() {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('table');
  const [status, setStatus] = useState('All Statuses');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch projects from backend API
  const fetchProjects = useCallback(() => {
    setLoading(true);
    const params = {};
    if (status !== 'All Statuses') params.status = status;
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
        console.error("Error loading client projects:", err);
        setLoading(false);
      });
  }, [status, search]);

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
  const handleSearchChange = (v) => { setSearch(v); setCurrentPage(1); };

  const handleProjectClick = (proj) => {
    navigate(`/client/projects/${proj.id}`);
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
      exportToExcel(mapped, "Client_Projects_Export");
    } catch (err) {
      console.error("Failed to export projects:", err);
      showToast("Failed to export projects data.", "error");
    }
  };

  return (
    <div className="font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6 text-left">
        <div>
          <h1 className="text-[1.75rem] font-bold text-[#0F172A] font-display">
            My Projects
          </h1>
          <p className="text-sm text-[#64748B] mt-1">
            Monitor scope, milestone completion, and progress status of all your projects with Sai IT Services.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
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
          search={search}
          onStatusChange={handleStatusChange}
          onSearchChange={handleSearchChange}
          showClientFilter={false}
        />
      </div>

      {/* Table or Kanban View */}
      {loading ? (
        <div className="bg-white rounded-xl shadow-sm border border-[#E2E8F0] p-6 animate-pulse space-y-4">
          <div className="h-4 bg-slate-100 rounded-md w-1/4" />
          <div className="h-8 bg-slate-100 rounded-md w-full" />
          <div className="h-8 bg-slate-100 rounded-md w-full" />
          <div className="h-8 bg-slate-100 rounded-md w-full" />
        </div>
      ) : view === 'table' ? (
        <div className="bg-white rounded-xl shadow-sm p-0 overflow-hidden border border-[#E2E8F0]">
          <div className="px-5">
            <ProjectsTable projects={paginatedProjects} onClickRow={handleProjectClick} />
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
        <ProjectsKanban projects={projects} onClickCard={handleProjectClick} />
      )}
    </div>
  );
}

export default ClientProjects;
