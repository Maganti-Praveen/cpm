import { useToast } from '../../context/ToastContext';
// Calendar interface displaying client appointment schedules and meeting lists.
// Highlights target dates.

import { useState, useEffect, useCallback, useMemo } from "react";
import { Search, Eye, X, Receipt, Download } from "lucide-react";
import { getTransactions } from "../../services/transactionService";


export default function BookingHistory() {
  const { showToast } = useToast();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [localSearch, setLocalSearch] = useState("");
  const [selectedTx, setSelectedTx] = useState(null);

  // Debounce search input to avoid expensive filter recalculations on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(localSearch);
    }, 150);
    return () => clearTimeout(timer);
  }, [localSearch]);

  // Pulls invoices listings and details matched to client profiles
  const fetchClientTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getTransactions();
      setTransactions(res.data?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClientTransactions();
  }, [fetchClientTransactions]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const invoiceNumber = tx.invoice?.invoiceNumber || "";
      const transactionId = tx.transactionId || "";
      const proofText = tx.paymentProof || "";
      const gateway = tx.gatewayName || "";
      const amountStr = tx.amount?.toString() || "";

      return (
        invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        transactionId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        proofText.toLowerCase().includes(searchQuery.toLowerCase()) ||
        gateway.toLowerCase().includes(searchQuery.toLowerCase()) ||
        amountStr.includes(searchQuery)
      );
    });
  }, [transactions, searchQuery]);

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Success":
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full border bg-emerald-50 text-emerald-700 border-emerald-100">
            Success
          </span>
        );
      case "Pending":
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full border bg-amber-50 text-amber-700 border-amber-100 animate-pulse">
            Pending Review
          </span>
        );
      case "Rejected":
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full border bg-rose-50 text-rose-700 border-rose-100">
            Rejected
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full border bg-slate-50 text-slate-700 border-slate-100">
            {status}
          </span>
        );
    }
  };

  const handleExport = useCallback(async () => {
    try {
      if (filteredTransactions.length === 0) {
        showToast("No bookings to export.", "error");
        return;
      }
      const { exportToExcel } = await import("../../utils/excelExport");
      const mapped = filteredTransactions.map(tx => ({
        "Transaction ID": tx.transactionId,
        "Invoice ID": tx.invoice?.invoiceNumber || "N/A",
        "Amount": `₹${tx.amount.toLocaleString("en-IN")}`,
        "Payment Type": tx.paymentType === "manual" ? "Manual Transfer" : `Automatic (${tx.gatewayName})`,
        "Status": tx.status,
        "Date Submitted": formatDate(tx.createdAt)
      }));
      exportToExcel(mapped, "Client_PaymentHistory_Export");
    } catch (err) {
      console.error("Failed to export payment history:", err);
      showToast("Failed to export payment history data.", "error");
    }
  }, [filteredTransactions, showToast]);

  return (
    <div className="space-y-6 font-sans text-left">
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-slate-900 text-lg">Payment History</h1>
          <p className="text-slate-500 text-sm mt-1">
            Review all payments submitted manually or processed automatically through credit cards and digital wallets.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleExport}
            disabled={filteredTransactions.length === 0}
            title={filteredTransactions.length === 0 ? "No data to export" : "Export to Excel"}
            className="inline-flex items-center gap-1.5 px-4 h-9 rounded-lg border border-indigo-200 hover:border-indigo-400 text-[#4F46E5] bg-[#4F46E5]/5 hover:bg-[#4F46E5]/10 text-sm font-medium transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
           aria-label={filteredTransactions.length === 0 ? "No data to export" : "Export to Excel"}>
            <Download size={15} />
            Export Data
          </button>
        </div>
      </div>

      <div className="relative w-full max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
        <input
          type="text"
          placeholder="Search by transaction ID, invoice, details..."
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          className="w-full h-10 pl-9 pr-4 rounded-lg border border-[#CBD5E1] bg-white text-sm text-[#0F172A] placeholder-[#94A3B8] outline-none focus:border-[#4F46E5] focus:ring-[3px] focus:ring-[#4F46E5]/12 transition-all"
         aria-label="Search by transaction ID, invoice, details..."/>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto overflow-y-hidden">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                <th className="p-4 text-xs uppercase tracking-wider text-slate-400">Transaction ID / Date</th>
                <th className="p-4 text-xs uppercase tracking-wider text-slate-400">Invoice ID</th>
                <th className="p-4 text-xs uppercase tracking-wider text-slate-400">Amount</th>
                <th className="p-4 text-xs uppercase tracking-wider text-slate-400">Payment Type</th>
                <th className="p-4 text-xs uppercase tracking-wider text-slate-400">Status</th>
                <th className="p-4 text-right text-xs uppercase tracking-wider text-slate-400">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                [1, 2, 3].map((i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="p-4">
                      <div className="h-4 bg-slate-100 rounded-md w-28" />
                      <div className="h-3 bg-slate-100 rounded-md w-20 mt-1.5" />
                    </td>
                    <td className="p-4">
                      <div className="h-4 bg-slate-100 rounded-md w-16" />
                    </td>
                    <td className="p-4">
                      <div className="h-4 bg-slate-100 rounded-md w-20" />
                    </td>
                    <td className="p-4">
                      <div className="h-4 bg-slate-100 rounded-md w-24" />
                    </td>
                    <td className="p-4">
                      <div className="h-6 bg-slate-100 rounded-full w-20" />
                    </td>
                    <td className="p-4 text-right">
                      <div className="h-7 bg-slate-100 rounded-lg w-8 ml-auto" />
                    </td>
                  </tr>
                ))
              ) : filteredTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4">
                    <p className="font-bold text-slate-900">{tx.transactionId}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{formatDate(tx.createdAt)}</p>
                  </td>
                  <td className="p-4">
                    <span className="font-bold text-slate-800">{tx.invoice?.invoiceNumber}</span>
                  </td>
                  <td className="p-4 font-bold text-slate-900">
                    ₹{tx.amount.toLocaleString("en-IN")}
                  </td>
                  <td className="p-4 text-slate-600 font-medium capitalize">
                    {tx.paymentType === "manual" ? "Manual Transfer" : `Automatic (${tx.gatewayName})`}
                  </td>
                  <td className="p-4">{getStatusBadge(tx.status)}</td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => setSelectedTx(tx)}
                      aria-label="View transaction details"
                      className="p-1.5 rounded-lg hover:bg-slate-150 text-slate-500 hover:text-slate-800 cursor-pointer transition-colors border-none bg-transparent"
                    >
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan="6" className="p-12 text-center text-xs text-slate-450 italic">
                    No transactions recorded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedTx && (
        <div className="fixed inset-0 bg-[#0f172a]/45 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in font-sans">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md max-h-[90vh] overflow-y-auto animate-scale-up p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 font-display flex items-center gap-2">
                <Receipt size={18} className="text-indigo-600" />
                Transaction Details
              </h2>
              <button
                onClick={() => setSelectedTx(null)}
                aria-label="Close transaction details modal"
                className="p-1 rounded-md text-slate-400 hover:text-slate-655 hover:bg-slate-50 transition-colors cursor-pointer bg-transparent border-none"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3.5 text-left max-h-[55vh] overflow-y-auto pr-1">
              <div>
                <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Transaction ID</span>
                <span className="text-sm font-semibold text-slate-800">{selectedTx.transactionId}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Invoice ID</span>
                  <span className="text-xs font-bold text-slate-900">{selectedTx.invoice?.invoiceNumber}</span>
                </div>
                <div>
                  <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Payment Method</span>
                  <span className="text-xs font-semibold text-slate-800 capitalize">
                    {selectedTx.paymentType === "manual" ? "Bank Transfer" : `Online (${selectedTx.gatewayName})`}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Amount Paid</span>
                  <span className="text-sm font-bold text-slate-950">₹{selectedTx.amount.toLocaleString("en-IN")}</span>
                </div>
                <div>
                  <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Date Submitted</span>
                  <span className="text-xs font-medium text-slate-800">{formatDate(selectedTx.createdAt)}</span>
                </div>
              </div>

              <div>
                <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Status</span>
                <div className="mt-1">{getStatusBadge(selectedTx.status)}</div>
              </div>

              {selectedTx.paymentProof && (
                <div className="space-y-1.5">
                  <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Reference Proof Image</span>
                  <div className="mt-1">
                    <a href={selectedTx.paymentProof} target="_blank" rel="noopener noreferrer">
                      <img 
                        src={selectedTx.paymentProof} 
                        alt="Payment Proof" 
                        width="300"
                        height="192"
                        loading="lazy"
                        className="w-full max-h-48 object-contain rounded-xl border border-slate-200 hover:opacity-90 transition-opacity"
                      />
                    </a>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100 mt-6">
              <button
                onClick={() => setSelectedTx(null)}
                className="px-4.5 h-9 rounded-lg border border-slate-300 text-slate-650 hover:bg-slate-50 text-xs font-semibold transition-colors cursor-pointer bg-white"
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
