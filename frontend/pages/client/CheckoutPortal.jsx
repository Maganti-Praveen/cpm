// Billing billing page mapping invoice totals to checkout systems.
// Renders Stripe and PayPal portals.


import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  Loader2,
  Lock,
  ArrowLeft,
  CheckCircle,
  Globe,
  Smartphone,
  CreditCard,
  Building2,
  Wallet,
  ShieldCheck,
  QrCode,
} from "lucide-react";
import API from "../../services/api";

export default function CheckoutPortal() {
  const { gateway, invoiceId } = useParams();
  const navigate = useNavigate();
  const { token } = useSelector((state) => state.auth);

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [step, setStep] = useState(1); // 1 = Login/Phone, 2 = Pay Details
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [upiId, setUpiId] = useState("");
  const [selectedBank, setSelectedBank] = useState("");
  const [payMethod, setPayMethod] = useState("card"); // "card", "upi", "netbanking", "wallet"

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        setLoading(true);
        const res = await API.get(`/invoices/${invoiceId}`);
        if (res.data?.success) {
          setInvoice(res.data.data);
        } else {
          setError("Invoice not found.");
        }
      } catch (err) {
        console.error("Error fetching invoice:", err);
        setError("Failed to fetch invoice details.");
      } finally {
        setLoading(false);
      }
    };
    fetchInvoice();
  }, [invoiceId]);

  const handlePay = async () => {
    try {
      setProcessing(true);
      setError("");

      // Simulate a small network delay
      await new Promise((r) => setTimeout(r, 2000));

      // Call API to mark paid securely on backend
      const res = await API.post(`/payments/simulate/complete`, {
        invoiceId: parseInt(invoiceId),
        gatewayName: gateway,
        transactionId: `tx_${gateway}_${Math.random().toString(36).substr(2, 9)}`
      });

      if (res.data?.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate("/client/invoices");
        }, 2000);
      } else {
        setError("Failed to record payment.");
        setProcessing(false);
      }
    } catch (err) {
      console.error("Payment error:", err);
      setError("Payment processing failed. Please try again.");
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="w-screen h-screen bg-slate-50 flex flex-col items-center justify-center font-sans">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-600">Connecting to secure gateway...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-screen h-screen bg-slate-50 flex flex-col items-center justify-center font-sans">
        <div className="max-w-md w-full p-8 bg-white border border-slate-200 rounded-2xl shadow-md text-center">
          <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-lg font-bold text-slate-900">Checkout Error</h1>
          <p className="text-sm text-slate-500 mt-2">{error}</p>
          <button
            onClick={() => navigate("/client/invoices")}
            className="mt-6 px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl text-xs uppercase tracking-wider hover:bg-indigo-700 cursor-pointer transition-colors"
          >
            Back to Invoices
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="w-screen h-screen bg-emerald-500 flex flex-col items-center justify-center font-sans text-white">
        <CheckCircle className="w-16 h-16 text-white mb-4 animate-bounce" />
        <h1 className="text-2xl font-bold">Payment Successful</h1>
        <p className="text-sm text-emerald-100 mt-2">Redirecting you back to client portal...</p>
      </div>
    );
  }

  if (processing) {
    return (
      <div className="w-screen h-screen bg-slate-900 flex flex-col items-center justify-center font-sans text-white px-4">
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
        <h1 className="text-lg font-bold">Authorizing Transaction...</h1>
        <p className="text-xs text-slate-400 mt-2 text-center max-w-xs">
          Please do not refresh the page or click back. We are communicating with your bank.
        </p>
      </div>
    );
  }

  // Gateway Brand Configuration
  const brands = {
    paypal: { name: "PayPal", color: "bg-[#003087]", text: "text-[#0079C1]" },
    paytm: { name: "Paytm", color: "bg-[#00baf2]", text: "text-[#00baf2]" },
    payu: { name: "PayU", color: "bg-[#80b918]", text: "text-[#80b918]" },
    cashfree: { name: "Cashfree", color: "bg-[#1f2937]", text: "text-slate-800" },
  };

  const currentBrand = brands[gateway] || { name: "Gateway", color: "bg-indigo-600", text: "text-indigo-600" };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans select-none antialiased">
      {/* Top Header */}
      <header className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 shadow-xs">
        <button
          onClick={() => navigate("/client/invoices")}
          className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-900 cursor-pointer transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Invoices
        </button>
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold">
          <ShieldCheck className="w-4 h-4 text-emerald-500" /> Secure SSL Connection
        </div>
      </header>

      {/* Main Grid */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden flex flex-col md:flex-row">
          {/* Left panel - Branded Summary */}
          <div className={`${currentBrand.color} text-white p-8 md:w-5/12 flex flex-col justify-between shrink-0`}>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider opacity-60">Checkout Gateway</span>
              <h1 className="text-xl font-bold mt-1 font-display">{currentBrand.name} Checkout</h1>
            </div>

            <div className="my-8 space-y-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider opacity-60">Payee</span>
                <p className="text-sm font-semibold mt-0.5">Sai CRP Portal</p>
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider opacity-60">Invoice ID</span>
                <p className="text-sm font-semibold mt-0.5 font-mono">{invoice?.invoiceNumber}</p>
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider opacity-60">Description</span>
                <p className="text-xs mt-0.5 opacity-80 line-clamp-2">{invoice?.description || "General Services"}</p>
              </div>
            </div>

            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider opacity-60">Total Payable</span>
              <p className="text-2xl font-black mt-0.5">
                ₹{invoice?.amount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          {/* Right panel - Checkout Form */}
          <div className="p-8 md:w-7/12 flex flex-col justify-between">
            {/* PayPal Gateway View */}
            {gateway === "paypal" && (
              <div className="space-y-6">
                {step === 1 ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      setStep(2);
                    }}
                    className="space-y-4"
                  >
                    <div className="text-center">
                      <span className="text-blue-900 font-display font-extrabold italic text-2xl">
                        Pay<span className="text-blue-500">Pal</span>
                      </span>
                      <p className="text-xs text-slate-500 mt-1">Log in to your PayPal account to continue</p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Email Address</label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="client@paypal.com"
                        className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                       aria-label="client@paypal.com"/>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Password</label>
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                       aria-label="••••••••"/>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider cursor-pointer border-none"
                    >
                      Log In
                    </button>
                  </form>
                ) : (
                  <div className="space-y-5">
                    <div className="text-center">
                      <span className="text-blue-900 font-display font-extrabold italic text-xl">
                        Pay<span className="text-blue-500">Pal</span>
                      </span>
                    </div>

                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400 font-semibold">Account</span>
                        <span className="font-bold text-slate-700">{email}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs border-t border-slate-200/80 pt-2.5">
                        <span className="text-slate-400 font-semibold">Payment Method</span>
                        <span className="font-bold text-slate-700">PayPal Balance / Visa (•••• 9876)</span>
                      </div>
                      <div className="flex justify-between items-center text-xs border-t border-slate-200/80 pt-2.5">
                        <span className="text-slate-400 font-semibold">Exchange Rate</span>
                        <span className="font-bold text-slate-700">1 INR = 0.012 USD</span>
                      </div>
                      <div className="flex justify-between items-center text-sm font-bold border-t border-slate-200/80 pt-2.5 text-slate-900">
                        <span>Total amount</span>
                        <span>
                          ${(invoice?.amount * 0.012).toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}{" "}
                          USD
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => setStep(1)}
                        className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer bg-white"
                      >
                        Back
                      </button>
                      <button
                        onClick={handlePay}
                        className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold uppercase tracking-wider cursor-pointer border-none"
                      >
                        Authorize & Pay
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Paytm Gateway View */}
            {gateway === "paytm" && (
              <div className="space-y-6">
                {step === 1 ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      setStep(2);
                    }}
                    className="space-y-4"
                  >
                    <div className="text-center font-bold text-[#00baf2] text-xl flex items-center justify-center gap-1">
                      <span>paytm</span>
                      <span className="text-slate-400 text-xs font-medium uppercase tracking-wider border-l border-slate-300 pl-2">Secure Checkout</span>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Mobile Number (Linked to Paytm)</label>
                      <input
                        type="text"
                        required
                        pattern="\d{10}"
                        value={email}
                        onChange={(e) => setEmail(e.target.value.replace(/\D/g, "").slice(0, 10))}
                        placeholder="Enter 10 digit number"
                        className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#00baf2] focus:bg-white transition-all font-mono"
                       aria-label="Enter 10 digit number"/>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl bg-[#00baf2] hover:bg-[#009ed1] text-white text-xs font-bold uppercase tracking-wider cursor-pointer border-none"
                    >
                      Proceed to Pay
                    </button>
                  </form>
                ) : (
                  <div className="space-y-5">
                    <div className="flex border-b border-slate-100 pb-2 gap-4">
                      {["card", "upi"].map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setPayMethod(tab)}
                          className={`py-1 pb-2 text-xs font-bold tracking-wider cursor-pointer uppercase transition-colors bg-transparent border-none ${
                            payMethod === tab ? "border-b-2 border-[#00baf2] text-[#00baf2]" : "text-slate-400"
                          }`}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>

                    {payMethod === "card" ? (
                      <div className="space-y-3.5">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Card Number</label>
                          <input
                            type="text"
                            placeholder="4111 2222 3333 4444"
                            value={cardNumber}
                            onChange={(e) => setCardNumber(e.target.value)}
                            className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#00baf2] focus:bg-white transition-all font-mono"
                           aria-label="4111 2222 3333 4444"/>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Expiry</label>
                            <input
                              type="text"
                              placeholder="MM/YY"
                              value={cardExpiry}
                              onChange={(e) => setCardExpiry(e.target.value)}
                              className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#00baf2] focus:bg-white transition-all font-mono"
                             aria-label="MM/YY"/>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">CVV</label>
                            <input
                              type="password"
                              placeholder="•••"
                              value={cardCvv}
                              onChange={(e) => setCardCvv(e.target.value)}
                              className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#00baf2] focus:bg-white transition-all font-mono"
                             aria-label="•••"/>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">UPI ID</label>
                          <input
                            type="text"
                            placeholder="mobile@paytm"
                            value={upiId}
                            onChange={(e) => setUpiId(e.target.value)}
                            className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#00baf2] focus:bg-white transition-all"
                           aria-label="mobile@paytm"/>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-3">
                      <button
                        onClick={() => setStep(1)}
                        className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer bg-white"
                      >
                        Back
                      </button>
                      <button
                        onClick={handlePay}
                        className="flex-1 py-2.5 rounded-xl bg-[#00baf2] hover:bg-[#009ed1] text-white text-xs font-bold uppercase tracking-wider cursor-pointer border-none"
                      >
                        Pay Now
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* PayU / Cashfree Checkout View */}
            {(gateway === "payu" || gateway === "cashfree") && (
              <div className="space-y-5">
                <div className="text-center font-bold text-slate-800 text-sm uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center justify-between">
                  <span>Checkout</span>
                  <span className="text-[11px] text-slate-400">Merchant Code: CRP_DEMO</span>
                </div>

                <div className="flex border-b border-slate-100 pb-2 gap-4">
                  {["card", "upi", "netbanking"].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setPayMethod(tab)}
                      className={`py-1 pb-2 text-xs font-bold tracking-wider cursor-pointer uppercase transition-colors bg-transparent border-none ${
                        payMethod === tab ? "border-b-2 border-indigo-600 text-indigo-600" : "text-slate-400"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {payMethod === "card" && (
                  <div className="space-y-3.5">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Card Number</label>
                      <input
                        type="text"
                        placeholder="4111 2222 3333 4444"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-mono"
                       aria-label="4111 2222 3333 4444"/>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Expiry</label>
                        <input
                          type="text"
                          placeholder="MM/YY"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-mono"
                         aria-label="MM/YY"/>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">CVV</label>
                        <input
                          type="password"
                          placeholder="•••"
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value)}
                          className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-mono"
                         aria-label="•••"/>
                      </div>
                    </div>
                  </div>
                )}

                {payMethod === "upi" && (
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">UPI ID</label>
                      <input
                        type="text"
                        placeholder="user@upi"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                       aria-label="user@upi"/>
                    </div>
                  </div>
                )}

                {payMethod === "netbanking" && (
                  <div className="space-y-3">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Select Bank</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {["HDFC Bank", "ICICI Bank", "State Bank of India", "Axis Bank"].map((bank) => (
                        <button
                          key={bank}
                          onClick={() => setSelectedBank(bank)}
                          className={`p-2.5 rounded-lg border text-xs font-semibold text-left transition-all cursor-pointer ${
                            selectedBank === bank
                              ? "border-indigo-600 bg-indigo-50/50 text-indigo-700 font-bold"
                              : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                          }`}
                        >
                          {bank}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={handlePay}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-wider cursor-pointer border-none"
                >
                  Pay ₹{invoice?.amount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                </button>
              </div>
            )}

            <div className="text-[9px] text-slate-400 text-center font-semibold mt-4">
              By proceeding, you agree to the Terms of Service & Privacy Policy.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
