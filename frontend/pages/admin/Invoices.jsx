import { useToast } from '../../context/ToastContext';
// Invoicing workspace displaying client bills, payment receipts, and balance trackers.
// Handles financial entries.

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Pagination from '../../components/common/Pagination';
import { 
  Receipt, 
  Plus, 
  Search, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  IndianRupee, 
  TrendingUp, 
  AlertCircle,
  X,
  FileText,
  Check,
  Image,
  Calendar,
  Eye,
  Download,
} from 'lucide-react';
import { exportToExcel } from '../../utils/excelExport';
import { getInvoices, createInvoice, updateInvoice, deleteInvoice } from '../../services/invoiceService';
import { getClients } from '../../services/clientService';
import { getProjects } from '../../services/projectService';
import API from '../../services/api';

const STATUS_FILTERS = ['All', 'Paid', 'Unpaid', 'Cancelled'];

function AdminInvoices() {
  const { showToast } = useToast();
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Navigation tabs: 'invoices' | 'verification'
  const [activeTab, setActiveTab] = useState('invoices');
  const [lightboxUrl, setLightboxUrl] = useState(null);
  
  // Filters
  const [searchParams] = useSearchParams();
  const searchParamVal = searchParams.get('search') || '';
  const [status, setStatus] = useState('All');
  const [selectedClient, setSelectedClient] = useState('All');
  const [search, setSearch] = useState(searchParamVal);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 15;

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [status, selectedClient, search]);

  useEffect(() => {
    const s = searchParams.get('search') || '';
    setSearch(s);
  }, [searchParams]);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [formData, setFormData] = useState({
    invoiceNumber: '',
    clientId: '',
    projectId: '',
    amount: '',
    dueDate: '',
    description: '',
    status: 'Unpaid'
  });
  
  // Delete Confirmation State
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [successToast, setSuccessToast] = useState("");

  // Handle Export to Excel
  const handleExport = () => {
    try {
      if (invoices.length === 0) {
        showToast("No data available to export!", "error");
        return;
      }
      const mapped = invoices.map(inv => ({
        "Invoice ID": inv.invoiceNumber || '',
        "Client Name": inv.client?.fullName || '',
        "Client / Company": inv.client?.company || 'Independent',
        "Assigned Project": inv.project?.name || 'No Tied Project',
        "Amount (INR)": inv.amount || 0,
        "Issued Date": inv.issueDate ? new Date(inv.issueDate).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : '',
        "Due Date": inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : '',
        "Status": inv.status || ''
      }));
      exportToExcel(mapped, "Invoices");
    } catch (err) {
      console.error("Failed to export invoices:", err);
      showToast("Failed to export invoices data.", "error");
    }
  };

  // Fetch Invoices
  const fetchInvoices = useCallback(() => {
    setLoading(true);
    const params = {};
    if (status !== 'All') params.status = status;
    if (selectedClient !== 'All') params.clientId = selectedClient;
    if (search) params.search = search;

    getInvoices(params)
      .then((res) => {
        setInvoices(res.data.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching invoices:", err);
        setLoading(false);
      });
  }, [status, selectedClient, search]);

  // Load Initial Data
  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  // Load clients & projects for modal
  useEffect(() => {
    getClients()
      .then(res => setClients(res.data.data))
      .catch(err => console.error("Error loading clients:", err));
      
    getProjects()
      .then(res => setProjects(res.data.data))
      .catch(err => console.error("Error loading projects:", err));
  }, []);

  // Compute stats based on ALL current invoices fetched
  const stats = useMemo(() => {
    let total = 0;
    let paid = 0;
    let unpaid = 0;

    invoices.forEach(inv => {
      total += inv.amount;
      if (inv.status === 'Paid') {
        paid += inv.amount;
      } else if (inv.status === 'Unpaid') {
        unpaid += inv.amount;
      }
    });

    return { total, paid, unpaid };
  }, [invoices]);

  // Paginated invoices & total pages
  const totalPages = Math.max(1, Math.ceil(invoices.length / ITEMS_PER_PAGE));

  const paginatedInvoices = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return invoices.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [invoices, currentPage]);

  // Handle Create Invoice Modal
  const handleOpenModal = () => {
    setFormData({
      invoiceNumber: `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      clientId: '',
      projectId: '',
      amount: '',
      dueDate: '',
      description: '',
      status: 'Unpaid'
    });
    setIsModalOpen(true);
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!formData.clientId || !formData.amount || !formData.dueDate) {
      showToast("Please fill in all required fields.", "error");
      return;
    }
    if (isNaN(parseFloat(formData.amount)) || parseFloat(formData.amount) <= 0) {
      showToast("Invoice amount must be greater than zero.", "error");
      return;
    }

    setModalLoading(true);
    const payload = {
      ...formData,
      amount: parseFloat(formData.amount),
      clientId: parseInt(formData.clientId),
      projectId: formData.projectId ? parseInt(formData.projectId) : null
    };

    createInvoice(payload)
      .then(() => {
        setModalLoading(false);
        setIsModalOpen(false);
        setSuccessToast("Invoice created successfully!");
        setTimeout(() => setSuccessToast(""), 3000);
        fetchInvoices();
      })
      .catch((err) => {
        setModalLoading(false);
        showToast(err.response?.data?.message || "Error creating invoice", "error");
      });
  };

  // Change invoice status
  const handleStatusChange = (id, newStatus) => {
    updateInvoice(id, { status: newStatus })
      .then(() => {
        setSuccessToast(`Invoice marked as ${newStatus}!`);
        setTimeout(() => setSuccessToast(""), 3000);
        fetchInvoices();
      })
      .catch((err) => console.error("Error updating status:", err));
  };

  // Delete invoice
  const handleDelete = (id) => {
    deleteInvoice(id)
      .then(() => {
        setDeleteConfirmId(null);
        setSuccessToast("Invoice deleted successfully!");
        setTimeout(() => setSuccessToast(""), 3000);
        fetchInvoices();
      })
      .catch((err) => {
        console.error("Error deleting invoice:", err);
        showToast("Failed to delete invoice.", "error");
      });
  };

  // Verify manual payment proof (Approve/Reject)
  const handleVerifyPayment = async (id, action) => {
    try {
      setLoading(true);
      const res = await API.put(`/payments/manual/verify/${id}`, { action });
      if (res.data?.success) {
        setSuccessToast(`Payment ${action === 'approve' ? 'approved' : 'rejected'} successfully!`);
        setTimeout(() => setSuccessToast(""), 3000);
        fetchInvoices();
      } else {
        showToast("Action failed.", "error");
        setLoading(false);
      }
    } catch (err) {
      console.error("Verification error:", err);
      showToast(err.response?.data?.message || "Verification failed", "error");
      setLoading(false);
    }
  };

  // Filter for pending manual payment invoices
  const pendingManualInvoices = useMemo(() => {
    return invoices.filter(inv => inv.status === 'Pending' || inv.paymentStatus === 'PENDING_APPROVAL');
  }, [invoices]);

  const pendingCount = pendingManualInvoices.length;

  // Filter projects based on selected client in modal
  const filteredProjectsForModal = useMemo(() => {
    if (!formData.clientId) return [];
    return projects.filter(p => p.clientId === parseInt(formData.clientId));
  }, [formData.clientId, projects]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[1.75rem] font-bold text-[#0F172A] font-display">
            Invoices
          </h1>
          <p className="text-sm text-[#64748B] mt-1">
            Generate billing summaries, monitor collections, and log client payments.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto shrink-0">
          {/* Export to Excel */}
          <button
            onClick={handleExport}
            disabled={invoices.length === 0}
            title={invoices.length === 0 ? "No data available to export!" : "Export to Excel"}
            className="inline-flex items-center gap-1.5 px-4 h-9 rounded-[--radius-md] border border-indigo-200 hover:border-indigo-400 text-[#4F46E5] bg-[#4F46E5]/5 hover:bg-[#4F46E5]/10 text-sm font-medium transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
           aria-label={invoices.length === 0 ? "No data available to export!" : "Export to Excel"}>
            <Download size={15} />
            Export Data
          </button>

          <button
            onClick={handleOpenModal}
            className="inline-flex items-center justify-center gap-1.5 px-4 h-9 rounded-lg bg-[#4F46E5] text-sm font-medium text-white hover:bg-[#3730A3] transition-all duration-150 cursor-pointer shadow-sm border-none w-full sm:w-auto shrink-0"
          >
            <Plus size={16} />
            Create Invoice
          </button>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
            <IndianRupee size={24} />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Billed</span>
            <span className="text-xl font-bold text-slate-800 font-display mt-0.5 block">
              ₹{stats.total.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
            <TrendingUp size={24} />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Collected</span>
            <span className="text-xl font-bold text-emerald-600 font-display mt-0.5 block">
              ₹{stats.paid.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
            <AlertCircle size={24} />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Outstanding Balances</span>
            <span className="text-xl font-bold text-amber-600 font-display mt-0.5 block">
              ₹{stats.unpaid.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-3 items-center">
          {/* Status Tabs */}
          <div className="flex bg-slate-100 rounded-lg p-1 text-xs font-semibold text-slate-600 border border-slate-200">
            {STATUS_FILTERS.map(f => (
              <button
                key={f}
                onClick={() => setStatus(f)}
                className={`px-3 py-1.5 rounded-md transition-all cursor-pointer border-none ${
                  status === f 
                    ? 'bg-white text-slate-900 shadow-xs font-bold' 
                    : 'hover:text-slate-900 bg-transparent'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Client Filter */}
          <div className="flex items-center gap-2">
            <label htmlFor="client-filter-select" className="text-xs text-slate-500 font-semibold uppercase">Client:</label>
            <select
              id="client-filter-select"
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="h-8 text-xs border border-slate-200 rounded-lg bg-white outline-none px-2 cursor-pointer font-semibold text-slate-700"
              aria-label="Filter invoices by client"
            >
              <option value="All">All Clients</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.company})</option>
              ))}
            </select>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-64">
          <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by invoice ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 text-xs border border-slate-200 rounded-lg outline-none focus:border-indigo-500 transition-all placeholder:text-slate-400 font-medium"
           aria-label="Search by invoice ID..."/>
        </div>
      </div>

      {/* Invoices List Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <svg className="animate-spin h-7 w-7 text-indigo-600 mb-3" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Syncing Invoices...</span>
          </div>
        ) : invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Receipt size={40} className="mb-3.5 text-slate-300" />
            <p className="text-sm font-semibold text-slate-600">No Invoices Found</p>
            <p className="text-xs text-slate-400 mt-1">Try resetting your search query or generate a new invoice.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold border-bottom border-slate-100 uppercase tracking-wider">
                  <th className="p-4 pl-6">Invoice ID</th>
                  <th className="p-4">Client / Company</th>
                  <th className="p-4">Assigned Project</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Issued</th>
                  <th className="p-4">Due Date</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right pr-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {paginatedInvoices.map((inv) => {
                  const isPaid = inv.status === 'Paid';
                  const isCancelled = inv.status === 'Cancelled';
                  
                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 pl-6 font-bold text-slate-900 flex items-center gap-2">
                        <FileText size={14} className="text-slate-400 shrink-0" />
                        <span>{inv.invoiceNumber}</span>
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-slate-800">{inv.client.fullName}</div>
                        <div className="text-[11px] text-slate-400 font-medium">{inv.client.company || "Independent"}</div>
                      </td>
                      <td className="p-4 text-slate-500">
                        {inv.project ? inv.project.name : (
                          <span className="italic text-slate-400 font-normal">No Tied Project</span>
                        )}
                      </td>
                      <td className="p-4 font-bold text-slate-900">
                        ₹{inv.amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </td>
                      <td className="p-4 text-slate-500">
                        {new Date(inv.issueDate).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
                      </td>
                      <td className="p-4 text-slate-500">
                        {new Date(inv.dueDate).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-1 text-[11px] font-bold rounded-full border ${
                            isPaid
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                              : isCancelled
                              ? 'bg-slate-100 text-slate-500 border-slate-200'
                              : 'bg-amber-50 text-amber-700 border-amber-100'
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td className="p-4 text-right pr-6">
                        <div className="flex justify-end gap-1.5 items-center">
                          {/* Mark Paid Toggle */}
                          {!isPaid && !isCancelled && (
                            <button
                              onClick={() => handleStatusChange(inv.id, 'Paid')}
                              title="Mark as Paid"
                              className="p-1 rounded-md text-emerald-600 hover:bg-emerald-50 hover:text-emerald-800 transition-colors border-none bg-transparent cursor-pointer"
                             aria-label="Mark as Paid">
                              <CheckCircle size={15} />
                            </button>
                          )}
                          
                          {/* Mark Cancelled Toggle */}
                          {!isPaid && !isCancelled && (
                            <button
                              onClick={() => handleStatusChange(inv.id, 'Cancelled')}
                              title="Cancel Invoice"
                              className="p-1 rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors border-none bg-transparent cursor-pointer"
                             aria-label="Cancel Invoice">
                              <XCircle size={15} />
                            </button>
                          )}
  
                          {/* Delete Action with inline confirm */}
                          {deleteConfirmId === inv.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleDelete(inv.id)}
                                className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[11px] border-none font-bold cursor-pointer"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded text-[11px] border-none font-bold cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirmId(inv.id)}
                              title="Delete Invoice"
                              className="p-1 rounded-md text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition-colors border-none bg-transparent cursor-pointer"
                             aria-label="Delete Invoice">
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Controls */}
          <div className="px-5 py-4 border-t border-[#E2E8F0] bg-[#F8FAFC]/30">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={invoices.length}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={(page) => setCurrentPage(page)}
            />
          </div>
        </>
      )}
    </div>

      {/* Invoice Creation Overlay Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#0f172a]/45 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
              <h3 className="text-base font-bold text-slate-900 font-display">
                Create New Invoice
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all border-none bg-transparent cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleCreateSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Invoice Number */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                  Invoice Number
                </label>
                <input
                  type="text"
                  value={formData.invoiceNumber}
                  onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                  placeholder="e.g. INV-2026-001"
                  required
                  className="w-full h-10 px-3.5 text-xs border border-slate-300 rounded-xl outline-none focus:border-indigo-600 transition-all placeholder:text-slate-400"
                 aria-label="e.g. INV-2026-001"/>
              </div>

              {/* Client Selection */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                  Select Client *
                </label>
                <select
                  value={formData.clientId}
                  onChange={(e) => setFormData({ ...formData, clientId: e.target.value, projectId: '' })}
                  required
                  className="w-full h-10 px-3.5 text-xs border border-slate-300 rounded-xl outline-none focus:border-indigo-600 bg-white cursor-pointer"
                 aria-label="Select w-full h-10 px-3.5 text-xs border border-slate-300 rounded-xl outline-none focus:border-indigo-600 bg-white cursor-pointer">
                  <option value="">Select a client...</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.company || "Independent"})
                    </option>
                  ))}
                </select>
              </div>

              {/* Project Selection (Dynamic based on selected Client) */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                  Relates to Project
                </label>
                <select
                  value={formData.projectId}
                  onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                  disabled={!formData.clientId}
                  className="w-full h-10 px-3.5 text-xs border border-slate-300 rounded-xl outline-none focus:border-indigo-600 bg-white disabled:bg-slate-50 disabled:text-slate-400 cursor-pointer disabled:cursor-not-allowed"
                 aria-label="Select w-full h-10 px-3.5 text-xs border border-slate-300 rounded-xl outline-none focus:border-indigo-600 bg-white disabled:bg-slate-50 disabled:text-slate-400 cursor-pointer disabled:cursor-not-allowed">
                  <option value="">
                    {!formData.clientId 
                      ? "Select a client first..." 
                      : filteredProjectsForModal.length === 0 
                      ? "No projects found for this client" 
                      : "General Invoice (No tied project)"
                    }
                  </option>
                  {filteredProjectsForModal.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount & Due Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                    Amount (INR) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    placeholder="e.g. 50000"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                    className="w-full h-10 px-3.5 text-xs border border-slate-300 rounded-xl outline-none focus:border-indigo-600 transition-all placeholder:text-slate-400"
                   aria-label="e.g. 50000"/>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                    Due Date *
                  </label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    required
                    className="w-full h-10 px-3.5 text-xs border border-slate-300 rounded-xl outline-none focus:border-indigo-600 transition-all cursor-pointer"
                   aria-label="W-full h-10 px-3.5 text-xs border border-slate-300 rounded-xl outline-none focus:border-indigo-600 transition-all cursor-pointer"/>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                  Description / Remarks
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="3"
                  placeholder="Details about milestone billing, hours logged, or special client notes..."
                  className="w-full p-3.5 text-xs border border-slate-300 rounded-xl outline-none focus:border-indigo-600 transition-all placeholder:text-slate-400 resize-none"
                 aria-label="Details about milestone billing, hours logged, or special client notes..."/>
              </div>

              {/* Footer Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={modalLoading}
                  className="px-4.5 h-10 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50 text-[11px] font-bold transition-all cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-4.5 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 border-none"
                >
                  {modalLoading && (
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  )}
                  <span>Create Invoice</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxUrl && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center z-[100] p-4 animate-fade-in" onClick={() => setLightboxUrl(null)}>
          <div className="relative max-w-4xl max-h-[85vh] overflow-hidden rounded-2xl bg-slate-900 border border-slate-800" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setLightboxUrl(null)}
              className="absolute right-4 top-4 p-1.5 rounded-full bg-slate-950/65 text-slate-200 hover:text-white border-none cursor-pointer hover:bg-slate-950 transition-colors shadow-md z-10"
              aria-label="Close enlarged preview"
            >
              <X size={18} />
            </button>
            <img src={lightboxUrl} alt="Enlarged payment proof" className="max-w-full max-h-[80vh] object-contain rounded-2xl p-2 select-none" />
          </div>
        </div>
      )}

      {/* Success Toast Notification */}
      {successToast && (
        <div className="fixed top-20 right-5 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-lg animate-fade-in transition-all">
          <CheckCircle size={14} className="shrink-0" />
          <span>{successToast}</span>
        </div>
      )}
    </div>
  );
}

export default AdminInvoices;
