// Lists comments and questions submitted through the public website.
// Handles inquiry reviews.


import { useState, useMemo, useEffect, useCallback } from 'react';
import { Mail, Search, Filter, Trash2, Eye, X, SlidersHorizontal, Reply, Send, Loader2, History, ChevronDown, ChevronUp } from 'lucide-react';
import StatusBadge from '../../components/common/StatusBadge';
import Pagination from '../../components/common/Pagination';
import {
  getContactSubmissions,
  updateContactSubmission,
  deleteContactSubmission,
  replyContactSubmission,
  getContactReplies
} from '../../services/contactService';

// Renders public contact form review board and inquiry response workflows
function ContactReviews() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [toast, setToast] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 15;

  // Reply Modal States
  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [replyingSubmission, setReplyingSubmission] = useState(null);
  const [replySubject, setReplySubject] = useState('');
  const [replyMessage, setReplyMessage] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  // Inline View Replies States inside Submission Details modal
  const [showInlineReplies, setShowInlineReplies] = useState(false);
  const [inlineRepliesList, setInlineRepliesList] = useState([]);
  const [loadingInlineReplies, setLoadingInlineReplies] = useState(false);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 4000);
  };

  // Dispatches query messages to retrieve guest inquiry logs
  const fetchSubmissions = useCallback(() => {
    setLoading(true);
    getContactSubmissions()
      .then((res) => {
        setSubmissions(res.data.data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading contact reviews:", err);
        setLoading(false);
      });
  }, []);

  // Fetches user contact inquiry logs on component mounting
  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  // Evaluates current queries to filter contact inquiries lists dynamically
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

  const totalPages = Math.max(1, Math.ceil(filteredSubmissions.length / ITEMS_PER_PAGE));

  const paginatedSubmissions = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredSubmissions.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredSubmissions, currentPage]);

  const handleStatusChange = (id, newStatus) => {
    updateContactSubmission(id, { status: newStatus })
      .then(() => {
        fetchSubmissions();
        showToast("Status updated successfully!");
        if (selectedSubmission && selectedSubmission.id === id) {
          setSelectedSubmission((prev) => ({ ...prev, status: newStatus }));
        }
      })
      .catch((err) => {
        showToast("Failed to update status.");
        console.error("Error updating status:", err);
      });
  };

  const handleDeleteClick = (id) => {
    setDeletingId(id);
  };

  // Requests delete API backend callback to remove inquiry logs
  const confirmDelete = () => {
    if (!deletingId) return;
    deleteContactSubmission(deletingId)
      .then(() => {
        setIsModalOpen(false);
        setSelectedSubmission(null);
        setDeletingId(null);
        fetchSubmissions();
        showToast("Submission deleted successfully!");
      })
      .catch((err) => {
        setDeletingId(null);
        showToast("Failed to delete submission.");
        console.error("Error deleting submission:", err);
      });
  };

  const openViewModal = (sub) => {
    setSelectedSubmission(sub);
    setIsModalOpen(true);
    setShowInlineReplies(false);
    setInlineRepliesList(sub.replies || []);
  };

  // Opens reply popup modal pre-filling recipient email & subject
  const openReplyModal = (sub) => {
    setReplyingSubmission(sub);
    setReplySubject(sub.subject ? `Re: ${sub.subject}` : 'Reply to your inquiry');
    setReplyMessage('');
    setReplyModalOpen(true);
  };

  // Toggles inline replies accordion dropdown inside Submission Details modal
  const toggleInlineReplies = async () => {
    if (!selectedSubmission) return;
    if (showInlineReplies) {
      setShowInlineReplies(false);
      return;
    }

    setShowInlineReplies(true);
    setLoadingInlineReplies(true);
    try {
      const res = await getContactReplies(selectedSubmission.id);
      const fetched = res.data.data || selectedSubmission.replies || [];
      setInlineRepliesList(fetched);
    } catch (err) {
      console.error("Error fetching replies:", err);
      setInlineRepliesList(selectedSubmission.replies || []);
    } finally {
      setLoadingInlineReplies(false);
    }
  };

  // Sends email reply to the submitter's address
  const handleSendReply = (e) => {
    e.preventDefault();
    if (!replyingSubmission || !replySubject.trim() || !replyMessage.trim()) {
      showToast("Please enter both subject and message.");
      return;
    }
    setSendingReply(true);
    replyContactSubmission(replyingSubmission.id, {
      subject: replySubject.trim(),
      message: replyMessage.trim()
    })
      .then((res) => {
        setSendingReply(false);
        setReplyModalOpen(false);
        setReplyingSubmission(null);
        showToast(res.data?.message || "Reply sent successfully!");
        fetchSubmissions();
        if (selectedSubmission && selectedSubmission.id === replyingSubmission.id) {
          setSelectedSubmission((prev) => ({ ...prev, status: 'Replied' }));
        }
      })
      .catch((err) => {
        setSendingReply(false);
        const errMsg = err.response?.data?.message || "Failed to send reply.";
        showToast(errMsg);
        console.error("Error sending reply:", err);
      });
  };

  // De-allocates active selected inquiry item and dismisses details modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedSubmission(null);
  };

  // Formats timestamps into readable localized dates
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
            Contact Reviews
          </h1>
          <p className="text-sm text-[#64748B] mt-1">
            Review user inquiries and feedback submitted via the public contact form.
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
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Replied">Replied</option>
              <option value="Resolved">Resolved</option>
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
          <span className="text-xs text-slate-500 font-semibold">Loading submissions...</span>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden font-sans">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                  <th scope="col" className="text-left py-3.5 px-5 text-[0.6875rem] font-semibold text-[#64748B] uppercase tracking-[0.05em]">
                    Submitter
                  </th>
                  <th scope="col" className="text-left py-3.5 px-4 text-[0.6875rem] font-semibold text-[#64748B] uppercase tracking-[0.05em]">
                    Subject
                  </th>
                  <th scope="col" className="text-left py-3.5 px-4 text-[0.6875rem] font-semibold text-[#64748B] uppercase tracking-[0.05em]">
                    Status
                  </th>
                  <th scope="col" className="text-left py-3.5 px-4 text-[0.6875rem] font-semibold text-[#64748B] uppercase tracking-[0.05em]">
                    Submitted On
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
                        <div className="w-9 h-9 rounded-full bg-primary-light text-primary flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                          {sub.firstName ? sub.firstName[0].toUpperCase() : 'C'}
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
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => openReplyModal(sub)}
                          title="Reply via Email"
                          className="px-2.5 py-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-md border border-indigo-200 transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                        >
                          <Reply size={13} /> Reply
                        </button>
                        <button
                          onClick={() => openViewModal(sub)}
                          className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
                          title="View Inquiry Details"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(sub.id)}
                          className="p-1.5 rounded-md hover:bg-rose-50 text-rose-400 hover:text-rose-600 cursor-pointer transition-colors"
                          title="Delete Submission"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredSubmissions.length === 0 && (
                  <tr>
                    <td colSpan="5" className="py-12 text-center text-sm text-[#64748B] font-medium">
                      No contact submissions match your filters
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
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-xl max-h-[90vh] overflow-y-auto animate-scale-up">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 font-display flex items-center gap-2">
                <Mail size={18} className="text-primary" /> Submission Details
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
                <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Message</span>
                <div className="mt-1.5 p-3.5 bg-slate-50 border border-slate-150 rounded-lg text-xs text-slate-600 leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap">
                  {selectedSubmission.message}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-3 border-t border-slate-100">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Status</label>
                  <select
                    value={selectedSubmission.status}
                    onChange={(e) => handleStatusChange(selectedSubmission.id, e.target.value)}
                    className="h-8 px-2 w-32 rounded-lg border border-[#CBD5E1] bg-white text-xs text-slate-800 outline-none focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/12 transition-all cursor-pointer"
                   aria-label="Select h-8 px-2 w-32 rounded-lg border border-[# c b d5 e1] bg-white text-xs text-slate-800 outline-none focus:border-[#4 f46 e5] focus:ring-2 focus:ring-[#4 f46 e5]/12 transition-all cursor-pointer">
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Replied">Replied</option>
                    <option value="Resolved">Resolved</option>
                  </select>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2 sm:self-end">
                  <button
                    onClick={() => {
                      const subToReply = selectedSubmission;
                      handleCloseModal();
                      openReplyModal(subToReply);
                    }}
                    className="px-3 h-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs whitespace-nowrap shrink-0"
                  >
                    <Reply size={13} /> Reply
                  </button>
                  <button
                    onClick={toggleInlineReplies}
                    className="px-3 h-8 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0"
                  >
                    <History size={13} /> {showInlineReplies ? "Hide Replies" : `View Replies ${selectedSubmission.replies?.length > 0 ? `(${selectedSubmission.replies.length})` : ''}`}
                    {showInlineReplies ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                  <button
                    onClick={() => handleDeleteClick(selectedSubmission.id)}
                    className="px-3 h-8 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0"
                  >
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              </div>

              {/* Inline Replies Dropdown Section */}
              {showInlineReplies && (
                <div className="mt-4 pt-4 border-t border-slate-100 space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <History size={14} className="text-blue-600" /> Sent Email Replies ({inlineRepliesList.length})
                    </h4>
                  </div>

                  {loadingInlineReplies ? (
                    <div className="py-6 flex items-center justify-center gap-2 text-slate-500 text-xs">
                      <Loader2 size={16} className="animate-spin text-indigo-600" /> Loading previous replies...
                    </div>
                  ) : inlineRepliesList.length === 0 ? (
                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-500 text-center">
                      No previous email replies sent to this inquiry.
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                      {inlineRepliesList.map((r, idx) => (
                        <div key={r.id || idx} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900">{r.senderName || "Admin"}</span>
                              <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${r.status === 'sent' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                                {r.status === 'sent' ? 'Sent' : 'Failed'}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-400 font-medium">{formatDate(r.createdAt)}</span>
                          </div>
                          <div className="font-semibold text-slate-800">
                            Subject: {r.subject}
                          </div>
                          <div className="p-2.5 bg-white border border-slate-200 rounded-md text-[11px] text-slate-700 whitespace-pre-wrap leading-relaxed">
                            {r.message}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {replyModalOpen && replyingSubmission && (
        <div className="fixed inset-0 bg-[#0f172a]/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in font-sans">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg max-h-[90vh] overflow-y-auto animate-scale-up">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 font-display flex items-center gap-2">
                <Reply size={18} className="text-indigo-600" /> Reply to Inquiry
              </h3>
              <button
                onClick={() => {
                  setReplyModalOpen(false);
                  setReplyingSubmission(null);
                }}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSendReply} className="p-6 space-y-4">
              <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-lg text-xs text-slate-700 flex flex-col gap-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-indigo-900">{replyingSubmission.firstName} {replyingSubmission.lastName}</span>
                  <span className="text-[10px] text-slate-500 font-medium">{formatDate(replyingSubmission.createdAt)}</span>
                </div>
                <span className="text-indigo-600 font-medium">{replyingSubmission.email}</span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Recipient Email (To)
                </label>
                <input
                  type="email"
                  value={replyingSubmission.email}
                  disabled
                  className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-slate-100 text-xs font-semibold text-slate-600 outline-none cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Subject <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={replySubject}
                  onChange={(e) => setReplySubject(e.target.value)}
                  placeholder="Enter reply subject..."
                  required
                  className="w-full h-9 px-3 rounded-lg border border-slate-300 bg-white text-xs text-slate-800 font-medium outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/12 transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Reply Message <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={5}
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Type your response to the user's inquiry here..."
                  required
                  className="w-full p-3 rounded-lg border border-slate-300 bg-white text-xs text-slate-800 font-normal outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/12 transition-all resize-none"
                />
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-500">
                <span className="font-bold text-slate-600 block mb-0.5">Original Inquiry Subject: {replyingSubmission.subject}</span>
                <p className="truncate italic text-slate-500">"{replyingSubmission.message}"</p>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setReplyModalOpen(false);
                    setReplyingSubmission(null);
                  }}
                  className="px-4 h-9 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingReply}
                  className="px-5 h-9 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-2 disabled:opacity-60"
                >
                  {sendingReply ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Sending Email...
                    </>
                  ) : (
                    <>
                      <Send size={14} /> Send Email Reply
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deletingId && (
        <div className="fixed inset-0 bg-[#0f172a]/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in font-sans">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-sm max-h-[90vh] overflow-y-auto animate-scale-up p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 font-display">Confirm Deletion</h3>
            <p className="text-xs text-slate-500 leading-normal">
              Are you sure you want to permanently delete this contact submission? This action cannot be undone.
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
    </div>
  );
}

export default ContactReviews;
