// Task board showing progress columns across active projects.
// Details assignment filters.

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  List,
  Columns3,
  Plus,
  AlertTriangle,
  ChevronsUp,
  Minus,
  ChevronDown,
  Circle,
  MoreHorizontal,
  Calendar,
  AlertCircle,
  Search,
  Download,
  Upload,
  Trash2
} from 'lucide-react';
import { exportToExcel } from '../../utils/excelExport';
import TasksBoard from '../../components/tasks/TasksBoard';
import NewTaskModal from '../../components/tasks/NewTaskModal';
import TaskDetailPanel from '../../components/projects/TaskDetailPanel';
import ImportTasksModal from '../../components/projects/ImportTasksModal';
import Avatar from '../../components/common/Avatar';
import API from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { bulkDeleteTasks, updateTask } from '../../services/taskService';
import Pagination from '../../components/common/Pagination';


// Task checklist manager displaying board columns and task parameters editor modals
function AdminTasks() {
  const { showToast } = useToast();
  const [tasks, setTasks] = useState([]);
  const [selectedTaskIds, setSelectedTaskIds] = useState([]);
  const [projects, setProjects] = useState([]);
  const [assignees, setAssignees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [viewMode, setViewMode] = useState('list'); // 'list' or 'board'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [deleteConfirmConfig, setDeleteConfirmConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null
  });
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);


  // Filters State
  const [searchParams] = useSearchParams();
  const searchParamVal = searchParams.get('search') || '';
  const [searchFilter, setSearchFilter] = useState(searchParamVal);
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [projectFilter, setProjectFilter] = useState('All');
  const [assigneeFilter, setAssigneeFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 15;

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, priorityFilter, projectFilter, assigneeFilter, searchFilter, dateFilter]);

  // Sync searchFilter when URL param changes
  useEffect(() => {
    const s = searchParams.get('search') || '';
    setSearchFilter(s);
  }, [searchParams]);

  // Load projects and assignees metadata once
  useEffect(() => {
    // Gathers staff directories and milestone labels to synchronize task selections
  const loadMetadata = async () => {
      try {
        const [projRes, userRes] = await Promise.all([
          API.get('/projects'),
          API.get('/users', { params: { role: 'STAFF' } })
        ]);
        setProjects(projRes.data.data || []);
        setAssignees(userRes.data.data || []);
      } catch (err) {
        console.error("Failed to load task metadata:", err);
      }
    };
    loadMetadata();
  }, []);

  // Fetch tasks from backend
  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await API.get('/tasks', {
        params: {
          status: statusFilter === 'All' ? 'All' : statusFilter,
          priority: priorityFilter === 'All' ? 'All' : priorityFilter,
          project: projectFilter === 'All' ? 'All' : projectFilter,
          assignee: assigneeFilter === 'All' ? 'All' : assigneeFilter,
          search: searchFilter || undefined
        }
      });
      setTasks(res.data.data || []);
      setSelectedTaskIds([]);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch tasks from database');
      setLoading(false);
    }
  }, [statusFilter, priorityFilter, projectFilter, assigneeFilter, searchFilter]);

  // Fetches task elements matching search queries or filter categories
  useEffect(() => {
    fetchTasks();
  }, [statusFilter, priorityFilter, projectFilter, assigneeFilter, searchFilter]);

  // Handle adding a task
  const handleAddTask = useCallback(async (newTask) => {
    try {
      setError('');
      await API.post('/tasks', newTask);
      await fetchTasks();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to create task');
    }
  }, [fetchTasks]);

  // Handle deleting a task
  const handleDeleteTask = useCallback((taskId) => {
    const taskObj = tasks.find(t => t.id === taskId);
    const title = taskObj?.title || "Task";
    setSelectedTask(null);
    setDeleteConfirmConfig({
      isOpen: true,
      title: 'Confirm Task Deletion',
      message: `Are you sure you want to permanently delete task ${title}? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          setError('');
          setTasks(prev => prev.filter(t => t.id !== taskId));
          await API.delete(`/tasks/${taskId}`);
          showToast("Task deleted successfully");
          setDeleteConfirmConfig(prev => ({ ...prev, isOpen: false }));
          await fetchTasks();
        } catch (err) {
          console.error(err);
          setError(err.response?.data?.message || 'Failed to delete task');
          showToast(err.response?.data?.message || 'Failed to delete task', 'error');
          setDeleteConfirmConfig(prev => ({ ...prev, isOpen: false }));
          await fetchTasks();
        }
      }
    });
  }, [tasks, fetchTasks, showToast]);

  const handleUpdateTaskStatus = useCallback(async (taskId, newStatus) => {
    try {
      setError('');
      setTasks(prevTasks => prevTasks.map(task => 
        task.id === parseInt(taskId) || task.id === taskId 
          ? { ...task, status: newStatus } 
          : task
      ));
      
      await updateTask(taskId, { status: newStatus });
      await fetchTasks();
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || 'Failed to update task status.', 'error');
      await fetchTasks();
    }
  }, [fetchTasks, showToast]);

  // Dispatches list of targeted task keys to batch delete service
  const handleBulkDelete = async () => {
    if (selectedTaskIds.length === 0) return;
    const count = selectedTaskIds.length;
    setDeleteConfirmConfig({
      isOpen: true,
      title: 'Confirm Batch Task Deletion',
      message: `Are you sure you want to permanently delete ${count} tasks? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          setError('');
          await bulkDeleteTasks(selectedTaskIds);
          showToast(`Successfully deleted ${count} tasks`);
          setSelectedTaskIds([]);
          setDeleteConfirmConfig(prev => ({ ...prev, isOpen: false }));
          await fetchTasks();
        } catch (err) {
          console.error(err);
          setError(err.response?.data?.message || 'Failed to delete tasks');
          showToast(err.response?.data?.message || 'Failed to delete tasks', 'error');
          setDeleteConfirmConfig(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  // Clear all filters
  const handleClearFilters = () => {
    setStatusFilter('All');
    setPriorityFilter('All');
    setProjectFilter('All');
    setAssigneeFilter('All');
    setDateFilter('');
    setSearchFilter('');
  };

  // Determine if task is overdue (relative to current date)
  const checkOverdue = (dateStr) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const taskDate = new Date(dateStr);
      return taskDate < today;
    } catch {
      return false;
    }
  };

  // Filter tasks list locally for date filter if selected
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (dateFilter) {
        const filterDateStr = new Date(dateFilter).toLocaleDateString('en-US', {
          month: 'short',
          day: '2-digit',
          year: 'numeric'
        });
        if (task.dueDate !== filterDateStr) return false;
      }
      return true;
    });
  }, [tasks, dateFilter]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(filteredTasks.length / ITEMS_PER_PAGE)), [filteredTasks.length]);

  const paginatedTasks = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredTasks.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredTasks, currentPage]);

  const handleExport = useCallback(() => {
    try {
      if (filteredTasks.length === 0) {
        showToast("No data available to export!", "error");
        return;
      }
      const mapped = filteredTasks.map(task => ({
        "Task ID / Key": task.taskKey || '',
        "Task Name": task.title || '',
        "Project": task.project || '',
        "Assignee": task.assignee?.name || '',
        "Priority": task.priority || '',
        "Status": task.status || '',
        "Due Date": task.dueDate || ''
      }));
      exportToExcel(mapped, "Tasks");
    } catch (err) {
      console.error("Failed to export tasks:", err);
      showToast("Failed to export tasks data.", "error");
    }
  }, [filteredTasks, showToast]);

  // Render priority badges
  const renderPriorityBadge = (priority) => {
    switch (priority) {
      case 'Critical':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-[11px] font-bold text-rose-600 bg-rose-50 border border-rose-100 uppercase tracking-wide">
            <AlertTriangle size={11} className="stroke-[2.5]" />
            Critical
          </span>
        );
      case 'High':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-100 uppercase tracking-wide">
            <ChevronsUp size={11} className="stroke-[2.5]" />
            High
          </span>
        );
      case 'Medium':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-100 uppercase tracking-wide">
            <Minus size={11} className="stroke-[2.5]" />
            Medium
          </span>
        );
      case 'Low':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-[11px] font-bold text-slate-600 bg-slate-50 border border-slate-100 uppercase tracking-wide">
            <ChevronDown size={11} className="stroke-[2.5]" />
            Low
          </span>
        );
      default:
        return null;
    }
  };

  // Render status badges
  const renderStatusBadge = (status) => {
    switch (status) {
      case 'To Do':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold text-slate-700 bg-white border border-slate-200">
            <Circle size={10} className="text-slate-400 stroke-[2.5]" />
            To Do
          </span>
        );
      case 'In Progress':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold text-[#0369A1] bg-[#E0F2FE] border border-blue-100">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0284C7]" />
            In Progress
          </span>
        );
      case 'In Review':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold text-purple-700 bg-purple-50 border border-purple-100">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
            In Review
          </span>
        );
      case 'Completed':
      case 'Done':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Completed
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex gap-0 -m-6 min-h-[calc(100vh-4rem)]">
      {/* Main Page Area */}
      <div className="flex-1 p-6 overflow-y-auto space-y-5">
        {/* Header row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-[1.75rem] font-bold text-[#0F172A] font-display">
              Tasks
            </h1>
            <p className="text-sm text-[#64748B] mt-1">
              Manage and track your operational deliverables.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto shrink-0">
            {selectedTaskIds.length > 0 && (
              <button
                onClick={handleBulkDelete}
                className="inline-flex items-center gap-1.5 px-4 h-9 rounded-lg border border-red-200 hover:border-red-400 text-red-600 bg-red-50 hover:bg-red-100 text-sm font-medium transition-all duration-150 cursor-pointer animate-fade-in"
                title="Bulk Delete selected tasks"
               aria-label="Bulk Delete selected tasks">
                <Trash2 size={15} />
                Delete ({selectedTaskIds.length})
              </button>
            )}

            {/* Import Tasks */}
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 h-9 rounded-lg border border-slate-200 hover:border-indigo-400 text-slate-700 bg-white hover:bg-slate-50 text-sm font-medium transition-all duration-150 cursor-pointer"
              title="Import Tasks from Excel/CSV"
             aria-label="Import Tasks from Excel/CSV">
              <Upload size={15} />
              Import
            </button>

            {/* Export to Excel */}
            <button
              onClick={handleExport}
              disabled={filteredTasks.length === 0}
              title={filteredTasks.length === 0 ? "No data available to export!" : "Export to Excel"}
              className="inline-flex items-center gap-1.5 px-4 h-9 rounded-[--radius-md] border border-indigo-200 hover:border-indigo-400 text-[#4F46E5] bg-[#4F46E5]/5 hover:bg-[#4F46E5]/10 text-sm font-medium transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
             aria-label={filteredTasks.length === 0 ? "No data available to export!" : "Export to Excel"}>
              <Download size={15} />
              Export Data
            </button>


            {/* View toggle */}
            <div className="flex items-center border border-[#CBD5E1] rounded-lg overflow-hidden bg-white">
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-1.5 px-3.5 h-9 text-xs font-bold transition-colors cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-[#F1F5F9] text-[#0F172A]'
                    : 'text-[#64748B] hover:bg-[#F8FAFC]'
                }`}
              >
                <List size={14} />
                List
              </button>
              <button
                onClick={() => setViewMode('board')}
                className={`flex items-center gap-1.5 px-3.5 h-9 text-xs font-bold border-l border-[#CBD5E1] transition-colors cursor-pointer ${
                  viewMode === 'board'
                    ? 'bg-[#F1F5F9] text-[#0F172A]'
                    : 'text-[#64748B] hover:bg-[#F8FAFC]'
                }`}
              >
                <Columns3 size={14} />
                Board
              </button>
            </div>

            {/* New Task Button */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center justify-center gap-1.5 px-4 h-9 rounded-lg bg-[#4F46E5] text-sm font-medium text-white hover:bg-[#3730A3] transition-all duration-150 cursor-pointer shadow-sm flex-1 sm:flex-none"
            >
              <Plus size={16} />
              New Task
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-100 text-rose-600 rounded-lg px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {/* Filter Card Block */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-4 items-end">
            {/* Search */}
            <div>
              <label htmlFor="task-search-filter" className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                Search
              </label>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  id="task-search-filter"
                  type="text"
                  placeholder="Search tasks..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full h-9 pl-9 pr-3 rounded-lg border border-[#CBD5E1] bg-white text-xs text-slate-850 outline-none focus:border-primary focus:ring-2 focus:ring-primary/12"
                 aria-label="Search tasks..."/>
              </div>
            </div>

            {/* Status */}
            <div>
              <label htmlFor="task-status-filter" className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                Status
              </label>
              <div className="relative">
                <select
                  id="task-status-filter"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full appearance-none h-9 pl-3 pr-8 rounded-lg border border-[#CBD5E1] bg-white text-xs text-slate-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/12 cursor-pointer"
                  aria-label="Filter tasks by status"
                >
                  <option value="All">All Statuses</option>
                  <option value="To Do">To Do</option>
                  <option value="In Progress">In Progress</option>
                  <option value="In Review">In Review</option>
                  <option value="Completed">Completed</option>
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Priority */}
            <div>
              <label htmlFor="task-priority-filter" className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                Priority
              </label>
              <div className="relative">
                <select
                  id="task-priority-filter"
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="w-full appearance-none h-9 pl-3 pr-8 rounded-lg border border-[#CBD5E1] bg-white text-xs text-slate-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/12 cursor-pointer"
                  aria-label="Filter tasks by priority"
                >
                  <option value="All">All Priorities</option>
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Project */}
            <div>
              <label htmlFor="task-project-filter" className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                Project
              </label>
              <div className="relative">
                <select
                  id="task-project-filter"
                  value={projectFilter}
                  onChange={(e) => setProjectFilter(e.target.value)}
                  className="w-full appearance-none h-9 pl-3 pr-8 rounded-lg border border-[#CBD5E1] bg-white text-xs text-slate-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/12 cursor-pointer"
                  aria-label="Filter tasks by project"
                >
                  <option value="All">All Projects</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.name}>{p.name}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Assignee */}
            <div>
              <label htmlFor="task-assignee-filter" className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                Assignee
              </label>
              <div className="relative">
                <select
                  id="task-assignee-filter"
                  value={assigneeFilter}
                  onChange={(e) => setAssigneeFilter(e.target.value)}
                  className="w-full appearance-none h-9 pl-3 pr-8 rounded-lg border border-[#CBD5E1] bg-white text-xs text-slate-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/12 cursor-pointer"
                  aria-label="Filter tasks by assignee"
                >
                  <option value="All">Anyone</option>
                  {assignees.map(a => (
                    <option key={a.id} value={a.fullName}>{a.fullName}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Due Date & Clear */}
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label htmlFor="task-date-filter" className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                  Due Date
                </label>
                <input
                  id="task-date-filter"
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-[#CBD5E1] bg-white text-xs text-slate-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/12 cursor-pointer"
                  aria-label="Filter tasks by due date"
                />
              </div>
              <button
                onClick={handleClearFilters}
                className="h-9 px-3 text-xs font-bold text-[#4F46E5] hover:text-[#3730A3] transition-colors cursor-pointer shrink-0 mt-auto bg-transparent border-0"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Views Container */}
        {loading ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-[#E2E8F0] flex justify-center items-center gap-2">
            <svg className="animate-spin h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-sm font-medium text-slate-500">Loading tasks...</span>
          </div>
        ) : viewMode === 'list' ? (
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px]">
                <thead>
                  <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                    <th scope="col" className="py-3.5 pl-5 pr-2 w-10 text-left">
                      <input
                        type="checkbox"
                        className="rounded border-slate-300 text-[#4F46E5] focus:ring-[#4F46E5]/30 cursor-pointer"
                        checked={filteredTasks.length > 0 && selectedTaskIds.length === filteredTasks.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTaskIds(filteredTasks.map(t => t.id));
                          } else {
                            setSelectedTaskIds([]);
                          }
                        }}
                       aria-label="Rounded border-slate-300 text-[#4 F46 E5] focus:ring-[#4 F46 E5]/30 cursor-pointer"/>
                    </th>
                    <th scope="col" className="text-left py-3.5 px-5 text-[0.6875rem] font-semibold text-[#64748B] uppercase tracking-[0.05em]">
                      Task Name
                    </th>
                    <th scope="col" className="text-left py-3.5 px-4 text-[0.6875rem] font-semibold text-[#64748B] uppercase tracking-[0.05em]">
                      Assignee
                    </th>
                    <th scope="col" className="text-left py-3.5 px-4 text-[0.6875rem] font-semibold text-[#64748B] uppercase tracking-[0.05em]">
                      Priority
                    </th>
                    <th scope="col" className="text-left py-3.5 px-4 text-[0.6875rem] font-semibold text-[#64748B] uppercase tracking-[0.05em]">
                      Status
                    </th>
                    <th scope="col" className="text-left py-3.5 px-4 text-[0.6875rem] font-semibold text-[#64748B] uppercase tracking-[0.05em]">
                      Due Date
                    </th>
                    <th scope="col" className="text-center py-3.5 px-4 text-[0.6875rem] font-semibold text-[#64748B] uppercase tracking-[0.05em]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTasks.map((task) => {
                    const isOverdue = checkOverdue(task.dueDate) && task.status !== 'Completed' && task.status !== 'Done';
                    return (
                      <tr
                        key={task.id}
                        className="border-b border-[#F1F5F9] last:border-b-0 hover:bg-[#F8FAFC]/50 transition-colors"
                      >
                        <td className="py-4 pl-5 pr-2 w-10 text-left">
                          <input
                            type="checkbox"
                            className="rounded border-slate-300 text-[#4F46E5] focus:ring-[#4F46E5]/30 cursor-pointer"
                            checked={selectedTaskIds.includes(task.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedTaskIds(prev => [...prev, task.id]);
                              } else {
                                setSelectedTaskIds(prev => prev.filter(id => id !== task.id));
                              }
                            }}
                           aria-label="Rounded border-slate-300 text-[#4 F46 E5] focus:ring-[#4 F46 E5]/30 cursor-pointer"/>
                        </td>
                        {/* Task name & project */}
                        <td className="py-4 px-5">
                          <span
                            onClick={() => setSelectedTask(task)}
                            className="text-sm font-semibold text-[#0F172A] hover:text-[#4F46E5] transition-colors cursor-pointer block"
                          >
                            {task.title}
                          </span>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span
                              className="w-1.5 h-1.5 rounded-full shrink-0"
                              style={{ backgroundColor: task.projectColor || '#6366F1' }}
                            />
                            <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                              {task.project} • {task.taskKey}
                            </span>
                          </div>
                        </td>

                        {/* Assignee */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <Avatar
                              name={task.assignee.name}
                              initials={task.assignee.initials}
                              color={task.assignee.avatarColor}
                              size="xs"
                              src={task.assignee.avatar}
                            />
                            <span className="text-xs font-semibold text-[#475569]">
                              {task.assignee.name}
                            </span>
                          </div>
                        </td>

                        {/* Priority */}
                        <td className="py-4 px-4">
                          {renderPriorityBadge(task.priority)}
                        </td>

                        {/* Status */}
                        <td className="py-4 px-4">
                          {renderStatusBadge(task.status)}
                        </td>

                        {/* Due Date */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-1.5">
                            {isOverdue && (
                              <AlertCircle size={14} className="text-rose-500 shrink-0" />
                            )}
                            <span
                              className={`text-xs font-semibold ${
                                isOverdue ? 'text-rose-600 font-bold' : 'text-[#475569]'
                              }`}
                            >
                              {task.dueDate}
                            </span>
                          </div>
                        </td>

                        {/* Action Dots */}
                        <td className="py-4 px-4 text-center">
                          <button
                            onClick={() => setSelectedTask(task)}
                            className="p-1.5 rounded-md hover:bg-[#F1F5F9] text-[#94A3B8] hover:text-[#475569] cursor-pointer transition-colors"
                            aria-label="Task actions dropdown"
                          >
                            <MoreHorizontal size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredTasks.length === 0 && (
                    <tr>
                      <td colSpan="7" className="py-12 text-center text-sm text-[#64748B]">
                        No tasks match your filter parameters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer Pagination Stats */}
            <div className="px-5 py-4 border-t border-[#E2E8F0] bg-[#F8FAFC]/30">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredTasks.length}
                itemsPerPage={ITEMS_PER_PAGE}
                onPageChange={(page) => setCurrentPage(page)}
              />
            </div>
          </div>
        ) : (
          <TasksBoard 
            tasks={filteredTasks} 
            onSelectTask={setSelectedTask}
            onUpdateTaskStatus={handleUpdateTaskStatus}
          />
        )}
      </div>

      {/* Task Details panel overlay drawer */}
      {selectedTask && (
        <TaskDetailPanel
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onDeleteTask={handleDeleteTask}
        />
      )}

      {/* New Task modal dialog */}
      <NewTaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleAddTask}
        projects={projects}
        assignees={assignees}
      />

      {/* Task Import Modal */}
      <ImportTasksModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={fetchTasks}
      />


      {/* Task Delete Confirmation Modal */}
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
                className="px-4 h-9 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-colors cursor-pointer bg-white"
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

export default AdminTasks;
