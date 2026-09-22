// Lists login access inquiries sent by suspended users.
// Handles user reactivations and inquiry deletions.

import { useState, useMemo, useEffect, useCallback } from 'react';
import { Mail, Search, Filter, Trash2, Eye, X, SlidersHorizontal, UserCheck, AlertTriangle } from 'lucide-react';
import StatusBadge from '../../components/common/StatusBadge';
import Pagination from '../../components/common/Pagination';
import {
  getSuspensionInquiries,
  reactivateSuspendedUser,
  deleteContactSubmission
} from '../../services/contactService';

function SuspensionReviews() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All'); // default filter to All statuses
  const [toast, setToast] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [reactivatingSubmission, setReactivatingSubmission] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 15;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 4000);
  };

  const fetchSubmissions = useCallback(() => {
    setLoading(true);
    getSuspensionInquiries()
      .then((res) => {
        setSubmissions(res.data.data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading suspension reviews:", err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const filteredSubmissions = useMemo(() => {
    return submissions.filter((sub) => {
      const name = `${sub.firstName || ''} ${sub.lastName || ''}`.toLowerCase();
      const matchesSearch =
        name.includes(searchQuery.toLowerCase()) ||
        (sub.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (sub.subject || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (sub.message || '').toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === 'All' || sub.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [submissions, searchQuery, statusFilter]);

  const [sortField, setSortField] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const sortedSubmissions = useMemo(() => {
    return [...filteredSubmissions].sort((a, b) => {
      let aVal = a[sortField] || '';
      let bVal = b[sortField] || '';
      if (sortField === 'name') {
        aVal = `${a.firstName || ''} ${a.lastName || ''}`.toLowerCase();
        bVal = `${b.firstName || ''} ${b.lastName || ''}`.toLowerCase();
      } else if (sortField === 'createdAt') {
        aVal = new Date(a.createdAt).getTime();
        bVal = new Date(b.createdAt).getTime();
      }
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredSubmissions, sortField, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(sortedSubmissions.length / ITEMS_PER_PAGE));

  const paginatedSubmissions = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedSubmissions.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedSubmissions, currentPage]);

  const handleDeleteClick = (id) => {
    setDeletingId(id);
  };

  const confirmDelete = () => {
    if (!deletingId) return;
    deleteContactSubmission(deletingId)
      .then(() => {
        setIsModalOpen(false);
        setSelectedSubmission(null);
        setDeletingId(null);
        fetchSubmissions();
        showToast("Inquiry deleted successfully!");
      })
      .catch((err) => {
        setDeletingId(null);
        showToast("Failed to delete inquiry.");
        console.error("Error deleting inquiry:", err);
      });
  };

  const confirmReactivate = () => {
    if (!reactivatingSubmission) return;
    reactivateSuspendedUser(reactivatingSubmission.id)
      .then(() => {
        setIsModalOpen(false);
        setSelectedSubmission(null);
        setReactivatingSubmission(null);
        fetchSubmissions();
        showToast("User account has been reactivated and email notification sent!");
      })
      .catch((err) => {
        setReactivatingSubmission(null);
        showToast("Failed to reactivate user.");
        console.error("Error reactivating user:", err);
      });
  };

  const openViewModal = (sub) => {
    setSelectedSubmission(sub);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedSubmission(null);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed top-5 right-5 bg-white border border-slate-200 text-slate-800 text-xs font-semibold px-4 py-3 rounded-lg shadow-md z-[9999] flex items-center">
          <span>{toast}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[1.75rem] font-bold text-[#0F172A] font-display">
            Suspension Reviews
          </h1>
          <p className="text-sm text-[#64748B] mt-1">
            Review and resolve appeals submitted by suspended users requesting login assistance or reactivation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto shrink-0">
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

      {showFilters && (
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 flex flex-col sm:flex-row items-center gap-4 shadow-sm transition-all duration-200">
          <div className="relative flex-1 w-full">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <input
              type="text"
              placeholder="Search by name, email, subject, message..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-[2.375rem] pl-9 pr-4 rounded-lg border border-[#CBD5E1] bg-white text-sm text-[#0F172A] placeholder-[#94A3B8] outline-none focus:border-[#4F46E5] focus:ring-[3px] focus:ring-[#4F46E5]/12 transition-all"
             aria-label="Search by name, email, subject, message..."/>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <SlidersHorizontal size={16} className="text-[#64748B]" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-[2.375rem] px-3 rounded-lg border border-[#CBD5E1] bg-white text-sm text-[#0F172A] outline-none focus:border-[#4F46E5] focus:ring-[3px] focus:ring-[#4F46E5]/12 transition-all cursor-pointer"
             aria-label="Select h-[2.375rem] px-3 rounded-lg border border-[# c b d5 e1] bg-white text-sm text-[#0 f172 a] outline-none focus:border-[#4 f46 e5] focus:ring-[3px] focus:ring-[#4 f46 e5]/12 transition-all cursor-pointer">
              <option value="All">All Statuses</option>
              <option value="Suspended">Suspended</option>
              <option value="Active">Active</option>
            </select>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-[#E2E8F0] shadow-sm">
          <svg className="animate-spin h-8 w-8 text-[#4F46E5] mb-3" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-xs text-slate-500 font-semibold">Loading suspension appeals...</span>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden font-sans">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                  <th 
                    scope="col" 
                    onClick={() => handleSort('name')}
                    className="text-left py-3.5 px-5 text-[0.6875rem] font-semibold text-[#64748B] uppercase tracking-[0.05em] cursor-pointer hover:text-slate-900 select-none"
                  >
                    Submitter {sortField === 'name' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th 
                    scope="col" 
                    onClick={() => handleSort('subject')}
                    className="text-left py-3.5 px-4 text-[0.6875rem] font-semibold text-[#64748B] uppercase tracking-[0.05em] cursor-pointer hover:text-slate-900 select-none"
                  >
                    Subject {sortField === 'subject' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th 
                    scope="col" 
                    onClick={() => handleSort('status')}
                    className="text-left py-3.5 px-4 text-[0.6875rem] font-semibold text-[#64748B] uppercase tracking-[0.05em] cursor-pointer hover:text-slate-900 select-none"
                  >
                    Status {sortField === 'status' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th 
                    scope="col" 
                    onClick={() => handleSort('createdAt')}
                    className="text-left py-3.5 px-4 text-[0.6875rem] font-semibold text-[#64748B] uppercase tracking-[0.05em] cursor-pointer hover:text-slate-900 select-none"
                  >
                    Submitted On {sortField === 'createdAt' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th scope="col" className="text-center py-3.5 px-4 text-[0.6875rem] font-semibold text-[#64748B] uppercase tracking-[0.05em]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedSubmissions.map((sub) => (
                  <tr
                    key={sub.id}
                    className="border-b border-[#F1F5F9] last:border-b-0 hover:bg-[#F8FAFC]/50 transition-colors"
                  >
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                          {sub.firstName ? sub.firstName[0].toUpperCase() : 'S'}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[#0F172A] font-display">
                            {sub.firstName} {sub.lastName}
                          </p>
                          <p className="text-xs text-[#64748B] mt-0.5 font-medium">
                            {sub.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4 max-w-xs truncate">
                      <p className="text-xs font-semibold text-[#334155]">{sub.subject}</p>
                    </td>

                    <td className="py-4 px-4">
                      <StatusBadge status={sub.status} />
                    </td>

                    <td className="py-4 px-4">
                      <span className="text-xs font-medium text-[#475569]">
                        {formatDate(sub.createdAt)}
                      </span>
                    </td>

                    <td className="py-4 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openViewModal(sub)}
                          title="View Inquiry Details"
                          className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
                         aria-label="View Inquiry Details">
                          <Eye size={16} />
                        </button>
                        {sub.status === 'Suspended' && (
                          <button
                            onClick={() => setReactivatingSubmission(sub)}
                            title="Reactivate User"
                            className="p-1.5 rounded-md hover:bg-emerald-50 text-emerald-500 hover:text-emerald-700 cursor-pointer transition-colors"
                           aria-label="Reactivate User">
                            <UserCheck size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteClick(sub.id)}
                          title="Delete Inquiry Message"
                          className="p-1.5 rounded-md hover:bg-rose-50 text-rose-400 hover:text-rose-600 cursor-pointer transition-colors"
                         aria-label="Delete Inquiry Message">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredSubmissions.length === 0 && (
                  <tr>
                    <td colSpan="5" className="py-12 text-center text-sm text-[#64748B] font-medium">
                      No suspension appeals match your filters
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="px-5 py-4 border-t border-[#E2E8F0] bg-[#F8FAFC]/30">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredSubmissions.length}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={(page) => setCurrentPage(page)}
            />
          </div>
        </div>
      )}

      {isModalOpen && selectedSubmission && (
        <div className="fixed inset-0 bg-[#0f172a]/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in font-sans">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg max-h-[90vh] overflow-y-auto animate-scale-up">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 font-display flex items-center gap-2">
                <Mail size={18} className="text-rose-600" /> Appeal Submission Details
              </h3>
              <button
                onClick={handleCloseModal}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Submitter</span>
                  <span className="text-xs font-semibold text-slate-700">{selectedSubmission.firstName} {selectedSubmission.lastName}</span>
                </div>
                <div>
                  <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Email</span>
                  <a href={`mailto:${selectedSubmission.email}`} className="text-xs font-semibold text-primary hover:underline">{selectedSubmission.email}</a>
                </div>
              </div>

              <div>
                <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Submitted On</span>
                <span className="text-xs font-semibold text-slate-700">{formatDate(selectedSubmission.createdAt)}</span>
              </div>

              <div>
                <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Subject</span>
                <span className="text-xs font-bold text-slate-900">{selectedSubmission.subject}</span>
              </div>

              <div>
                <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Appeal Message</span>
                <div className="mt-1.5 p-3.5 bg-slate-50 border border-slate-150 rounded-lg text-xs text-slate-600 leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap">
                  {selectedSubmission.message}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between pt-3 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Status:</span>
                  <StatusBadge status={selectedSubmission.status} />
                </div>

                <div className="flex justify-end gap-3">
                  {selectedSubmission.status === 'Suspended' && (
                    <button
                      onClick={() => {
                        setReactivatingSubmission(selectedSubmission);
                      }}
                      className="px-3.5 h-8 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <UserCheck size={13} /> Reactivate Account
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteClick(selectedSubmission.id)}
                    className="px-3 h-8 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Trash2 size={13} /> Delete
                  </button>
                  <button
                    onClick={handleCloseModal}
                    className="px-4 h-8 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {deletingId && (
        <div className="fixed inset-0 bg-[#0f172a]/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in font-sans">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-sm max-h-[90vh] overflow-y-auto animate-scale-up p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 font-display">Confirm Deletion</h3>
            <p className="text-xs text-slate-500 leading-normal">
              Are you sure you want to permanently delete this suspension review appeal message? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setDeletingId(null)}
                className="px-4 h-9 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 h-9 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {reactivatingSubmission && (
        <div className="fixed inset-0 bg-[#0f172a]/45 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-sm p-6 space-y-4 animate-scale-up">
            <div className="flex items-center gap-2.5 text-emerald-600">
              <span className="p-2 bg-emerald-50 rounded-full shrink-0">
                <UserCheck size={20} />
              </span>
              <h4 className="text-sm font-bold font-display">Confirm User Reactivation</h4>
            </div>
            
            <p className="text-xs text-slate-500 leading-normal">
              Are you sure you want to reactivate the account for <strong>{reactivatingSubmission.firstName} {reactivatingSubmission.lastName}</strong> ({reactivatingSubmission.email})? 
              This will restore their access, clear the suspension reason, and send them an email notification.
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setReactivatingSubmission(null)}
                className="px-4 h-9 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmReactivate}
                className="px-4 h-9 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Confirm Reactivate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SuspensionReviews;
