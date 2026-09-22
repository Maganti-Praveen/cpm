// Interfaces for configuring gateway integrations like Stripe and PayPal.
// Syncs keys with checkout forms.


import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import API from "../../services/api";
import {
  CreditCard,
  Shield,
  ToggleLeft,
  ToggleRight,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Wallet,
  Building2,
  Globe,
  Smartphone,
  QrCode,
  FileText,
  X,
  Zap,
  HandCoins,
  ZoomIn,
} from "lucide-react";

// gateway icon map
const GATEWAY_ICONS = {
  razorpay: Zap,
  payu: Shield,
  paypal: Globe,
  paytm: Smartphone,
  cashfree: Wallet,
  manual: HandCoins,
};

// user-friendly field labels
const FIELD_LABELS = {
  keyId: "Key ID",
  secret: "Secret Key",
  merchantKey: "Merchant Key",
  merchantSalt: "Merchant Salt",
  clientId: "Client ID",
  merchantId: "Merchant ID",
  website: "Website",
  appId: "App ID",
  accountName: "Account Name",
  accountNumber: "Account Number",
  ifsc: "IFSC Code",
  bankName: "Bank Name",
  upiId: "UPI ID",
  qrCodeUrl: "QR Code",
  instructions: "Payment Instructions",
};

const getFieldLabel = (key) =>
  FIELD_LABELS[key] || key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());

const getFieldType = (key) => {
  if (key.toLowerCase().includes("secret") || key.toLowerCase().includes("salt")) return "password";
  return "text";
};

/**
 * PaymentGateways Component
 *
 * Interfaces for configuring gateway integrations like Stripe, PayPal, Paytm, Razorpay, etc.
 * Supports updating dynamic credentials, toggling gateway modes (test/sandbox vs live),
 * and configuring manual banking/UPI credentials along with QR code uploading and previewing.
 * Includes a manual payment QR zoom modal overlay to inspect QR details.
 *
 * @component
 */
export default function PaymentGateways() {
  const { token } = useSelector((state) => state.auth);
  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

  // tab state
  const [activeTab, setActiveTab] = useState("automatic");

  // data state
  const [gateways, setGateways] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [successId, setSuccessId] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  // Per-gateway local edits: { [id]: { enabled, mode, config: {...} } }
  const [edits, setEdits] = useState({});

  // QR Code file upload state
  const [qrFile, setQrFile] = useState(null);
  const [qrPreview, setQrPreview] = useState("");
  const [zoomQrUrl, setZoomQrUrl] = useState(null);

  // fetch gateways from server
  useEffect(() => {
    fetchGateways();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchGateways = async () => {
    try {
      setLoading(true);
      const res = await API.get("/payment-gateways");
      const data = res.data?.data || [];
      setGateways(data);

      const editMap = {};
      data.forEach((gw) => {
        editMap[gw.id] = {
          enabled: gw.enabled,
          mode: gw.mode,
          config: { ...(typeof gw.config === "object" ? gw.config : {}) },
        };
      });
      setEdits(editMap);

      const manual = data.find((gw) => gw.name === "manual");
      if (manual?.config?.qrCodeUrl) {
        const url = manual.config.qrCodeUrl;
        setQrPreview(url.startsWith("http") ? url : `${API_BASE}${url}`);
      }
    } catch {
      setErrorMsg("Failed to load payment gateways.");
    } finally {
      setLoading(false);
    }
  };

  // edit handlers
  const updateEdit = (id, field, value) => {
    setEdits((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));
  };

  const updateConfigField = (id, key, value) => {
    setEdits((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        config: { ...prev[id].config, [key]: value },
      },
    }));
  };

  const handleQrChange = (e) => {
    if (e.target.files?.[0]) {
      setQrFile(e.target.files[0]);
      setQrPreview(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleClearQr = (gatewayId) => {
    setQrFile(null);
    setQrPreview("");
    updateConfigField(gatewayId, "qrCodeUrl", "");
  };

  const handleSave = async (gateway) => {
    const edit = edits[gateway.id];
    if (!edit) return;

    // Validate API credentials when gateway is enabled
    if (edit.enabled && gateway.name !== "manual") {
      const config = edit.config || {};
      const emptyCred = Object.entries(config).find(
        ([k, v]) => (!v || String(v).trim() === "") && (k.toLowerCase().includes("key") || k.toLowerCase().includes("secret") || k.toLowerCase().includes("id") || k.toLowerCase().includes("salt"))
      );
      if (emptyCred) {
        setErrorMsg(`API credential "${emptyCred[0]}" is required to enable ${gateway.title || gateway.name}.`);
        return;
      }
    }

    setSavingId(gateway.id);
    setErrorMsg("");
    setSuccessId(null);

    try {
      let res;

      if (gateway.name === "manual" && qrFile) {
        const formData = new FormData();
        formData.append("enabled", edit.enabled);
        formData.append("mode", edit.mode);
        formData.append("config", JSON.stringify(edit.config));
        formData.append("qrCode", qrFile);

        res = await API.put(`/payment-gateways/${gateway.id}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        res = await API.put(`/payment-gateways/${gateway.id}`, {
          enabled: edit.enabled,
          mode: edit.mode,
          config: edit.config,
        });
      }

      const updated = res.data?.data;
      if (!res.data?.success || !updated) {
        throw new Error(res.data?.message || "Failed to save");
      }

      setGateways((prev) => prev.map((gw) => (gw.id === updated.id ? updated : gw)));
      setEdits((prev) => ({
        ...prev,
        [updated.id]: {
          enabled: updated.enabled,
          mode: updated.mode,
          config: { ...(typeof updated.config === "object" ? updated.config : {}) },
        },
      }));

      if (updated.name === "manual" && updated.config?.qrCodeUrl) {
        const url = updated.config.qrCodeUrl;
        setQrPreview(url.startsWith("http") ? url : `${API_BASE}${url}`);
      }
      setQrFile(null);

      setSuccessId(gateway.id);
      setTimeout(() => setSuccessId(null), 2500);
    } catch (err) {
      setErrorMsg(`Failed to save ${gateway.label}: ${err.response?.data?.message || err.message}`);
    } finally {
      setSavingId(null);
    }
  };

  // split gateways by type
  const automaticGateways = gateways.filter((gw) => gw.type === "automatic");
  const manualGateways = gateways.filter((gw) => gw.type === "manual");

  if (loading) {
    return (
      <div className="w-full bg-[#F8FAFC] min-h-[85vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-[#4F46E5] animate-spin" />
          <span className="text-sm text-[#475569] font-medium">Loading payment gateways...</span>
        </div>
      </div>
    );
  }

  // page layout render
  return (
    <div className="w-full bg-[#F8FAFC] min-h-[85vh] font-sans antialiased text-[#0F172A]">
      {/* Page Header */}
      <div className="mb-8 flex flex-col items-start text-left">
        <h1 className="text-[1.75rem] font-bold text-[#0F172A] font-display flex items-center gap-3">
          <CreditCard className="w-7 h-7 text-[#4F46E5]" />
          Payment Gateway Settings
        </h1>
        <p className="text-sm text-[#475569] font-normal mt-1">
          Configure payment gateways for invoice payments. Enable, disable, and manage credentials dynamically.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200 mb-8 gap-6">
        <button
          id="tab-btn-automatic"
          onClick={() => { setActiveTab("automatic"); setErrorMsg(""); }}
          className={`pb-3 text-sm font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer flex items-center gap-2 ${
            activeTab === "automatic"
              ? "border-b-2 border-[#4F46E5] text-[#4F46E5]"
              : "text-[#475569] hover:text-[#0F172A] border-b-2 border-transparent"
          }`}
        >
          <Zap className="w-4 h-4" />
          Automatic Gateways
        </button>
        <button
          id="tab-btn-manual"
          onClick={() => { setActiveTab("manual"); setErrorMsg(""); }}
          className={`pb-3 text-sm font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer flex items-center gap-2 ${
            activeTab === "manual"
              ? "border-b-2 border-[#4F46E5] text-[#4F46E5]"
              : "text-[#475569] hover:text-[#0F172A] border-b-2 border-transparent"
          }`}
        >
          <HandCoins className="w-4 h-4" />
          Manual Payment
        </button>
      </div>

      {/* Global Error */}
      {errorMsg && (
        <div className="mb-6 bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg("")} className="ml-auto text-rose-400 hover:text-rose-600 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ─── Tab: Automatic Gateways ─────────────────────────────────────────── */}
      {activeTab === "automatic" && (
        <div>
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center border border-indigo-100">
              <Zap className="w-4 h-4 text-[#4F46E5]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#0F172A] font-display">Online Payment Processors</h2>
              <p className="text-xs text-[#64748B]">Razorpay, PayU, PayPal, Paytm, Cashfree</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
            {automaticGateways.map((gw) => (
              <GatewayCard
                key={gw.id}
                gateway={gw}
                edit={edits[gw.id]}
                savingId={savingId}
                successId={successId}
                onToggle={(val) => updateEdit(gw.id, "enabled", val)}
                onModeChange={(val) => updateEdit(gw.id, "mode", val)}
                onConfigChange={(key, val) => updateConfigField(gw.id, key, val)}
                onSave={() => handleSave(gw)}
              />
            ))}
          </div>
        </div>
      )}

      {/* ─── Tab: Manual Payment ─────────────────────────────────────────────── */}
      {activeTab === "manual" && (
        <div>
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center border border-emerald-100">
              <HandCoins className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#0F172A] font-display">Bank Transfer / UPI / Manual Approval</h2>
              <p className="text-xs text-[#64748B]">Configure offline payment acceptance details</p>
            </div>
          </div>

          {manualGateways.map((gw) => (
            <ManualGatewayCard
              key={gw.id}
              gateway={gw}
              edit={edits[gw.id]}
              savingId={savingId}
              successId={successId}
              qrPreview={qrPreview}
              onToggle={(val) => updateEdit(gw.id, "enabled", val)}
              onConfigChange={(key, val) => updateConfigField(gw.id, key, val)}
              onQrChange={handleQrChange}
              onClearQr={() => handleClearQr(gw.id)}
              onSave={() => handleSave(gw)}
              setZoomQrUrl={setZoomQrUrl}
            />
          ))}
        </div>
      )}

      {/* Admin QR Code Enlargement Popup Modal */}
      {zoomQrUrl && (
        <div 
          className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fade-in cursor-pointer"
          onClick={() => setZoomQrUrl(null)}
        >
          <div 
            className="bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full flex flex-col items-center relative border border-slate-100 cursor-default animate-scale-up text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-sm font-display">Manual Payment QR Preview</h3>
              </div>
              <button 
                onClick={() => setZoomQrUrl(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors border-none bg-transparent cursor-pointer font-bold"
                aria-label="Close QR popup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-white border-2 border-slate-100 rounded-2xl shadow-inner mb-4 flex items-center justify-center">
              <img 
                src={zoomQrUrl} 
                alt="Enlarged Manual Payment QR Code" 
                className="w-64 h-64 object-contain rounded-xl"
              />
            </div>

            <p className="text-xs font-medium text-slate-500 mb-5 leading-relaxed">
              Preview of the QR code image configured for manual client payments.
            </p>

            <button
              type="button"
              onClick={() => setZoomQrUrl(null)}
              className="w-full py-2.5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-colors border-none cursor-pointer"
            >
              Close Preview
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// automatic gateway component card
function GatewayCard({ gateway, edit, savingId, successId, onToggle, onModeChange, onConfigChange, onSave }) {
  if (!edit) return null;

  const Icon = GATEWAY_ICONS[gateway.name] || CreditCard;
  const isSaving = savingId === gateway.id;
  const isSuccess = successId === gateway.id;

  const configKeys = Object.keys(edit.config).filter((k) => !["qrCodeUrl"].includes(k));

  return (
    <div className={`bg-white rounded-xl border transition-all duration-300 shadow-sm hover:shadow-md ${
      edit.enabled ? "border-indigo-200 ring-1 ring-indigo-50" : "border-slate-200"
    }`}>
      {/* Card Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors duration-300 ${
            edit.enabled ? "bg-indigo-50 border border-indigo-200" : "bg-slate-50 border border-slate-200"
          }`}>
            <Icon className={`w-5 h-5 transition-colors duration-300 ${edit.enabled ? "text-[#4F46E5]" : "text-slate-400"}`} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#0F172A] font-display">{gateway.label}</h3>
            <span className={`text-[11px] font-bold uppercase tracking-wider ${edit.enabled ? "text-emerald-500" : "text-slate-400"}`}>
              {edit.enabled ? "Enabled" : "Disabled"}
            </span>
          </div>
        </div>
        <button onClick={() => onToggle(!edit.enabled)} className="cursor-pointer bg-transparent border-none p-0" title={edit.enabled ? "Disable" : "Enable"} aria-label={edit.enabled ? "Disable" : "Enable"}>
          {edit.enabled ? (
            <ToggleRight className="w-9 h-9 text-[#4F46E5] transition-transform duration-200 hover:scale-110" />
          ) : (
            <ToggleLeft className="w-9 h-9 text-slate-300 transition-transform duration-200 hover:scale-110" />
          )}
        </button>
      </div>

      {/* Config Fields */}
      <div className="px-5 py-4 space-y-4">
        {configKeys.map((key) => (
          <div key={key} className="space-y-1.5">
            <label className="text-[0.7rem] font-bold text-[#475569] uppercase tracking-wider block">{getFieldLabel(key)}</label>
            <input
              type={getFieldType(key)}
              value={edit.config[key] || ""}
              onChange={(e) => onConfigChange(key, e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:bg-white transition-all font-mono text-xs"
              placeholder={`Enter ${getFieldLabel(key).toLowerCase()}`}
             aria-label="W-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#4 F46 E5] focus:bg-white transition-all font-mono text-xs"/>
          </div>
        ))}

        {/* Mode Selector */}
        <div className="space-y-1.5">
          <label className="text-[0.7rem] font-bold text-[#475569] uppercase tracking-wider block">Environment Mode</label>
          <div className="flex gap-4">
            {["test", "live"].map((m) => (
              <label key={m} className="flex items-center gap-2 cursor-pointer select-none">
                <input type="radio" name={`mode-${gateway.id}`} checked={edit.mode === m} onChange={() => onModeChange(m)} className="w-4 h-4 accent-[#4F46E5]"  aria-label="W-4 h-4 accent-[#4 F46 E5]"/>
                <span className={`text-xs font-semibold uppercase tracking-wide ${edit.mode === m ? "text-[#0F172A]" : "text-slate-400"}`}>
                  {m === "test" ? "Test" : "Live"}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="px-5 pb-4">
        <button
          onClick={onSave}
          disabled={isSaving}
          className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
            isSuccess ? "bg-emerald-500 text-white" : "bg-[#4F46E5] hover:bg-[#3730A3] disabled:bg-slate-300 text-white"
          }`}
        >
          {isSaving ? (<><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...</>) :
           isSuccess ? (<><CheckCircle2 className="w-3.5 h-3.5" /> Saved!</>) :
           (<><Save className="w-3.5 h-3.5" /> Save Configuration</>)}
        </button>
      </div>
    </div>
  );
}

// manual gateway component card
function ManualGatewayCard({ gateway, edit, savingId, successId, qrPreview, onToggle, onConfigChange, onQrChange, onClearQr, onSave, setZoomQrUrl }) {
  if (!edit) return null;

  const isSaving = savingId === gateway.id;
  const isSuccess = successId === gateway.id;

  const bankFields = ["accountName", "accountNumber", "ifsc", "bankName"];
  const upiFields = ["upiId"];
  const otherFields = ["instructions"];

  return (
    <div className={`bg-white rounded-xl border transition-all duration-300 shadow-sm ${
      edit.enabled ? "border-emerald-200 ring-1 ring-emerald-50" : "border-slate-200"
    }`}>
      {/* Card Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors duration-300 ${
            edit.enabled ? "bg-emerald-50 border border-emerald-200" : "bg-slate-50 border border-slate-200"
          }`}>
            <HandCoins className={`w-5 h-5 transition-colors duration-300 ${edit.enabled ? "text-emerald-600" : "text-slate-400"}`} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#0F172A] font-display">{gateway.label}</h3>
            <span className={`text-[11px] font-bold uppercase tracking-wider ${edit.enabled ? "text-emerald-500" : "text-slate-400"}`}>
              {edit.enabled ? "Enabled" : "Disabled"}
            </span>
          </div>
        </div>
        <button onClick={() => onToggle(!edit.enabled)} className="cursor-pointer bg-transparent border-none p-0" title={edit.enabled ? "Disable" : "Enable"} aria-label={edit.enabled ? "Disable" : "Enable"}>
          {edit.enabled ? (
            <ToggleRight className="w-9 h-9 text-emerald-500 transition-transform duration-200 hover:scale-110" />
          ) : (
            <ToggleLeft className="w-9 h-9 text-slate-300 transition-transform duration-200 hover:scale-110" />
          )}
        </button>
      </div>

      {/* Config Fields */}
      <div className="px-6 py-5 space-y-6">
        {/* Bank Transfer Section */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Building2 className="w-4 h-4 text-[#475569]" />
            <span className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">Bank Transfer Details</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bankFields.map((key) => (
              <div key={key} className="space-y-1.5">
                <label className="text-[0.7rem] font-bold text-[#475569] uppercase tracking-wider block">{getFieldLabel(key)}</label>
                <input
                  type="text"
                  value={edit.config[key] || ""}
                  onChange={(e) => onConfigChange(key, e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white transition-all font-body font-medium"
                  placeholder={`Enter ${getFieldLabel(key).toLowerCase()}`}
                 aria-label="W-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white transition-all font-body font-medium"/>
              </div>
            ))}
          </div>
        </div>

        {/* UPI Section */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Smartphone className="w-4 h-4 text-[#475569]" />
            <span className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">UPI Payment</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upiFields.map((key) => (
              <div key={key} className="space-y-1.5">
                <label className="text-[0.7rem] font-bold text-[#475569] uppercase tracking-wider block">{getFieldLabel(key)}</label>
                <input
                  type="text"
                  value={edit.config[key] || ""}
                  onChange={(e) => onConfigChange(key, e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white transition-all font-body font-medium"
                  placeholder="e.g. business@upi"
                 aria-label="e.g. business@upi"/>
              </div>
            ))}
            {/* QR Code Upload */}
            <div className="space-y-1.5">
              <label className="text-[0.7rem] font-bold text-[#475569] uppercase tracking-wider block">QR Code Image</label>
              {qrPreview ? (
                <div className="flex items-center gap-3">
                  <div 
                    onClick={() => setZoomQrUrl(qrPreview)}
                    className="relative group cursor-pointer border border-slate-200 hover:border-emerald-500 rounded-xl bg-white p-1 transition-all duration-200 hover:shadow-md hover:scale-105 shrink-0"
                    title="Click to enlarge QR Code"
                  >
                    <img src={qrPreview} alt="QR Code" className="w-20 h-20 object-contain rounded-lg" width={80} height={80} />
                    <div className="absolute inset-0 bg-emerald-900/40 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-[10px] gap-1">
                      <ZoomIn className="w-4 h-4" />
                    </div>
                  </div>
                  <button onClick={onClearQr} className="text-xs font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1 cursor-pointer bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-md border border-slate-200 transition-colors">
                    <X className="w-3.5 h-3.5" /> Remove
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-lg p-4 cursor-pointer hover:border-emerald-400 hover:bg-slate-50/50 transition-all">
                  <input type="file" accept="image/*" onChange={onQrChange} className="hidden" />
                  <QrCode className="w-8 h-8 text-slate-400 mb-1" />
                  <span className="text-[11px] text-[#475569] font-medium">Click to upload QR code</span>
                </label>
              )}
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-4 h-4 text-[#475569]" />
            <span className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">Payment Instructions</span>
          </div>
          {otherFields.map((key) => (
            <textarea
              key={key}
              rows={3}
              value={edit.config[key] || ""}
              onChange={(e) => onConfigChange(key, e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white transition-all font-body leading-relaxed"
              placeholder="Enter instructions shown to clients during manual payment..."
             aria-label="Enter instructions shown to clients during manual payment..."/>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <div className="px-6 pb-5">
        <button
          onClick={onSave}
          disabled={isSaving}
          className={`inline-flex items-center justify-center gap-2 px-8 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
            isSuccess ? "bg-emerald-500 text-white" : "bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white"
          }`}
        >
          {isSaving ? (<><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...</>) :
           isSuccess ? (<><CheckCircle2 className="w-3.5 h-3.5" /> Saved!</>) :
           (<><Save className="w-3.5 h-3.5" /> Save Manual Payment</>)}
        </button>
      </div>
    </div>
  );
}
