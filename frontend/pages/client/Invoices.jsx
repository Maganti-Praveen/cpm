import { useToast } from '../../context/ToastContext';
// Billing dashboard listing balance due indicators and checkout routes.
// Directs clients to checkout portal.

import { useState, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Receipt,
  CreditCard,
  CheckCircle,
  Clock,
  X,
  Zap,
  Shield,
  Globe,
  Smartphone,
  Wallet,
  HandCoins,
  Building2,
  QrCode,
  Copy,
  CheckCircle2,
  Loader2,
  AlertCircle,
  FileText,
  Upload,
  Download,
  ZoomIn,
} from "lucide-react";
import { getInvoices, updateInvoice } from "../../services/invoiceService";
import { exportToExcel } from "../../utils/excelExport";

import { createTransaction } from "../../services/transactionService";
import API from "../../services/api";
import Pagination from "../../components/common/Pagination";

// gateway icon mapping
const GATEWAY_ICONS = {
  razorpay: Zap,
  payu: Shield,
  paypal: Globe,
  paytm: Smartphone,
  cashfree: Wallet,
  manual: HandCoins,
};

export default function ClientInvoices() {
  const { showToast } = useToast();
  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 15;

  const totalPages = Math.max(1, Math.ceil(invoices.length / ITEMS_PER_PAGE));
  const paginatedInvoices = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return invoices.slice(start, start + ITEMS_PER_PAGE);
  }, [invoices, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [invoices.length]);

  // Payment modal state
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [enabledGateways, setEnabledGateways] = useState([]);
  const [loadingGateways, setLoadingGateways] = useState(false);
  const [selectedGateway, setSelectedGateway] = useState(null);
  const [paymentStep, setPaymentStep] = useState("select"); // "select" | "details" | "redirecting" | "processing" | "success"
  const [copied, setCopied] = useState("");
  const [manualPaymentProof, setManualPaymentProof] = useState("");
  const [qrZoomUrl, setQrZoomUrl] = useState(null);

  // Manual payment upload fields
  const [manualRefNumber, setManualRefNumber] = useState("");
  const [manualNotes, setManualNotes] = useState("");
  const [manualFile, setManualFile] = useState(null);
  const [manualFilePreview, setManualFilePreview] = useState("");

  const [validationError, setValidationError] = useState("");

  // Fetch client invoices
  const fetchClientInvoices = () => {
    setLoading(true);
    getInvoices()
      .then((res) => {
        setInvoices(res.data.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading client invoices:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchClientInvoices();
  }, []);

  // Open payment modal
  const handlePayInvoice = async (invoice) => {
    setSelectedInvoice(invoice);
    setPayModalOpen(true);
    setSelectedGateway(null);
    setPaymentStep("select");
    setValidationError("");
    setManualPaymentProof("");
    setLoadingGateways(true);
    try {
      const res = await API.get("/payment-gateways/enabled");
      setEnabledGateways(res.data?.data || []);
    } catch {
      setEnabledGateways([]);
    } finally {
      setLoadingGateways(false);
    }
  };

  // Close modal
  const closePayModal = () => {
    setPayModalOpen(false);
    setSelectedInvoice(null);
    setSelectedGateway(null);
    setPaymentStep("select");
    setValidationError("");
    setManualPaymentProof("");
  };

  // Load Razorpay SDK script dynamically
  const loadRazorpaySDK = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Trigger Razorpay payment
  const handleRazorpayPayment = async (invoice) => {
    try {
      setValidationError("");
      setPaymentStep("processing");

      // Load SDK
      const isLoaded = await loadRazorpaySDK();
      if (!isLoaded) {
        setValidationError("Failed to load Razorpay SDK. Please check your internet connection.");
        setPaymentStep("select");
        return;
      }

      // Create Razorpay order on backend
      const res = await API.post("/payments/razorpay/create-order", {
        invoiceId: invoice.id,
      });

      if (!res.data?.success) {
        setValidationError(res.data?.message || "Failed to create Razorpay order.");
        setPaymentStep("select");
        return;
      }

      const { orderId, amount, keyId } = res.data;

      const options = {
        key: keyId,
        amount,
        currency: "INR",
        name: "Sai CRP",
        description: `Invoice ${invoice.invoiceNumber}`,
        order_id: orderId,
        handler: async function (response) {
          try {
            setPaymentStep("processing");
            const verifyRes = await API.post("/payments/razorpay/verify-signature", {
              invoiceId: invoice.id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (verifyRes.data?.success) {
              setPaymentStep("success");
              fetchClientInvoices();
            } else {
              setValidationError("Signature verification failed.");
              setPaymentStep("select");
            }
          } catch (verifyErr) {
            console.error("Signature verification error:", verifyErr);
            setValidationError(verifyErr.response?.data?.message || "Failed to verify signature.");
            setPaymentStep("select");
          }
        },
        prefill: {
          name: user?.fullName || "",
          email: user?.email || "",
        },
        theme: {
          color: "#4F46E5",
        },
        modal: {
          ondismiss: function () {
            setPaymentStep("select");
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error("Razorpay error:", err);
      setValidationError(err.response?.data?.message || "Failed to start Razorpay payment.");
      setPaymentStep("select");
    }
  };

  // Submit manual proof upload
  const handleSubmitManualProof = async () => {
    if (!manualRefNumber) {
      setValidationError("Transaction reference number is required.");
      return;
    }
    if (!manualFile) {
      setValidationError("Please select a screenshot proof file.");
      return;
    }

    setValidationError("");
    setPaymentStep("processing");

    try {
      const formData = new FormData();
      formData.append("invoiceId", selectedInvoice.id);
      formData.append("transactionId", manualRefNumber);
      formData.append("notes", manualNotes);
      formData.append("screenshot", manualFile);

      const res = await API.put("/payments/manual/pay-proof", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (res.data?.success) {
        setPaymentStep("success");
        fetchClientInvoices();
      } else {
        setValidationError(res.data?.message || "Failed to upload manual payment proof.");
        setPaymentStep("details");
      }
    } catch (err) {
      console.error("Manual upload error:", err);
      setValidationError(err.response?.data?.message || "Failed to submit manual payment proof.");
      setPaymentStep("details");
    }
  };

  // Select a gateway and proceed
  const handleSelectGateway = (gw) => {
    setSelectedGateway(gw);
    setValidationError("");
    if (gw.type === "manual") {
      setManualRefNumber("");
      setManualNotes("");
      setManualFile(null);
      setManualFilePreview("");
      setPaymentStep("details");
    } else if (gw.name === "razorpay") {
      handleRazorpayPayment(selectedInvoice);
    } else {
      // Branded simulation route for other gateways
      setPaymentStep("redirecting");
      setTimeout(() => {
        closePayModal();
        navigate(`/client/checkout/${gw.name}/${selectedInvoice.id}`);
      }, 2000);
    }
  };
  // Manual payment screenshot change
  const handleManualFileChange = (e) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      setManualFile(file);
      setManualFilePreview(URL.createObjectURL(file));
    }
  };

  // Format Card Expiry
  const handleExpiryChange = (e) => {
    const val = e.target.value.replace(/\D/g, "");
    let formatted = val;
    if (val.length > 2) {
      formatted = `${val.slice(0, 2)}/${val.slice(2, 4)}`;
    }
    if (formatted.length <= 5) {
      setCardExpiry(formatted);
    }
  };

  // Format Card CVV
  const handleCvvChange = (e) => {
    const val = e.target.value.replace(/\D/g, "");
    if (val.length <= 4) {
      setCardCvv(val);
    }
  };

  // Simple card type detector
  const getCardType = (num) => {
    const cleanNum = num.replace(/\s+/g, "");
    if (cleanNum.startsWith("4")) return "visa";
    if (/^5[1-5]/.test(cleanNum)) return "mastercard";
    if (/^6(0|521)/.test(cleanNum)) return "rupay";
    return "generic";
  };

  // Handle PayPal Login Simulation
  const handlePayPalLogin = (e) => {
    e.preventDefault();
    if (!payPayPalEmail || !payPayPalPassword) {
      setValidationError("Please fill in both email and password.");
      return;
    }
    if (!payPayPalEmail.includes("@")) {
      setValidationError("Please enter a valid email address.");
      return;
    }
    setValidationError("");
    setIsAuthenticating(true);
    setTimeout(() => {
      setIsAuthenticating(false);
      setPayPalStep("review");
    }, 1200);
  };

  // Complete Automatic Payment
  const completeAutomaticPayment = () => {
    setPaymentStep("processing");
    createTransaction({
      invoiceId: selectedInvoice.id,
      amount: selectedInvoice.amount,
      paymentType: "automatic",
      gatewayName: selectedGateway?.name || "automatic",
    })
      .then(() => {
        setPaymentStep("success");
        fetchClientInvoices();
      })
      .catch((err) => {
        setPaymentStep("checkout");
        setValidationError(err.response?.data?.message || "Transaction failed. Please try again.");
      });
  };

  // Submit Automatic Checkout (Razorpay, etc.)
  const handleCheckoutSubmit = (e) => {
    if (e) e.preventDefault();
    setValidationError("");

    if (selectedGateway?.name === "paypal") {
      completeAutomaticPayment();
      return;
    }

    if (checkoutTab === "card") {
      if (!cardNumber || !cardExpiry || !cardCvv || !cardHolder) {
        setValidationError("Please fill in all card details.");
        return;
      }
      const cleanCard = cardNumber.replace(/\s+/g, "");
      if (cleanCard.length < 16) {
        setValidationError("Card number must be 16 digits.");
        return;
      }
      if (cardExpiry.length < 5) {
        setValidationError("Expiry date must be MM/YY.");
        return;
      }
      if (cardCvv.length < 3) {
        setValidationError("CVV must be 3 or 4 digits.");
        return;
      }
    } else if (checkoutTab === "upi") {
      if (!upiVpa) {
        setValidationError("Please enter your UPI ID.");
        return;
      }
      if (!upiVpa.includes("@")) {
        setValidationError("Invalid UPI ID format (must contain @).");
        return;
      }
    } else if (checkoutTab === "netbanking") {
      if (!selectedBank) {
        setValidationError("Please select a bank to proceed.");
        return;
      }
    }

    completeAutomaticPayment();
  };

  // Confirm manual payment (mark as pending verification)
  const handleConfirmManualPayment = () => {
    if (!manualPaymentProof.trim()) {
      showToast("Please enter the Payment Reference / Transaction Note as proof of transfer.", "error");
      return;
    }
    setPaymentStep("processing");
    createTransaction({
      invoiceId: selectedInvoice.id,
      amount: selectedInvoice.amount,
      paymentType: "manual",
      gatewayName: "manual",
      paymentProof: manualPaymentProof,
    })
      .then(() => {
        setPaymentStep("success");
        fetchClientInvoices();
      })
      .catch((err) => {
        setPaymentStep("details");
        showToast(err.response?.data?.message || "Failed to record payment. Please try again.", "error");
      });
  };

  // Clear manual file upload
  const handleClearManualFile = () => {
    setManualFile(null);
    setManualFilePreview("");
  };

  // Copy to clipboard
  const handleCopy = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(""), 1500);
  };

  const handleExport = () => {
    try {
      if (invoices.length === 0) {
        showToast("No invoices to export.", "error");
        return;
      }
      const mapped = invoices.map(inv => ({
        "Invoice ID": inv.invoiceNumber,
        "Project": inv.project ? inv.project.name : "General Service",
        "Amount": `₹${inv.amount.toLocaleString("en-IN")}`,
        "Issue Date": new Date(inv.issueDate).toLocaleDateString(),
        "Due Date": new Date(inv.dueDate).toLocaleDateString(),
        "Status": inv.status
      }));
      exportToExcel(mapped, "Client_Invoices_Export");
    } catch (err) {
      console.error("Failed to export invoices:", err);
      showToast("Failed to export invoices data.", "error");
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Page Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-slate-900 text-lg">Billing & Invoices</h1>
          <p className="text-slate-500 text-sm mt-1">
            Track outstanding payments, billing summaries, and past paid receipts.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleExport}
            disabled={invoices.length === 0}
            title={invoices.length === 0 ? "No data to export" : "Export to Excel"}
            className="inline-flex items-center gap-1.5 px-4 h-9 rounded-lg border border-indigo-200 hover:border-indigo-400 text-[#4F46E5] bg-[#4F46E5]/5 hover:bg-[#4F46E5]/10 text-sm font-medium transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
           aria-label={invoices.length === 0 ? "No data to export" : "Export to Excel"}>
            <Download size={15} />
            Export Data
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <svg className="animate-spin h-7 w-7 text-indigo-600 mb-3" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Syncing Bills...</span>
          </div>
        ) : invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Receipt size={40} className="mb-3.5 text-slate-300" />
            <p className="text-sm font-semibold text-slate-600">No Invoices on File</p>
            <p className="text-xs text-slate-400 mt-1">You currently do not have any pending or past invoices.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold border-bottom border-slate-100">
                  <th className="p-4 pl-6">Invoice ID</th>
                  <th className="p-4">Assigned Project</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Issued</th>
                  <th className="p-4">Due Date</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right pr-6">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {paginatedInvoices.map((inv) => {
                  const isPaid = inv.status === "Paid";
                  const isCancelled = inv.status === "Cancelled";

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 pl-6 font-bold text-slate-900">{inv.invoiceNumber}</td>
                      <td className="p-4 text-slate-600">
                        {inv.project ? inv.project.name : (
                          <span className="italic text-slate-400 font-normal">General Service</span>
                        )}
                      </td>
                      <td className="p-4 font-bold text-slate-900">
                        ₹{inv.amount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                      </td>
                      <td className="p-4 text-slate-500">
                        {new Date(inv.issueDate).toLocaleDateString("en-US", {
                          month: "short", day: "2-digit", year: "numeric",
                        })}
                      </td>
                      <td className="p-4 text-slate-500">
                        {new Date(inv.dueDate).toLocaleDateString("en-US", {
                          month: "short", day: "2-digit", year: "numeric",
                        })}
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${
                          isPaid ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                            : isCancelled ? "bg-slate-100 text-slate-500 border-slate-200"
                            : "bg-amber-50 text-amber-700 border-amber-100"
                        }`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="p-4 text-right pr-6">
                        {isPaid ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-bold">
                            <CheckCircle size={14} />
                            Paid Receipt
                          </span>
                        ) : isCancelled ? (
                          <span className="inline-flex items-center gap-1 text-slate-400 text-xs font-semibold">
                            Cancelled
                          </span>
                        ) : (
                          <button
                            onClick={() => handlePayInvoice(inv)}
                            disabled={payingId !== null}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-bold rounded-xl cursor-pointer transition-colors border-none"
                          >
                            <CreditCard size={13} />
                            <span>Pay Now</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
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

      {/* payment gateway modal */}
      {payModalOpen && selectedInvoice && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`bg-white rounded-2xl shadow-2xl w-full max-h-[90vh] border border-slate-100 flex flex-col overflow-hidden transition-all duration-300 ${
            paymentStep === "details" && selectedGateway?.type === "manual" ? "max-w-4xl" : "max-w-lg"
          }`}>
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div>
                <h2 className="text-sm font-bold text-slate-900 font-display">
                  {paymentStep === "success" ? "Payment Successful" : "Pay Invoice"}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {selectedInvoice.invoiceNumber} — ₹{selectedInvoice.amount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                </p>
              </div>
              {paymentStep !== "processing" && (
                <button onClick={closePayModal} aria-label="Close pay modal" className="text-slate-400 hover:text-slate-600 cursor-pointer bg-transparent border-none p-1">
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Modal Body */}
            <div className="px-6 py-5 overflow-y-auto no-scrollbar flex-1">
              {/* Step: Loading gateways */}
              {loadingGateways && (
                <div className="flex flex-col items-center py-8">
                  <Loader2 className="w-6 h-6 text-indigo-500 animate-spin mb-2" />
                  <span className="text-xs text-slate-500">Loading payment methods...</span>
                </div>
              )}

              {/* Step: Select gateway */}
              {!loadingGateways && paymentStep === "select" && (
                <div>
                  {enabledGateways.length === 0 ? (
                    <div className="text-center py-8">
                      <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                      <p className="text-sm font-semibold text-slate-600">No Payment Methods Available</p>
                      <p className="text-xs text-slate-400 mt-1">Please contact the administrator to enable payment gateways.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Select Payment Method</p>
                      {enabledGateways.map((gw) => {
                        const Icon = GATEWAY_ICONS[gw.name] || CreditCard;
                        return (
                          <button
                            key={gw.id}
                            onClick={() => handleSelectGateway(gw)}
                            className="w-full flex items-center gap-4 p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all cursor-pointer bg-white text-left"
                          >
                            <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                              <Icon className="w-5 h-5 text-indigo-600" />
                            </div>
                            <div className="flex-1">
                              <span className="text-sm font-bold text-slate-900 block">{gw.label}</span>
                              <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                                {gw.type === "manual" ? "Bank Transfer / UPI" : "Online Payment"}
                              </span>
                            </div>
                            <svg className="w-4 h-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Step: Manual payment details */}
              {paymentStep === "details" && selectedGateway && selectedGateway.type === "manual" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column: Bank / UPI Details */}
                  <div className="space-y-4">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Transfer Payment Details</p>

                    {/* Bank Details */}
                    {(selectedGateway.config?.accountName || selectedGateway.config?.accountNumber) && (
                      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/60 space-y-2.5">
                        <div className="flex items-center gap-2 mb-2">
                          <Building2 className="w-4 h-4 text-slate-500" />
                          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Bank Transfer</span>
                        </div>
                        {selectedGateway.config.bankName && (
                          <DetailRow label="Bank Name" value={selectedGateway.config.bankName} onCopy={handleCopy} copied={copied} />
                        )}
                        {selectedGateway.config.accountName && (
                          <DetailRow label="Account Name" value={selectedGateway.config.accountName} onCopy={handleCopy} copied={copied} />
                        )}
                        {selectedGateway.config.accountNumber && (
                          <DetailRow label="Account Number" value={selectedGateway.config.accountNumber} onCopy={handleCopy} copied={copied} />
                        )}
                        {selectedGateway.config.ifsc && (
                          <DetailRow label="IFSC Code" value={selectedGateway.config.ifsc} onCopy={handleCopy} copied={copied} />
                        )}
                      </div>
                    )}

                    {/* UPI Details */}
                    {selectedGateway.config?.upiId && (
                      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/60">
                        <div className="flex items-center gap-2 mb-2">
                          <Smartphone className="w-4 h-4 text-slate-500" />
                          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">UPI Payment</span>
                        </div>
                        <div className="flex gap-4 items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <DetailRow label="UPI ID" value={selectedGateway.config.upiId} onCopy={handleCopy} copied={copied} />
                          </div>
                          {selectedGateway.config.qrCodeUrl && (
                            <div className="shrink-0 flex flex-col items-center">
                              <div 
                                onClick={() => setQrZoomUrl(selectedGateway.config.qrCodeUrl.startsWith("http") ? selectedGateway.config.qrCodeUrl : `${API_BASE}${selectedGateway.config.qrCodeUrl}`)}
                                className="relative group cursor-pointer border border-slate-200 hover:border-indigo-500 rounded-xl bg-white p-1 transition-all duration-200 hover:shadow-md hover:scale-105"
                                title="Click to enlarge QR Code"
                              >
                                <img
                                  src={selectedGateway.config.qrCodeUrl.startsWith("http") ? selectedGateway.config.qrCodeUrl : `${API_BASE}${selectedGateway.config.qrCodeUrl}`}
                                  alt="Payment QR Code"
                                  width="80"
                                  height="80"
                                  loading="lazy"
                                  className="w-20 h-20 object-contain rounded-lg"
                                />
                                <div className="absolute inset-0 bg-indigo-900/40 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-[10px] gap-1">
                                  <ZoomIn className="w-4 h-4" />
                                </div>
                              </div>
                              <span className="text-[9px] font-bold text-indigo-600 mt-1 cursor-pointer hover:underline flex items-center gap-0.5" onClick={() => setQrZoomUrl(selectedGateway.config.qrCodeUrl.startsWith("http") ? selectedGateway.config.qrCodeUrl : `${API_BASE}${selectedGateway.config.qrCodeUrl}`)}>
                                <ZoomIn className="w-2.5 h-2.5" /> Tap to enlarge
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Instructions */}
                    {selectedGateway.config?.instructions && (
                      <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-1.5">
                          <FileText className="w-3.5 h-3.5 text-amber-600" />
                          <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Instructions</span>
                        </div>
                        <p className="text-xs text-amber-800 leading-relaxed font-semibold">{selectedGateway.config.instructions}</p>
                      </div>
                    )}

                    {/* Amount reminder */}
                    <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 text-center">
                      <span className="text-xs text-indigo-600 font-semibold">Amount to Transfer</span>
                      <p className="text-xl font-bold text-indigo-900 mt-0.5">
                        ₹{selectedInvoice.amount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>

                  {/* Right Column: Submission Form */}
                  <div className="space-y-4 flex flex-col justify-between">
                    <div className="space-y-4">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Submit Payment Proof</p>

                      {/* Manual Inputs */}
                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Transaction ID / Reference Number *</label>
                          <input
                            type="text"
                            required
                            value={manualRefNumber}
                            onChange={(e) => setManualRefNumber(e.target.value)}
                            placeholder="Enter bank reference or UPI UTR"
                            className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all font-semibold text-slate-800 shadow-inner"
                           aria-label="Enter bank reference or UPI UTR"/>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Upload Screenshot Proof *</label>
                          {manualFilePreview ? (
                            <div className="flex items-center gap-3 bg-slate-50 p-2 border border-slate-200 rounded-xl">
                              <img src={manualFilePreview} alt="Proof preview" width="56" height="56" loading="lazy" className="w-14 h-14 object-cover rounded-lg border border-slate-300" />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-slate-800 truncate">{manualFile?.name}</p>
                                <p className="text-[11px] text-slate-400 font-semibold uppercase mt-0.5">{(manualFile?.size / 1024).toFixed(1)} KB</p>
                              </div>
                              <button
                                type="button"
                                onClick={handleClearManualFile}
                                className="text-xs font-bold text-rose-600 hover:text-rose-800 bg-slate-200 hover:bg-slate-300 px-3 py-1.5 rounded-lg border border-slate-300 transition-colors cursor-pointer shrink-0"
                              >
                                Clear
                              </button>
                            </div>
                          ) : (
                            <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-xl p-4 cursor-pointer hover:border-emerald-500 hover:bg-slate-50/50 transition-all">
                              <input type="file" accept="image/*" onChange={handleManualFileChange} className="hidden" />
                              <Upload className="w-6 h-6 text-slate-400 mb-1" />
                              <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Choose payment screenshot</span>
                              <span className="text-[9px] text-slate-400 mt-0.5">JPG, PNG up to 5MB</span>
                            </label>
                          )}
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Notes / Remarks (Optional)</label>
                          <textarea
                            value={manualNotes}
                            onChange={(e) => setManualNotes(e.target.value)}
                            placeholder="Add any additional payment details..."
                            rows={2}
                            className="w-full p-3.5 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all resize-none font-semibold text-slate-800"
                           aria-label="Add any additional payment details..."/>
                        </div>
                      </div>

                      {validationError && (
                        <div className="p-3 bg-rose-50 border border-rose-100 rounded-lg flex items-center gap-2 text-rose-700 text-xs font-medium">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>{validationError}</span>
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={() => { setPaymentStep("select"); setSelectedGateway(null); }}
                        className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer transition-colors bg-white font-display uppercase tracking-wider"
                      >
                        Back
                      </button>
                      <button
                        onClick={handleSubmitManualProof}
                        className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer transition-colors border-none font-display uppercase tracking-wider"
                      >
                        Submit Proof
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Step: Redirecting */}
              {paymentStep === "redirecting" && (
                <div className="flex flex-col items-center py-10 text-center">
                  <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4 border border-indigo-100">
                    <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                  </div>
                  <p className="text-sm font-bold text-slate-900 font-display">Redirecting to Secure Gateway</p>
                  <p className="text-xs text-slate-500 mt-1.5 max-w-xs leading-relaxed font-semibold">
                    Please wait while we redirect you to {selectedGateway?.label} secure checkout portal.
                  </p>
                </div>
              )}

              {/* Step: Processing */}
              {paymentStep === "processing" && (
                <div className="flex flex-col items-center py-10 text-center">
                  <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4 border border-indigo-100">
                    <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                  </div>
                  <p className="text-sm font-bold text-slate-900 font-display">Processing Payment</p>
                  <p className="text-xs text-slate-500 mt-1.5 max-w-xs leading-relaxed font-semibold">
                    Please do not refresh the page or close this window. We are finalizing your request...
                  </p>
                </div>
              )}

              {/* Step: Success */}
              {paymentStep === "success" && (
                <div className="flex flex-col items-center py-10 text-center">
                  <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4 border border-emerald-100">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600 stroke-[2.5]" />
                  </div>
                  <p className="text-sm font-bold text-slate-900 font-display">
                    {selectedGateway?.type === "manual" ? "Proof Uploaded Successfully" : "Payment Recorded"}
                  </p>
                  <p className="text-xs text-slate-500 mt-1.5 max-w-xs leading-relaxed font-semibold">
                    {selectedGateway?.type === "manual"
                      ? `Your payment proof for invoice ${selectedInvoice?.invoiceNumber} is pending review. You will be notified once the administrator approves it.`
                      : `Thank you! Invoice ${selectedInvoice?.invoiceNumber} has been successfully paid.`}
                  </p>
                  <button
                    onClick={closePayModal}
                    className="mt-6 px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl cursor-pointer transition-colors border-none font-display uppercase tracking-wider"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* QR Code Enlargement Popup Modal */}
      {qrZoomUrl && (
        <div 
          className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fade-in cursor-pointer"
          onClick={() => setQrZoomUrl(null)}
        >
          <div 
            className="bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full flex flex-col items-center relative border border-slate-100 cursor-default animate-scale-up text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm font-display">Payment QR Code</h3>
              </div>
              <button 
                onClick={() => setQrZoomUrl(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors border-none bg-transparent cursor-pointer font-bold"
                aria-label="Close QR popup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-white border-2 border-slate-100 rounded-2xl shadow-inner mb-4 flex items-center justify-center">
              <img 
                src={qrZoomUrl} 
                alt="Enlarged Payment QR Code" 
                className="w-64 h-64 object-contain rounded-xl"
              />
            </div>

            <p className="text-xs font-medium text-slate-500 mb-5 leading-relaxed">
              Scan this QR code using any UPI app (GPay, PhonePe, Paytm, BHIM) to make your transfer.
            </p>

            <div className="flex items-center gap-3 w-full">
              <a 
                href={qrZoomUrl} 
                download="payment_qr.png" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex-1 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl text-center transition-colors border border-indigo-100 no-underline"
              >
                Download QR
              </a>
              <button
                type="button"
                onClick={() => setQrZoomUrl(null)}
                className="flex-1 py-2.5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-colors border-none cursor-pointer"
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

// detail row helper for manual payment information
function DetailRow({ label, value, onCopy, copied }) {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between">
      <div>
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">{label}</span>
        <span className="text-sm font-semibold text-slate-800">{value}</span>
      </div>
      <button
        onClick={() => onCopy(value, label)}
        className="text-slate-400 hover:text-indigo-600 cursor-pointer bg-transparent border-none p-1.5 rounded-md hover:bg-white transition-colors"
        title="Copy"
       aria-label="Copy">
        {copied === label ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}
