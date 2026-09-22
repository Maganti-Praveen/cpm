import { useToast } from '../../context/ToastContext';
// Lists milestones statuses across all active projects.
// Signals overdue completion alerts.

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Flag, Plus, Search, ChevronDown, Pencil, Trash2, X, Calendar, Download, Upload
} from 'lucide-react';
import { exportToExcel } from '../../utils/excelExport';
import API from '../../services/api';
import { getMilestones, createMilestone, updateMilestone, deleteMilestone, bulkDeleteMilestones } from '../../services/milestoneService';
import ImportMilestonesModal from '../../components/projects/ImportMilestonesModal';
import Pagination from '../../components/common/Pagination';


const ITEMS_PER_PAGE = 8;

const STATUS_OPTIONS = ['Planning', 'In Progress', 'Completed'];
const STATUS_COLORS = {
  'Planning': { bg: '#F1F5F9', text: '#475569' },
  'In Progress': { bg: '#DBEAFE', text: '#1D4ED8' },
  'Completed': { bg: '#DCFCE7', text: '#15803D' },
};

// Skeleton loader matching the exact table column layout for layout stabilization (Zero CLS)
function MilestoneSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden animate-pulse">
      <table className="w-full min-w-[800px]">
        <thead>
          <tr className="border-b border-[#E2E8F0]">
            <th className="py-3 pl-5 pr-2 w-10 text-left">
              <div className="w-4 h-4 bg-slate-100 rounded"></div>
            </th>
            <th className="px-5 py-3 w-1/4"><div className="h-3 bg-slate-100 rounded w-16"></div></th>
            <th className="px-5 py-3 w-1/4"><div className="h-3 bg-slate-100 rounded w-16"></div></th>
            <th className="px-5 py-3 w-1/8"><div className="h-3 bg-slate-100 rounded w-12"></div></th>
            <th className="px-5 py-3 w-1/8"><div className="h-3 bg-slate-100 rounded w-12"></div></th>
            <th className="px-5 py-3 w-1/8"><div className="h-3 bg-slate-100 rounded w-16"></div></th>
            <th className="px-5 py-3 text-right pr-5"><div className="h-3 bg-slate-100 rounded w-12 ml-auto"></div></th>
          </tr>
        </thead>
        <tbody>
          {[...Array(8)].map((_, idx) => (
            <tr key={idx} className="border-b border-[#F1F5F9] last:border-b-0">
              <td className="py-4 pl-5 pr-2"><div className="w-4 h-4 bg-slate-100 rounded"></div></td>
              <td className="px-5 py-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-md bg-slate-100 shrink-0"></div>
                  <div className="h-3.5 bg-slate-100 rounded w-2/3"></div>
                </div>
              </td>
              <td className="px-5 py-4"><div className="h-3.5 bg-slate-100 rounded w-1/2"></div></td>
              <td className="px-5 py-4"><div className="h-3.5 bg-slate-100 rounded w-20"></div></td>
              <td className="px-5 py-4"><div className="h-5 bg-slate-100 rounded-full w-16"></div></td>
              <td className="px-5 py-4">
                <div className="flex items-center gap-2">
                  <div className="w-20 h-1.5 bg-slate-100 rounded-full"></div>
                  <div className="h-3 bg-slate-100 rounded w-6"></div>
                </div>
              </td>
              <td className="px-5 py-4 text-right pr-5">
                <div className="flex items-center justify-end gap-1">
                  <div className="w-7 h-7 bg-slate-100 rounded-md"></div>
                  <div className="w-7 h-7 bg-slate-100 rounded-md"></div>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="px-5 py-5 border-t border-[#E2E8F0] bg-[#F8FAFC]/30 flex justify-between items-center h-[60px]">
        <div className="h-3 bg-slate-100 rounded w-24"></div>
        <div className="flex gap-2">
          <div className="w-7 h-7 bg-slate-100 rounded-md"></div>
          <div className="w-7 h-7 bg-slate-100 rounded-md"></div>
        </div>
      </div>
    </div>
  );
}

// Organizes project deliverables timelines and maps milestone progress records
function AdminMilestones() {
  const { showToast } = useToast();
  const [milestones, setMilestones] = useState([]);
  const [selectedMilestoneIds, setSelectedMilestoneIds] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [projectFilter, setProjectFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [localSearch, setLocalSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, projectFilter]);

  // Debounce search filter input to prevent redundant renders and blockages
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(localSearch);
    }, 150);
    return () => clearTimeout(timer);
  }, [localSearch]);

  const [deleteConfirmConfig, setDeleteConfirmConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null
  });

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState(null);

  const [form, setForm] = useState({
    title: '', date: '', status: 'Planning', progress: 0, projectId: ''
  });

  // ── Fetch data ─────────────────────────────────────────────
  const fetchMilestones = useCallback(() => {
    setLoading(true);
    const params = {};
    if (statusFilter !== 'All') params.status = statusFilter;
    if (search) params.search = search;

    getMilestones(params)
      .then((res) => {
        setMilestones(res.data.data || []);
        setSelectedMilestoneIds([]);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error loading milestones:', err);
        setLoading(false);
      });
  }, [statusFilter, search]);

  // Queries active milestones listings from project metadata database
  useEffect(() => {
    fetchMilestones();
  }, [fetchMilestones]);

  // Load projects for dropdown
  useEffect(() => {
    API.get('/projects')
      .then((res) => setProjects(res.data.data || []))
      .catch(() => {});
  }, []);

  // ── Filtering (client-side project filter) ─────────────────
  const filtered = useMemo(() => {
    let result = milestones;
    if (projectFilter !== 'All') {
      result = result.filter((m) => m.project?.name === projectFilter);
    }
    return result;
  }, [milestones, projectFilter]);

  // ── Pagination ─────────────────────────────────────────────
  const totalPages = useMemo(() => Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE)), [filtered.length]);
  const paginated = useMemo(() => {
    return filtered.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE
    );
  }, [filtered, currentPage]);

  // Handle Export to Excel
  const handleExport = useCallback(() => {
    try {
      if (filtered.length === 0) {
        showToast("No data available to export!", "error");
        return;
      }
      const mapped = filtered.map(m => ({
        "Milestone Title": m.title || '',
        "Project": m.project?.name || '',
        "Due Date": m.date ? new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : '—',
        "Status": m.status || '',
        "Progress (%)": m.progress || 0
      }));
      exportToExcel(mapped, "Milestones");
    } catch (err) {
      console.error("Failed to export milestones:", err);
      showToast("Failed to export milestones data.", "error");
    }
  }, [filtered, showToast]);

  // ── Handlers ───────────────────────────────────────────────
  const openCreate = useCallback(() => {
    setEditingMilestone(null);
    setForm({ title: '', date: '', status: 'Planning', progress: 0, projectId: '' });
    setIsModalOpen(true);
  }, []);

  const openEdit = useCallback((m) => {
    if (!m) return;
    setEditingMilestone(m);
    setForm({
      title: m.title || '',
      date: m.date ? m.date.slice(0, 10) : (m.dueDate ? m.dueDate.slice(0, 10) : ''),
      status: m.status || 'Pending',
      progress: m.progress || 0,
      projectId: m.projectId || ''
    });
    setIsModalOpen(true);
  }, []);

  // Commits edits or updates changes on targeted milestones
  const handleSave = async () => {
    try {
      const payload = {
        title: form.title,
        date: form.date || null,
        status: form.status,
        progress: Math.min(100, Math.max(0, parseInt(form.progress) || 0)),
        projectId: parseInt(form.projectId)
      };

      if (editingMilestone) {
        await updateMilestone(editingMilestone.id, payload);
      } else {
        await createMilestone(payload);
      }
      setIsModalOpen(false);
      fetchMilestones();
    } catch (err) {
      console.error('Error saving milestone:', err);
    }
  };

  // Deletes milestone records and alerts dependent project pages
  const handleDelete = async (id) => {
    const milestoneObj = milestones.find(m => m.id === id);
    const title = milestoneObj?.title || 'Milestone';
    setDeleteConfirmConfig({
      isOpen: true,
      title: 'Confirm Deletion',
      message: `Are you sure you want to permanently delete milestone ${title}? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          await deleteMilestone(id);
          fetchMilestones();
          setDeleteConfirmConfig(prev => ({ ...prev, isOpen: false }));
        } catch (err) {
          console.error('Error deleting milestone:', err);
          showToast(err.response?.data?.message || 'Failed to delete milestone', "error");
          setDeleteConfirmConfig(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  // Requests multiple milestones removals via bulk API
  const handleBulkDelete = async () => {
    setDeleteConfirmConfig({
      isOpen: true,
      title: 'Confirm Bulk Deletion',
      message: `Are you sure you want to permanently delete the ${selectedMilestoneIds.length} selected milestones?`,
      onConfirm: async () => {
        try {
          await bulkDeleteMilestones(selectedMilestoneIds);
          setSelectedMilestoneIds([]);
          fetchMilestones();
          setDeleteConfirmConfig(prev => ({ ...prev, isOpen: false }));
        } catch (err) {
          console.error('Error bulk deleting milestones:', err);
          showToast(err.response?.data?.message || 'Failed to bulk delete milestones', "error");
          setDeleteConfirmConfig(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const formatDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-US', {
      month: 'short', day: '2-digit', year: 'numeric'
    });
  };

  // ── Unique project names for filter ────────────────────────
  const projectNames = useMemo(() => {
    const names = [...new Set(milestones.map((m) => m.project?.name).filter(Boolean))];
    return names.sort();
  }, [milestones]);

  return (
    <div>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-[1.75rem] font-bold text-[#0F172A] font-display">
            Milestones
          </h1>
          <p className="text-sm text-[#64748B] mt-1">
            Track project milestones and progress across all initiatives.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto shrink-0">
          {selectedMilestoneIds.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="inline-flex items-center gap-1.5 px-4 h-9 rounded-lg border border-red-200 hover:border-red-400 text-red-600 bg-red-50 hover:bg-red-100 text-sm font-medium transition-all duration-150 cursor-pointer animate-fade-in"
              title="Bulk Delete selected milestones"
             aria-label="Bulk Delete selected milestones">
              <Trash2 size={15} />
              Delete ({selectedMilestoneIds.length})
            </button>
          )}

          {/* Import Milestones */}
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 h-9 rounded-lg border border-slate-200 hover:border-indigo-400 text-slate-700 bg-white hover:bg-slate-50 text-sm font-medium transition-all duration-150 cursor-pointer"
            title="Import Milestones from Excel/CSV"
           aria-label="Import Milestones from Excel/CSV">
            <Upload size={15} />
            Import
          </button>

          {/* Export to Excel */}
          <button
            onClick={handleExport}
            disabled={filtered.length === 0}
            title={filtered.length === 0 ? "No data available to export!" : "Export to Excel"}
            className="inline-flex items-center gap-1.5 px-4 h-9 rounded-[--radius-md] border border-indigo-200 hover:border-indigo-400 text-[#4F46E5] bg-[#4F46E5]/5 hover:bg-[#4F46E5]/10 text-sm font-medium transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
           aria-label={filtered.length === 0 ? "No data available to export!" : "Export to Excel"}>
            <Download size={15} />
            Export Data
          </button>

          <button
            onClick={openCreate}
            className="inline-flex items-center justify-center gap-1.5 px-4 h-9 rounded-lg bg-[#4F46E5] text-sm font-medium text-white hover:bg-[#3730A3] transition-all duration-150 cursor-pointer shadow-sm flex-1 sm:flex-none"
          >
            <Plus size={16} />
            New Milestone
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none"
          />
          <input
            type="text"
            placeholder="Search milestones..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-lg border border-[#CBD5E1] bg-white text-sm text-[#334155] placeholder:text-[#94A3B8] outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5]/20 transition"
           aria-label="Search milestones..."/>
        </div>

        {/* Status filter */}
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="appearance-none h-9 pl-3 pr-8 rounded-lg border border-[#CBD5E1] bg-white text-sm text-[#334155] outline-none focus:border-[#4F46E5] cursor-pointer"
            aria-label="Filter milestones by status"
          >
            <option value="All">All Statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none" />
        </div>

        {/* Project filter */}
        <div className="relative">
          <select
            value={projectFilter}
            onChange={(e) => { setProjectFilter(e.target.value); setCurrentPage(1); }}
            className="appearance-none h-9 pl-3 pr-8 rounded-lg border border-[#CBD5E1] bg-white text-sm text-[#334155] outline-none focus:border-[#4F46E5] cursor-pointer"
            aria-label="Filter milestones by project"
          >
            <option value="All">All Projects</option>
            {projectNames.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none" />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <MilestoneSkeleton />
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-[#E2E8F0] shadow-sm">
          <Flag size={40} className="text-[#CBD5E1] mb-3" />
          <p className="text-sm font-semibold text-[#334155]">No milestones found</p>
          <p className="text-xs text-[#94A3B8] mt-1">Create a milestone to get started.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-x-auto border border-[#E2E8F0]">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b border-[#E2E8F0]">
                <th className="py-3 pl-5 pr-2 w-10 text-left">
                  <input
                    type="checkbox"
                    className="rounded border-slate-300 text-[#4F46E5] focus:ring-[#4F46E5]/30 cursor-pointer"
                    checked={paginated.length > 0 && paginated.every(m => selectedMilestoneIds.includes(m.id))}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedMilestoneIds(prev => {
                          const currentIds = paginated.map(m => m.id);
                          const combined = [...prev, ...currentIds];
                          return [...new Set(combined)];
                        });
                      } else {
                        const currentIds = paginated.map(m => m.id);
                        setSelectedMilestoneIds(prev => prev.filter(id => !currentIds.includes(id)));
                      }
                    }}
                   aria-label="Rounded border-slate-300 text-[#4 F46 E5] focus:ring-[#4 F46 E5]/30 cursor-pointer"/>
                </th>
                <th className="text-left text-xs font-semibold text-[#64748B] uppercase tracking-wider px-5 py-3">Milestone</th>
                <th className="text-left text-xs font-semibold text-[#64748B] uppercase tracking-wider px-5 py-3">Project</th>
                <th className="text-left text-xs font-semibold text-[#64748B] uppercase tracking-wider px-5 py-3">Date</th>
                <th className="text-left text-xs font-semibold text-[#64748B] uppercase tracking-wider px-5 py-3">Status</th>
                <th className="text-left text-xs font-semibold text-[#64748B] uppercase tracking-wider px-5 py-3">Progress</th>
                <th className="text-right text-xs font-semibold text-[#64748B] uppercase tracking-wider px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((m) => {
                const sc = STATUS_COLORS[m.status] || STATUS_COLORS['Planning'];
                return (
                  <tr key={m.id} className="border-b border-[#F1F5F9] last:border-b-0 hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-3.5 pl-5 pr-2 w-10 text-left">
                      <input
                        type="checkbox"
                        className="rounded border-slate-300 text-[#4F46E5] focus:ring-[#4F46E5]/30 cursor-pointer"
                        checked={selectedMilestoneIds.includes(m.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedMilestoneIds(prev => [...prev, m.id]);
                          } else {
                            setSelectedMilestoneIds(prev => prev.filter(id => id !== m.id));
                          }
                        }}
                       aria-label="Rounded border-slate-300 text-[#4 F46 E5] focus:ring-[#4 F46 E5]/30 cursor-pointer"/>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-md bg-[#EEF2FF] flex items-center justify-center shrink-0">
                          <Flag size={14} className="text-[#4F46E5]" />
                        </div>
                        <span className="text-sm font-medium text-[#0F172A] truncate max-w-xs block" title={m.title}>{m.title}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-[#64748B]">
                      {m.project?.name || '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5 text-sm text-[#64748B]">
                        <Calendar size={13} className="text-[#94A3B8]" />
                        {formatDate(m.date)}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium"
                        style={{ backgroundColor: sc.bg, color: sc.text }}
                      >
                        {m.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${m.progress}%`,
                              backgroundColor: m.progress === 100 ? '#10B981' : '#4F46E5'
                            }}
                          />
                        </div>
                        <span className="text-xs text-[#64748B] font-medium w-8">{m.progress}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(m)}
                          className="p-1.5 rounded-md hover:bg-[#F1F5F9] text-[#64748B] hover:text-[#4F46E5] transition-colors cursor-pointer"
                          aria-label={`Edit milestone ${m.title}`}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(m.id)}
                          className="p-1.5 rounded-md hover:bg-[#FEF2F2] text-[#64748B] hover:text-[#DC2626] transition-colors cursor-pointer"
                          aria-label={`Delete milestone ${m.title}`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="px-5 py-4 border-t border-[#E2E8F0] bg-[#F8FAFC]/30">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filtered.length}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={(page) => setCurrentPage(page)}
            />
          </div>
        </div>
      )}

      {/* ── Create / Edit Modal ──────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-[#0F172A] font-display">
                {editingMilestone ? 'Edit Milestone' : 'New Milestone'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-md hover:bg-[#F1F5F9] cursor-pointer" aria-label="Close milestone form">
                <X size={18} className="text-[#64748B]" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Title */}
              <div>
                <label htmlFor="milestone-title-input" className="block text-xs font-medium text-[#64748B] mb-1.5">Title</label>
                <input
                  id="milestone-title-input"
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full h-9 px-3 rounded-lg border border-[#CBD5E1] bg-white text-sm text-[#334155] outline-none focus:border-[#4F46E5]"
                  placeholder="Milestone title"
                 />
              </div>

              {/* Project */}
              <div>
                <label htmlFor="milestone-project-select" className="block text-xs font-medium text-[#64748B] mb-1.5">Project</label>
                <select
                  id="milestone-project-select"
                  value={form.projectId}
                  onChange={(e) => setForm({ ...form, projectId: e.target.value })}
                  className="w-full h-9 px-3 rounded-lg border border-[#CBD5E1] bg-white text-sm text-[#334155] outline-none focus:border-[#4F46E5] cursor-pointer"
                  aria-label="Select project"
                >
                  <option value="">Select project</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              {/* Date + Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="milestone-date-input" className="block text-xs font-medium text-[#64748B] mb-1.5">Date</label>
                  <input
                    id="milestone-date-input"
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full h-9 px-3 rounded-lg border border-[#CBD5E1] bg-white text-sm text-[#334155] outline-none focus:border-[#4F46E5]"
                    aria-label="Milestone date"
                  />
                </div>
                <div>
                  <label htmlFor="milestone-status-select" className="block text-xs font-medium text-[#64748B] mb-1.5">Status</label>
                  <select
                    id="milestone-status-select"
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full h-9 px-3 rounded-lg border border-[#CBD5E1] bg-white text-sm text-[#334155] outline-none focus:border-[#4F46E5] cursor-pointer"
                    aria-label="Select milestone status"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Progress */}
              <div>
                <label htmlFor="milestone-progress-input" className="block text-xs font-medium text-[#64748B] mb-1.5">Progress ({form.progress}%)</label>
                <input
                  id="milestone-progress-input"
                  type="range"
                  min="0"
                  max="100"
                  value={form.progress}
                  onChange={(e) => setForm({ ...form, progress: e.target.value })}
                  className="w-full accent-[#4F46E5]"
                 aria-label="W-full accent-[#4 F46 E5]"/>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 h-9 rounded-lg border border-[#CBD5E1] text-sm font-medium text-[#334155] hover:bg-[#F1F5F9] cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!form.title || !form.projectId}
                className="px-4 h-9 rounded-lg bg-[#4F46E5] text-sm font-medium text-white hover:bg-[#3730A3] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-sm"
              >
                {editingMilestone ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Milestone Import Modal */}
      <ImportMilestonesModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={fetchMilestones}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirmConfig.isOpen && (
        <div className="fixed inset-0 bg-[#0f172a]/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in font-sans">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-sm overflow-hidden p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 font-display text-left">{deleteConfirmConfig.title}</h3>
            <p className="text-xs text-slate-500 leading-normal text-left">
              {deleteConfirmConfig.message}
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmConfig(prev => ({ ...prev, isOpen: false }))}
                className="px-4 h-9 rounded-lg border border-[#CBD5E1] text-[#334155] hover:bg-[#F1F5F9] text-xs font-semibold transition-colors cursor-pointer bg-white"
              >
                Cancel
              </button>
              <button
                onClick={deleteConfirmConfig.onConfirm}
                className="px-4 h-9 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors cursor-pointer border-none"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminMilestones;

