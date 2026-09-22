// Admin module organizing active projects list and adding new project profiles.
// Details budgets summaries.

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, LayoutList, Columns3, Download, Upload } from 'lucide-react';
import { exportToExcel } from '../../utils/excelExport';
import ProjectFilters from '../../components/projects/ProjectFilters';
import ProjectsTable from '../../components/projects/ProjectsTable';
import ProjectsKanban from '../../components/projects/ProjectsKanban';
import Pagination from '../../components/projects/Pagination';
import NewProjectModal from '../../components/projects/NewProjectModal';
import BulkActionBar from '../../components/projects/BulkActionBar';
import BulkEditModal from '../../components/projects/BulkEditModal';
import ImportProjectsModal from '../../components/projects/ImportProjectsModal';
import {
  getProjects,
  createProject,
  deleteProject,
  bulkDeleteProjects,
  bulkUpdateProjects
} from '../../services/projectService';
import { useToast } from '../../context/ToastContext';

const ITEMS_PER_PAGE = 4;

// Main project portfolio page organizing tables list and progress statistics
function AdminProjects() {
  const { showToast } = useToast();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('table');
  const [status, setStatus] = useState('All Statuses');
  const [client, setClient] = useState('All Clients');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);

  // Advanced selection and modal states
  const [selectedProjectIds, setSelectedProjectIds] = useState([]);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);
  const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // Handle Export to Excel
  const handleExport = useCallback(() => {
    try {
      if (projects.length === 0) {
        showToast("No data available to export!", "error");
        return;
      }
      const mapped = projects.map(proj => ({
        "Project Name": proj.name || '',
        "Client / Company": proj.client || '',
        "Progress (%)": proj.progress || 0,
        "Status": proj.status || '',
        "Start Date": proj.startDate || '',
        "Due Date": proj.dueDate || '',
        "Team Members": (proj.team || []).map(m => m.name).join(', ')
      }));
      exportToExcel(mapped, "Projects");
    } catch (err) {
      console.error("Failed to export projects:", err);
      showToast("Failed to export projects data.", "error");
    }
  }, [projects, showToast]);

  // Fetch projects from backend API
  const fetchProjects = useCallback(() => {
    setLoading(true);
    // Clear selection on new fetch to prevent checkbox mismatch
    setSelectedProjectIds([]);
    const params = {};
    if (status !== 'All Statuses') params.status = status;
    if (client !== 'All Clients') params.client = client;
    if (search) params.search = search;

    getProjects(params)
      .then((res) => {
        // Format projects to fit ProjectsTable / ProjectsKanban expectations
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
        console.error("Error loading projects:", err);
        setLoading(false);
      });
  }, [status, client, search]);

  // Load on mount and filter changes
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Handle new project submission
  const handleCreateProject = useCallback((newProj) => {
    createProject(newProj)
      .then(() => {
        showToast("Project created successfully");
        fetchProjects();
      })
      .catch((err) => {
        console.error("Error creating project:", err);
        showToast("Failed to create project", "error");
      });
  }, [fetchProjects, showToast]);

  // Open project delete confirmation modal
  const handleDeleteProject = useCallback((project) => {
    setProjectToDelete(project);
  }, []);

  // Confirm delete project action
  const handleConfirmDeleteProject = useCallback(() => {
    if (!projectToDelete) return;
    deleteProject(projectToDelete.id)
      .then(() => {
        showToast("Project deleted successfully");
        setProjectToDelete(null);
        fetchProjects();
      })
      .catch((err) => {
        console.error("Error deleting project:", err);
        showToast("Failed to delete project", "error");
      });
  }, [projectToDelete, fetchProjects, showToast]);

  // Confirm bulk delete action
  const handleConfirmBulkDelete = useCallback(() => {
    if (selectedProjectIds.length === 0) return;
    setBulkDeleting(true);
    bulkDeleteProjects(selectedProjectIds)
      .then(() => {
        showToast(`Successfully deleted ${selectedProjectIds.length} projects`);
        setSelectedProjectIds([]);
        setIsBulkDeleteConfirmOpen(false);
        setBulkDeleting(false);
        fetchProjects();
      })
      .catch((err) => {
        console.error("Error bulk deleting projects:", err);
        showToast("Failed to bulk delete projects", "error");
        setBulkDeleting(false);
      });
  }, [selectedProjectIds, fetchProjects, showToast]);

  // Handle bulk update changes
  const handleBulkUpdate = useCallback((updates) => {
    return bulkUpdateProjects({ ids: selectedProjectIds, ...updates })
      .then(() => {
        showToast(`Successfully updated ${selectedProjectIds.length} projects`);
        setSelectedProjectIds([]);
        fetchProjects();
      });
  }, [selectedProjectIds, fetchProjects, showToast]);

  // Pagination calculations
  const totalPages = useMemo(() => Math.max(1, Math.ceil(projects.length / ITEMS_PER_PAGE)), [projects.length]);
  // Computes dynamic subset arrays to isolate page ranges of projects
  const paginatedProjects = useMemo(() => {
    return projects.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE
    );
  }, [projects, currentPage]);

  // Reset to page 1 on filter changes
  const handleStatusChange = useCallback((v) => { setStatus(v); setCurrentPage(1); }, []);
  const handleClientChange = useCallback((v) => { setClient(v); setCurrentPage(1); }, []);
  const handleSearchChange = useCallback((v) => { setSearch(v); setCurrentPage(1); }, []);

  return (
    <div>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4 font-sans">
        <div>
          <h1 className="text-[1.75rem] font-bold text-[#0F172A] font-display">
            Projects
          </h1>
          <p className="text-sm text-[#64748B] mt-1">
            Manage and track all ongoing corporate resource planning initiatives.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto shrink-0">
          {/* Import Projects */}
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 h-9 rounded-lg border border-slate-200 hover:border-indigo-400 text-slate-700 bg-white hover:bg-slate-50 text-sm font-medium transition-all duration-150 cursor-pointer"
            title="Import Projects from Excel/CSV"
           aria-label="Import Projects from Excel/CSV">
            <Upload size={15} />
            Import
          </button>

          {/* Export Data */}
          <button
            onClick={handleExport}
            disabled={projects.length === 0}
            title={projects.length === 0 ? "No data available to export!" : "Export to Excel"}
            className="inline-flex items-center gap-1.5 px-4 h-9 rounded-lg border border-indigo-200 hover:border-indigo-400 text-[#4F46E5] bg-[#4F46E5]/5 hover:bg-[#4F46E5]/10 text-sm font-medium transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
           aria-label={projects.length === 0 ? "No data available to export!" : "Export to Excel"}>
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

          {/* New Project */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center gap-1.5 px-4 h-9 rounded-lg bg-[#4F46E5] text-sm font-medium text-white hover:bg-[#3730A3] transition-all duration-150 cursor-pointer shadow-sm flex-1 sm:flex-none"
          >
            <Plus size={16} />
            New Project
          </button>
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
        />
      </div>

      {/* Loading Indicator */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-xl border border-[#E2E8F0] shadow-sm">
          <svg className="animate-spin h-8 w-8 text-[#4F46E5] mb-3" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-sm text-slate-500 font-medium">Loading projects...</span>
        </div>
      ) : (
        /* Table or Kanban View */
        view === 'table' ? (
          <div className="bg-white rounded-xl shadow-sm p-0 overflow-hidden border border-[#E2E8F0] font-sans">
            <div className="px-5">
              <ProjectsTable
                projects={paginatedProjects}
                onDeleteClick={handleDeleteProject}
                selectedIds={selectedProjectIds}
                onSelectAll={(checked) => {
                  if (checked) {
                    const pageIds = paginatedProjects.map((p) => p.id);
                    setSelectedProjectIds(pageIds);
                  } else {
                    setSelectedProjectIds([]);
                  }
                }}
                onSelectRow={(id) => {
                  setSelectedProjectIds((prev) =>
                    prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
                  );
                }}
              />
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
          <ProjectsKanban projects={projects} />
        )
      )}

      {/* Floating Bulk Action Bar */}
      {view === 'table' && (
        <BulkActionBar
          selectedCount={selectedProjectIds.length}
          onClear={() => setSelectedProjectIds([])}
          onBulkEdit={() => setIsBulkEditModalOpen(true)}
          onBulkDelete={() => setIsBulkDeleteConfirmOpen(true)}
        />
      )}

      {/* Project Creation Overlay Modal */}
      <NewProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleCreateProject}
      />

      {/* Bulk Edit Modal */}
      <BulkEditModal
        isOpen={isBulkEditModalOpen}
        onClose={() => setIsBulkEditModalOpen(false)}
        selectedCount={selectedProjectIds.length}
        onSave={handleBulkUpdate}
      />

      {/* Project Import Modal */}
      <ImportProjectsModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={fetchProjects}
      />

      {/* Single Delete Confirmation Modal */}
      {projectToDelete && (
        <div className="fixed inset-0 bg-[#0f172a]/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in font-sans">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-sm overflow-hidden animate-scale-up p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 font-display">Confirm Deletion</h3>
            <p className="text-xs text-slate-500 leading-normal">
              Are you sure you want to permanently delete project <strong>{projectToDelete.name}</strong>? All associated tasks, milestones, deliverables, and documents will also be permanently deleted. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setProjectToDelete(null)}
                className="px-4 h-9 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDeleteProject}
                className="px-4 h-9 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {isBulkDeleteConfirmOpen && (
        <div className="fixed inset-0 bg-[#0f172a]/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in font-sans">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-sm overflow-hidden animate-scale-up p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 font-display">Confirm Bulk Deletion</h3>
            <p className="text-xs text-slate-500 leading-normal">
              Are you sure you want to permanently delete the <strong>{selectedProjectIds.length}</strong> selected projects? All associated tasks, milestones, deliverables, and documents will also be permanently deleted. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setIsBulkDeleteConfirmOpen(false)}
                className="px-4 h-9 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmBulkDelete}
                disabled={bulkDeleting}
                className="px-4 h-9 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
              >
                {bulkDeleting ? 'Deleting...' : 'Delete Projects'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminProjects;

