// Administrative interface logging system logins, configuration changes, and operations records.
// Details database tracking.


import { useState, useEffect, useCallback } from 'react';
import { Clock, User, FileText, ChevronLeft, ChevronRight, Eye, X, Search, Filter, SlidersHorizontal, ArrowUpRight, Activity, Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import auditLogService from '../../services/auditLogService';
import Avatar from '../../components/common/Avatar';
import Pagination from '../../components/common/Pagination';
import { exportToExcel } from '../../utils/excelExport';

export default function AuditLogs() {
  const { user: currentUser } = useSelector((state) => state.auth);
  const isSubAdmin = currentUser?.role === 'ADMIN' && !!currentUser?.adminRole;

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedLog, setSelectedLog] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [entityFilter, setEntityFilter] = useState('All');
  const [actionFilter, setActionFilter] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  
  const [activeTab, setActiveTab] = useState('my-logs');
  const [userFilter, setUserFilter] = useState('All');
  const [usersList, setUsersList] = useState([]);
  const limit = 15;

  // Preloads administrator users list for dropdown options
  useEffect(() => {
    if (currentUser && !isSubAdmin) {
      const token = localStorage.getItem('token');
      const API_BASE = import.meta.env.VITE_API_URL || '';
      fetch(`${API_BASE}/api/users?role=ADMIN`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(json => {
          if (json.success && json.data) {
            setUsersList(json.data);
          }
        })
        .catch(err => console.error("Failed to load users for filter:", err));
    }
  }, [currentUser, isSubAdmin]);

  // Dispatches parameters to auditLogService query tools and retrieves operations reports
  const fetchLogs = useCallback(async (currentPage, search, entity, action, tab, selectedUserId) => {
    setLoading(true);
    try {
      let targetUserId = 'All';
      if (isSubAdmin) {
        targetUserId = currentUser?.id || 'All';
      } else {
        if (tab === 'my-logs') {
          targetUserId = currentUser?.id || 'All';
        } else {
          targetUserId = selectedUserId;
        }
      }
      const res = await auditLogService.getAuditLogs(currentPage, limit, search, entity, action, targetUserId);
      if (res.success) {
        setLogs(res.data || []);
        setTotalPages(res.pagination?.totalPages || 1);
        setTotalItems(res.pagination?.total || 0);
      }
    } catch (err) {
      console.error("Error loading audit logs:", err);
    } finally {
      setLoading(false);
    }
  }, [isSubAdmin, currentUser]);

  // Refetches system audit logs whenever page or filter state updates
  useEffect(() => {
    fetchLogs(page, searchQuery, entityFilter, actionFilter, activeTab, userFilter);
  }, [fetchLogs, page, searchQuery, entityFilter, actionFilter, activeTab, userFilter]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setPage(1);
    setUserFilter('All');
  };

  // Decrements pagination counters to shift view pages backward
  const handlePrevPage = () => {
    if (page > 1) setPage(p => p - 1);
  };

  // Increments pagination counters to shift view pages forward
  const handleNextPage = () => {
    if (page < totalPages) setPage(p => p + 1);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getActionColor = (action) => {
    switch (action?.toUpperCase()) {
      case 'POST':
      case 'CREATED':
        return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      case 'PUT':
      case 'PATCH':
      case 'UPDATED':
        return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'DELETE':
      case 'DELETED':
        return 'text-rose-700 bg-rose-50 border-rose-200';
      default:
        return 'text-slate-700 bg-slate-50 border-slate-200';
    }
  };

  const getEntityLink = (entity, id) => {
    if (!id) return null;
    switch (entity?.toUpperCase()) {
      case 'PROJECTS': return `/admin/projects/${id}`;
      case 'TASKS': return `/admin/tasks`;
      case 'INVOICES': return `/admin/invoices`;
      case 'USERS':
      case 'CLIENTS': return `/admin/clients`;
      default: return null;
    }
  };

  const generateActionSummary = (log) => {
    if (!log) return "";
    if (log.details && typeof log.details === 'object' && log.details.description) {
      return log.details.description;
    }
    
    let entityName = (log.entity || 'record').toLowerCase().replace(/s$/, ''); // singularize
    if (entityName === 'ticket') entityName = 'support ticket';
    if (entityName === 'transaction') entityName = 'payment';
    
    const action = (log.action || '').toLowerCase();
    
    let identifier = "";
    if (log.details && typeof log.details === 'object') {
      identifier = log.details.fullName || log.details.name || log.details.title || log.details.invoiceNumber || log.details.email;
    }

    const displayName = identifier ? `"${identifier}"` : (log.entityId ? `#${log.entityId}` : '');
    const displayWithSpace = displayName ? ` ${displayName}` : '';

    if (action === 'deleted' || action === 'delete') {
      return `${entityName}${displayWithSpace} deleted`;
    }
    
    if (action === 'created' || action === 'post') {
      return `New ${entityName}${displayWithSpace} created`;
    }

    if (action === 'updated' || action === 'put' || action === 'patch') {
      if (!log.details || typeof log.details !== 'object' || Object.keys(log.details).length === 0) {
        return `${entityName}${displayWithSpace} updated`;
      }
      
      const keys = Object.keys(log.details);
      if (keys.length === 1 && keys[0].toLowerCase().includes('password')) {
        return `${entityName}${displayWithSpace} password changed`;
      }

      const updatedFields = keys
        .filter(k => k !== 'password' && k !== 'token')
        .map(k => k.replace(/([A-Z])/g, ' $1').toLowerCase().trim());
      
      if (updatedFields.length === 0) {
        return `${entityName}${displayWithSpace} updated`;
      }

      const fieldsStr = updatedFields.slice(0, 3).join(', ') + (updatedFields.length > 3 ? ' and other fields' : '');
      return `${entityName}${displayWithSpace} ${fieldsStr} changed`;
    }

    return `${action.toUpperCase()} action on ${entityName}${displayWithSpace}`;
  };

  const handleExport = () => {
    if (logs.length === 0) return;
    const mapped = logs.map(log => ({
      "Date & Time": formatDate(log.createdAt),
      "User Name": log.user?.fullName || 'Unknown Admin',
      "User Email": log.user?.email || '',
      "Action": log.action || '',
      "Entity": log.entity || '',
      "Summary": generateActionSummary(log)
    }));
    exportToExcel(mapped, "Audit_Logs");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-[1.75rem] font-bold text-[#0F172A] font-display">
            Audit Logs
          </h1>
          <p className="text-sm text-[#64748B] mt-1">
            Track and monitor all administrative actions across the platform
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto shrink-0">
          <button
            onClick={handleExport}
            disabled={logs.length === 0}
            className="inline-flex items-center gap-1.5 px-4 h-9 rounded-lg border border-indigo-200 hover:border-indigo-400 text-[#4F46E5] bg-[#4F46E5]/5 hover:bg-[#4F46E5]/10 text-sm font-medium transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            title={logs.length === 0 ? "No logs to export" : "Export Audit Logs to Excel"}
          >
            <Download size={15} />
            Export Data
          </button>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-1.5 px-4 h-9 rounded-lg border text-sm font-medium transition-all duration-150 cursor-pointer ${
              showFilters
                ? 'bg-slate-100 border-slate-300 text-slate-800'
                : 'border-[#CBD5E1] text-[#475569] bg-white hover:bg-[#F1F5F9] hover:border-[#94A3B8]'
            }`}
          >
            <Filter size={15} />
            Filter
          </button>
        </div>
      </div>

      {/* Tabs */}
      {!isSubAdmin && (
        <div className="flex border-b border-slate-200 gap-6 mb-4">
          <button
            onClick={() => handleTabChange('my-logs')}
            className={`pb-2.5 text-sm font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer flex items-center gap-2 bg-transparent border-0 outline-none ${
              activeTab === 'my-logs'
                ? 'border-b-2 border-[#4F46E5] text-[#4F46E5]'
                : 'text-[#475569] hover:text-[#0F172A] border-b-2 border-transparent'
            }`}
          >
            <Activity className="w-4 h-4" />
            My Logs
          </button>
          <button
            onClick={() => handleTabChange('all-logs')}
            className={`pb-2.5 text-sm font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer flex items-center gap-2 bg-transparent border-0 outline-none ${
              activeTab === 'all-logs'
                ? 'border-b-2 border-[#4F46E5] text-[#4F46E5]'
                : 'text-[#475569] hover:text-[#0F172A] border-b-2 border-transparent'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            All Logs
          </button>
        </div>
      )}

      {/* Filters Section */}
      {showFilters && (
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 flex flex-col sm:flex-row items-center gap-4 shadow-sm transition-all duration-200">
          <div className="relative flex-1 w-full">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <input
              type="text"
              placeholder="Search by ID, Name, or Entity..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full h-[2.375rem] pl-9 pr-4 rounded-lg border border-[#CBD5E1] bg-white text-sm text-[#0F172A] placeholder-[#94A3B8] outline-none focus:border-[#4F46E5] focus:ring-[3px] focus:ring-[#4F46E5]/12 transition-all"
             aria-label="Search by ID, Name, or Entity..."/>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <SlidersHorizontal size={16} className="text-[#64748B]" />
            {!isSubAdmin && activeTab === 'all-logs' && (
              <select
                value={userFilter}
                onChange={(e) => {
                  setUserFilter(e.target.value);
                  setPage(1);
                }}
                className="h-[2.375rem] px-3 rounded-lg border border-[#CBD5E1] bg-white text-sm text-[#0F172A] outline-none focus:border-[#4F46E5] focus:ring-[3px] focus:ring-[#4F46E5]/12 transition-all cursor-pointer"
               aria-label="Select h-[2.375rem] px-3 rounded-lg border border-[# c b d5 e1] bg-white text-sm text-[#0 f172 a] outline-none focus:border-[#4 f46 e5] focus:ring-[3px] focus:ring-[#4 f46 e5]/12 transition-all cursor-pointer">
                <option value="All">All Admins</option>
                {usersList.map(u => (
                  <option key={u.id} value={u.id}>{u.fullName} ({u.adminRole || 'Super Admin'})</option>
                ))}
              </select>
            )}
            <select
              value={entityFilter}
              onChange={(e) => {
                setEntityFilter(e.target.value);
                setPage(1);
              }}
              className="h-[2.375rem] px-3 rounded-lg border border-[#CBD5E1] bg-white text-sm text-[#0F172A] outline-none focus:border-[#4F46E5] focus:ring-[3px] focus:ring-[#4F46E5]/12 transition-all cursor-pointer"
             aria-label="Select h-[2.375rem] px-3 rounded-lg border border-[# c b d5 e1] bg-white text-sm text-[#0 f172 a] outline-none focus:border-[#4 f46 e5] focus:ring-[3px] focus:ring-[#4 f46 e5]/12 transition-all cursor-pointer">
              <option value="All">All Entities</option>
              <option value="PROJECTS">Projects</option>
              <option value="TASKS">Tasks</option>
              <option value="CLIENTS">Clients</option>
              <option value="INVOICES">Invoices</option>
              <option value="USERS">Users</option>
              <option value="TICKETS">Tickets</option>
            </select>
            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setPage(1);
              }}
              className="h-[2.375rem] px-3 rounded-lg border border-[#CBD5E1] bg-white text-sm text-[#0F172A] outline-none focus:border-[#4F46E5] focus:ring-[3px] focus:ring-[#4F46E5]/12 transition-all cursor-pointer"
             aria-label="Select h-[2.375rem] px-3 rounded-lg border border-[# c b d5 e1] bg-white text-sm text-[#0 f172 a] outline-none focus:border-[#4 f46 e5] focus:ring-[3px] focus:ring-[#4 f46 e5]/12 transition-all cursor-pointer">
              <option value="All">All Actions</option>
              <option value="CREATED">Created</option>
              <option value="UPDATED">Updated</option>
              <option value="DELETED">Deleted</option>
            </select>
          </div>
        </div>
      )}

      {/* Main Table Container */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">Admin</th>
                <th className="px-6 py-4">Action</th>
                <th className="px-6 py-4">Entity</th>
                <th className="px-6 py-4 hidden md:table-cell">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-3"></div>
                      <p>Loading audit logs...</p>
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <FileText className="w-12 h-12 text-slate-300 mb-3" />
                      <p className="text-base font-medium text-slate-900">No logs found</p>
                      <p className="text-sm mt-1">There are no administrative actions recorded yet.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Clock className="w-4 h-4 text-slate-400" />
                        <span>{formatDate(log.createdAt)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <Avatar
                          name={log.user?.fullName || 'Unknown'}
                          src={log.user?.avatar}
                          size="sm"
                        />
                        <div>
                          <p className="font-medium text-slate-900">{log.user?.fullName || 'Unknown Admin'}</p>
                          <p className="text-xs text-slate-500">{log.user?.email || ''}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-xs tracking-wider text-slate-400 uppercase">{log.entity}</span>
                        <span className="text-xs text-slate-700 font-medium max-w-[200px] sm:max-w-xs truncate mt-0.5" title={generateActionSummary(log)}>
                          {generateActionSummary(log)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      {log.details ? (
                        <button
                          onClick={() => {
                            setSelectedLog(log);
                            setIsModalOpen(true);
                          }}
                          className="inline-flex items-center justify-center w-8 h-8 text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-lg hover:bg-indigo-100 transition-colors tooltip-trigger"
                          title="View Modifications"
                         aria-label="View Modifications">
                          <Eye className="w-4 h-4" />
                        </button>
                      ) : (
                        <span className="text-slate-400 text-xs italic">No details</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {!loading && logs.length > 0 && (
          <div className="px-6 py-4 border-t border-slate-200 bg-white">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={limit}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>

      {/* Details Modal */}
      {isModalOpen && selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm transition-all">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900 font-display flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  Modifications
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {selectedLog.action} • {selectedLog.entity} {selectedLog.entityId && `(${selectedLog.entityId})`}
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-8 bg-slate-50/50 flex flex-col items-center justify-center min-h-[200px] text-center">
              <h4 className="text-xl font-medium text-slate-800 font-display max-w-md leading-relaxed">
                {generateActionSummary(selectedLog)}
              </h4>
              <p className="text-sm text-slate-500 mt-4">
                Action performed by {selectedLog.user?.fullName || 'an Admin'} on {formatDate(selectedLog.createdAt)}
              </p>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-white flex justify-between items-center">
              {getEntityLink(selectedLog.entity, selectedLog.entityId) ? (
                <Link
                  to={getEntityLink(selectedLog.entity, selectedLog.entityId)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
                >
                  Go to Record
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              ) : (
                <div /> // empty placeholder for flex spacing
              )}
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
