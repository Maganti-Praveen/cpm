// Financial audit list mapping client payments to invoices.
// Validates transactional records.

import { useState, useMemo, useEffect, useCallback } from 'react';
import { Search, Eye, X, Check, Ban, Receipt, HandCoins, Zap, AlertCircle, Download } from 'lucide-react';
import { exportToExcel } from '../../utils/excelExport';
import { getTransactions, verifyTransaction } from '../../services/transactionService';
import Pagination from '../../components/common/Pagination';

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'manual' | 'automatic'
  const [selectedTx, setSelectedTx] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState(null);
  const [verifyingId, setVerifyingId] = useState(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 15;

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery]);

  // Handle Export to Excel
  const handleExport = () => {
    try {
      if (filteredTransactions.length === 0) {
        showToast("No data available to export!", "error");
        return;
      }
      const mapped = filteredTransactions.map(tx => ({
        "Transaction ID": tx.transactionId || '',
        "Date Submitted": tx.createdAt ? new Date(tx.createdAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }) : '',
        "Client Name": tx.client?.fullName || '',
        "Client / Company": tx.client?.company || 'Personal',
        "Invoice ID": tx.invoice?.invoiceNumber || '',
        "Amount (INR)": tx.amount || 0,
        "Payment Type": tx.paymentType || '',
        "Gateway Name / Proof": tx.paymentType === 'manual' ? (tx.paymentProof || 'No proof') : (tx.gatewayName || ''),
        "Status": tx.status || ''
      }));
      exportToExcel(mapped, "Transactions");
    } catch (err) {
      console.error("Failed to export transactions:", err);
      showToast("Failed to export transactions data.", "error");
    }
  };
  
  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 4000);
  };

  // Retrieves transaction ledgers matched to client accounts
  const fetchTransactions = useCallback(() => {
    setLoading(true);
    getTransactions()
      .then((res) => {
        setTransactions(res.data.data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading transactions:", err);
        setLoading(false);
      });
  }, []);

  // Refetches log statements upon filters change
  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Matches transaction lists entries to current search key
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const matchesTab = activeTab === 'all' || tx.paymentType === activeTab;

      const clientName = tx.client?.fullName || '';
      const invoiceNumber = tx.invoice?.invoiceNumber || '';

      const matchesSearch =
        clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.transactionId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (tx.paymentProof || '').toLowerCase().includes(searchQuery.toLowerCase());

      return matchesTab && matchesSearch;
    });
  }, [transactions, activeTab, searchQuery]);

  // Computes final standard page values boundary limits
  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE));

  // Segments transaction entries within bounds of current page selections
  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredTransactions.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredTransactions, currentPage]);

  const handleVerify = (id, verifyStatus) => {
    setVerifyingId(id);
    verifyTransaction(id, { status: verifyStatus })
      .then(() => {
        fetchTransactions();
        showToast(`Transaction successfully ${verifyStatus === 'Success' ? 'approved' : 'rejected'}!`);
        setIsModalOpen(false);
        setSelectedTx(null);
        setVerifyingId(null);
      })
      .catch((err) => {
        showToast(err.response?.data?.message || "Failed to update transaction status.");
        setVerifyingId(null);
      });
  };

  const openViewModal = (tx) => {
    setSelectedTx(tx);
    setIsModalOpen(true);
  };

  // Clears select record focus and closes transactions review modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTx(null);
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

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Success':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full border bg-emerald-50 text-emerald-700 border-emerald-100">Success</span>;
      case 'Pending':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full border bg-amber-50 text-amber-700 border-amber-100 animate-pulse">Pending Review</span>;
      case 'Rejected':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full border bg-rose-50 text-rose-700 border-rose-100">Rejected</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full border bg-slate-50 text-slate-700 border-slate-100">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {toast && (
        <div className="fixed top-5 right-5 bg-white border border-slate-200 text-slate-800 text-xs font-semibold px-4 py-3 rounded-lg shadow-md z-[9999] flex items-center">
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-[1.75rem] font-bold text-[#0F172A] font-display">
            Transactions Log
          </h1>
          <p className="text-sm text-[#64748B] mt-1">
            Monitor incoming manual client transfers and online payment gateway logs.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
          {/* Export to Excel */}
          <button
            onClick={handleExport}
            disabled={filteredTransactions.length === 0}
            title={filteredTransactions.length === 0 ? "No data available to export!" : "Export to Excel"}
            className="inline-flex items-center gap-1.5 px-4 h-[2.375rem] rounded-[--radius-md] border border-indigo-200 hover:border-indigo-400 text-[#4F46E5] bg-[#4F46E5]/5 hover:bg-[#4F46E5]/10 text-sm font-medium transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
           aria-label={filteredTransactions.length === 0 ? "No data available to export!" : "Export to Excel"}>
            <Download size={15} />
            Export Data
          </button>

          {/* Search */}
          <div className="relative flex-1 md:w-80">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none" />
            <input
              type="text"
              placeholder="Search by client, invoice, reference..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-[2.375rem] pl-9 pr-4 rounded-lg border border-[#CBD5E1] bg-white text-sm text-[#0F172A] placeholder-[#94A3B8] outline-none focus:border-[#4F46E5] focus:ring-[3px] focus:ring-[#4F46E5]/12 transition-all"
             aria-label="Search by client, invoice, reference..."/>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto no-scrollbar whitespace-nowrap">
        <button
          onClick={() => { setActiveTab('all'); setSearchQuery(''); }}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 text-sm font-semibold transition-all cursor-pointer border-none bg-transparent shrink-0 ${activeTab === 'all'
              ? 'border-b-indigo-600! text-indigo-600 font-bold'
              : 'border-b-transparent text-slate-500 hover:text-slate-800'
            }`}
        >
          <Receipt size={16} />
          All Payments
        </button>
        <button
          onClick={() => { setActiveTab('automatic'); setSearchQuery(''); }}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 text-sm font-semibold transition-all cursor-pointer border-none bg-transparent shrink-0 ${activeTab === 'automatic'
              ? 'border-b-indigo-600! text-indigo-600 font-bold'
              : 'border-b-transparent text-slate-500 hover:text-slate-800'
            }`}
        >
          <Zap size={16} />
          Automatic Payments
        </button>
        <button
          onClick={() => { setActiveTab('manual'); setSearchQuery(''); }}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 text-sm font-semibold transition-all cursor-pointer border-none bg-transparent shrink-0 ${activeTab === 'manual'
              ? 'border-b-indigo-600! text-indigo-600 font-bold'
              : 'border-b-transparent text-slate-500 hover:text-slate-800'
            }`}
        >
          <HandCoins size={16} />
          Manual Payments
        </button>
      </div>

      {/* Table Container */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-[#E2E8F0] shadow-xs">
          <svg className="animate-spin h-8 w-8 text-[#4F46E5] mb-3" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-xs text-slate-500 font-semibold">Syncing Transactions...</span>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                  <th className="py-3.5 px-5 text-[0.6875rem] font-bold text-[#64748B] uppercase tracking-wider">
                    Transaction ID / Date
                  </th>
                  <th className="py-3.5 px-4 text-[0.6875rem] font-bold text-[#64748B] uppercase tracking-wider">
                    Client / Company
                  </th>
                  <th className="py-3.5 px-4 text-[0.6875rem] font-bold text-[#64748B] uppercase tracking-wider">
                    Invoice ID
                  </th>
                  <th className="py-3.5 px-4 text-[0.6875rem] font-bold text-[#64748B] uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="py-3.5 px-4 text-[0.6875rem] font-bold text-[#64748B] uppercase tracking-wider">
                    {activeTab === 'manual' ? 'Reference Proof' : activeTab === 'automatic' ? 'Gateway' : 'Gateway / Proof'}
                  </th>
                  <th className="py-3.5 px-4 text-[0.6875rem] font-bold text-[#64748B] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="py-3.5 px-4 text-center text-[0.6875rem] font-bold text-[#64748B] uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9] font-medium text-slate-700">
                {paginatedTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-[#F8FAFC]/50 transition-colors">
                    <td className="py-4 px-5">
                      <p className="font-bold text-slate-900">{tx.transactionId}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{formatDate(tx.createdAt)}</p>
                    </td>
                    <td className="py-4 px-4">
                      <p className="font-semibold text-slate-900">{tx.client?.fullName}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{tx.client?.company || 'Personal'}</p>
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-bold text-slate-800">{tx.invoice?.invoiceNumber}</span>
                    </td>
                    <td className="py-4 px-4 font-bold text-slate-900">
                      ₹{tx.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-4 px-4 max-w-xs truncate text-xs text-slate-500">
                      {tx.paymentType === 'manual' ? (
                        tx.paymentProof ? (
                          <a href={tx.paymentProof} target="_blank" rel="noopener noreferrer" className="inline-block">
                            <img
                              src={tx.paymentProof}
                              alt="Proof"
                              className="w-10 h-10 object-cover rounded-lg border border-slate-200 hover:scale-105 transition-transform"
                            />
                          </a>
                        ) : (
                          <span className="text-slate-400 italic">No proof</span>
                        )
                      ) : (
                        <span className="capitalize">{tx.gatewayName}</span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      {getStatusBadge(tx.status)}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <button
                        onClick={() => openViewModal(tx)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 cursor-pointer transition-colors border-none bg-transparent"
                        title="View Details"
                       aria-label="View Details">
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}

                {filteredTransactions.length === 0 && (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-sm text-[#64748B] font-medium">
                      No transactions recorded under this filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="px-5 py-4 border-t border-[#E2E8F0] bg-[#F8FAFC]/30">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredTransactions.length}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={(page) => setCurrentPage(page)}
            />
          </div>
        </div>
      )}

      {/* View Detail Modal */}
      {isModalOpen && selectedTx && (
        <div className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div>
                <h3 className="text-sm font-bold text-slate-900 font-display flex items-center gap-2">
                  <Receipt className="w-4.5 h-4.5 text-indigo-600" /> Transaction details
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">{selectedTx.transactionId}</p>
              </div>
              <button
                onClick={handleCloseModal}
                disabled={verifyingId !== null}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md p-1 transition-colors cursor-pointer bg-transparent border-none"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Client</span>
                  <span className="text-xs font-semibold text-slate-800">{selectedTx.client?.fullName}</span>
                </div>
                <div>
                  <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Company</span>
                  <span className="text-xs font-semibold text-slate-800">{selectedTx.client?.company || 'Personal'}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Transaction ID</span>
                  <span className="text-xs font-bold text-slate-900">{selectedTx.transactionId}</span>
                </div>
                <div>
                  <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Invoice ID</span>
                  <span className="text-xs font-bold text-slate-900">{selectedTx.invoice?.invoiceNumber}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Payment Method</span>
                  <span className="text-xs font-semibold text-slate-800 capitalize">
                    {selectedTx.paymentType === 'manual' ? 'Bank Transfer' : `Online (${selectedTx.gatewayName})`}
                  </span>
                </div>
                <div>
                  <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Amount Paid</span>
                  <span className="text-sm font-bold text-slate-950">₹{selectedTx.amount.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Date Submitted</span>
                  <span className="text-xs font-medium text-slate-800">{formatDate(selectedTx.createdAt)}</span>
                </div>
                <div>
                  <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Status</span>
                  <div className="mt-1">{getStatusBadge(selectedTx.status)}</div>
                </div>
              </div>

              {selectedTx.paymentProof && (
                <div className="space-y-1.5">
                  <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Reference Proof Image</span>
                  <div className="mt-1 relative group">
                    <a href={selectedTx.paymentProof} target="_blank" rel="noopener noreferrer" className="block relative cursor-pointer">
                      <img
                        src={selectedTx.paymentProof}
                        alt="Payment Proof"
                        className="w-full max-h-48 object-contain rounded-xl border border-slate-200 hover:opacity-90 transition-opacity"
                      />
                      <span className="absolute bottom-2 right-2 bg-slate-900/80 text-white text-[10px] font-bold px-2 py-1 rounded-md backdrop-blur-xs shadow-xs group-hover:bg-indigo-600 transition-colors">
                        View Full Size ↗
                      </span>
                    </a>
                  </div>
                </div>
              )}

              {/* Action Handlers for Manual Payments only */}
              {selectedTx.paymentType === 'manual' && selectedTx.status === 'Pending' && (
                <div className="pt-4 border-t border-slate-100 flex gap-3">
                  <button
                    onClick={() => handleVerify(selectedTx.id, 'Rejected')}
                    disabled={verifyingId !== null}
                    className="flex-1 h-9 rounded-xl border border-rose-200 text-rose-700 bg-rose-50/50 hover:bg-rose-50 hover:border-rose-300 disabled:opacity-50 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Ban size={14} />
                    Reject Payment
                  </button>
                  <button
                    onClick={() => handleVerify(selectedTx.id, 'Success')}
                    disabled={verifyingId !== null}
                    className="flex-1 h-9 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 border-none"
                  >
                    <Check size={14} />
                    Approve Payment
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
