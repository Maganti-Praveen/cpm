// SMTP setup dashboard for mail configurations and testing mail servers.
// Validates connections.


import { useState, useEffect, useCallback } from "react";
import {
  Mail,
  Server,
  Key,
  Bell,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  Send,
  ArrowLeft,
  X,
  ChevronDown,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  getEmailSettings,
  updateEmailSettings,
  testEmailConnection,
  getEmailStatus,
} from "../../../services/emailSettingsService";

// custom toggle component
function Toggle({ enabled, onChange, disabled = false, ...props }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      disabled={disabled}
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 ${
        enabled ? "bg-[#4F46E5]" : "bg-[#CBD5E1]"
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      {...props}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transform transition-transform duration-200 ${
          enabled ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

// toast notification component
function Toast({ message, type = "success", onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="fixed top-6 right-6 z-50 animate-in slide-in-from-top-2">
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border ${
          type === "success"
            ? "bg-emerald-50 border-emerald-200 text-emerald-800"
            : "bg-rose-50 border-rose-200 text-rose-800"
        }`}
      >
        {type === "success" ? (
          <CheckCircle2 className="w-4 h-4 shrink-0" />
        ) : (
          <XCircle className="w-4 h-4 shrink-0" />
        )}
        <span className="text-sm font-medium">{message}</span>
        <button onClick={onClose} className="ml-2 cursor-pointer">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// SMTP presets config
const SMTP_PRESETS = [
  { label: "Select a preset...", value: "" },
  { label: "Gmail", value: "gmail", host: "smtp.gmail.com", port: 587, secure: true },
  { label: "Outlook / Office 365", value: "outlook", host: "smtp.office365.com", port: 587, secure: true },
  { label: "Zoho Mail", value: "zoho", host: "smtp.zoho.com", port: 587, secure: true },
  { label: "Custom", value: "custom" },
];

// default form values
const DEFAULT_SETTINGS = {
  emailEnabled: false,
  provider: "smtp",
  // SMTP
  smtpHost: "",
  smtpPort: 587,
  smtpUsername: "",
  smtpPassword: "",
  smtpFromEmail: "",
  smtpFromName: "",
  smtpSecure: true,
  // Resend
  resendApiKey: "",
  resendFromEmail: "",
  resendFromName: "",
  // Brevo
  brevoApiKey: "",
  brevoFromEmail: "",
  brevoFromName: "",
  // Notifications
  autoEmails: true,
  invoiceEmails: true,
  clientWelcomeEmails: true,
  staffWelcomeEmails: true,
  projectAssignmentEmails: true,
  passwordResetEmails: true,
  supportTicketEmails: true,
};

// settings tabs
const TABS = [
  { id: "general", label: "General", icon: Mail },
  { id: "smtp", label: "SMTP", icon: Server },
  { id: "resend", label: "Resend", icon: Key },
  { id: "brevo", label: "Brevo", icon: Key },
  { id: "notifications", label: "Notifications", icon: Bell },
];

export default function EmailSettings({ embedded = false }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("general");
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const [status, setStatus] = useState(null); // { connected: bool }
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [testEmail, setTestEmail] = useState("");
  const [showTestInput, setShowTestInput] = useState(false);
  const [testing, setTesting] = useState(false);

  // Fetch settings on mount
  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const { data } = await getEmailSettings();
      const s = data?.data || data || {};
      setSettings((prev) => ({ ...prev, ...s }));
    } catch (err) {
      setError("Failed to load email settings. The server may not have this endpoint yet.");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStatus = useCallback(async () => {
    try {
      setCheckingStatus(true);
      const { data } = await getEmailStatus();
      setStatus(data?.data || data || null);
    } catch {
      setStatus(null);
    } finally {
      setCheckingStatus(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
    fetchStatus();
  }, [fetchSettings, fetchStatus]);

  // Update a single field
  const set = (key, value) =>
    setSettings((prev) => ({ ...prev, [key]: value }));

  // Save handler
  const handleSave = async () => {
    try {
      setSaving(true);
      setError("");
      await updateEmailSettings(settings);
      setToast({ message: "Email settings saved successfully!", type: "success" });
      fetchStatus();
    } catch (err) {
      const msg =
        err.response?.data?.message || "Failed to save email settings.";
      setToast({ message: msg, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  // Test connection handler
  const handleTest = async () => {
    if (!testEmail.trim()) return;
    try {
      setTesting(true);
      await testEmailConnection(testEmail.trim());
      setToast({ message: "Test email sent successfully!", type: "success" });
      setShowTestInput(false);
      setTestEmail("");
    } catch (err) {
      const msg =
        err.response?.data?.message || "Failed to send test email.";
      setToast({ message: msg, type: "error" });
    } finally {
      setTesting(false);
    }
  };

  // Apply SMTP preset
  const applyPreset = (presetValue) => {
    const preset = SMTP_PRESETS.find((p) => p.value === presetValue);
    if (preset && preset.host) {
      setSettings((prev) => ({
        ...prev,
        smtpHost: preset.host,
        smtpPort: preset.port,
        smtpSecure: preset.secure,
      }));
    }
  };

  if (loading) {
    return (
      <div className="w-full min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-[#4F46E5] animate-spin" />
          <p className="text-sm text-[#64748B]">Loading email settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full font-sans antialiased text-[#0F172A]">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* page header */}
      {!embedded && (
      <div className="mb-6 flex items-start justify-between">
        <div>
          <button
            onClick={() => navigate("/admin/settings")}
            className="inline-flex items-center gap-1.5 text-sm text-[#64748B] hover:text-[#4F46E5] mb-3 cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Settings
          </button>
          <h1 className="text-[1.75rem] font-bold text-[#0F172A] font-display">
            Email Configuration
          </h1>
          <p className="text-sm text-[#64748B] mt-1">
            Configure your email provider, SMTP or Resend settings, and manage notification preferences.
          </p>
        </div>
      </div>
      )}

      {/* error notification */}
      {error && (
        <div className="mb-6 bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* tab navigation menu */}
      <div className="flex overflow-x-auto whitespace-nowrap border-b border-[#E2E8F0] mb-8 gap-6">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 text-sm font-medium transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                activeTab === tab.id
                  ? "border-b-2 border-[#4F46E5] text-[#4F46E5]"
                  : "text-[#64748B] hover:text-[#334155] border-b-2 border-transparent"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* active tab pane */}
      <div className="bg-white rounded-xl shadow-sm border border-[#E2E8F0] p-4 sm:p-6 md:p-8">
        {/* general tab */}
        {activeTab === "general" && (
          <div className="space-y-8">
            {/* Email system toggle */}
            <div className="flex items-center justify-between p-5 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC]">
              <div>
                <h3 className="text-sm font-semibold text-[#0F172A]">
                  Email System
                </h3>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Enable or disable the entire email notification system.
                </p>
              </div>
              <Toggle
                enabled={settings.emailEnabled}
                onChange={(v) => set("emailEnabled", v)}
                aria-label="Toggle email notification system"
              />
            </div>

            {/* Provider selection */}
            <div className="space-y-3">
              <label className="block text-xs font-medium text-[#64748B] mb-1.5">
                Email Provider
              </label>
              <div className="flex flex-col sm:flex-row gap-4">
                {[
                  { value: "smtp", label: "SMTP", desc: "Traditional SMTP server" },
                  { value: "resend", label: "Resend", desc: "Resend API service" },
                  { value: "brevo", label: "Brevo", desc: "Brevo API service" },
                ].map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex-1 flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      settings.provider === opt.value
                        ? "border-[#4F46E5] bg-[#4F46E5]/5"
                        : "border-[#E2E8F0] hover:border-[#CBD5E1]"
                    }`}
                  >
                    <input
                      type="radio"
                      name="provider"
                      value={opt.value}
                      checked={settings.provider === opt.value}
                      onChange={() => set("provider", opt.value)}
                      className="mt-1 accent-[#4F46E5]"
                     aria-label="Provider"/>
                    <div>
                      <span className="text-sm font-semibold text-[#0F172A]">
                        {opt.label}
                      </span>
                      <p className="text-xs text-[#64748B] mt-0.5">
                        {opt.desc}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Connection status */}
            <div className="flex items-center gap-3 p-4 rounded-lg border border-[#E2E8F0]">
              {checkingStatus ? (
                <>
                  <Loader2 className="w-4 h-4 text-[#4F46E5] animate-spin shrink-0" />
                  <span className="text-sm text-[#64748B]">Checking connection status...</span>
                </>
              ) : (
                <>
                  <div
                    className={`w-3 h-3 rounded-full ${
                      status?.connected
                        ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.4)]"
                        : "bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.4)]"
                    }`}
                  />
                  <span className="text-sm text-[#334155]">
                    {status?.connected
                      ? "Connected and ready to send emails"
                      : "Not connected — configure your provider settings"}
                  </span>
                </>
              )}
            </div>

            {/* Test email */}
            <div className="space-y-3">
              {!showTestInput ? (
                <button
                  type="button"
                  onClick={() => setShowTestInput(true)}
                  className="inline-flex items-center gap-2 bg-[#4F46E5] hover:bg-[#3730A3] text-white rounded-lg h-9 px-4 text-sm font-medium cursor-pointer transition-colors shadow-sm"
                >
                  <Send className="w-4 h-4" />
                  Send Test Email
                </button>
              ) : (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <input
                    type="email"
                    placeholder="recipient@example.com"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    className="w-full max-w-sm h-9 px-3 rounded-lg border border-[#CBD5E1] bg-white text-sm text-[#334155] outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5]/20"
                   aria-label="recipient@example.com"/>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleTest}
                      disabled={testing || !testEmail.trim()}
                      className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 bg-[#4F46E5] hover:bg-[#3730A3] text-white rounded-lg h-9 px-4 text-sm font-medium cursor-pointer transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {testing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      {testing ? "Sending..." : "Send"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowTestInput(false);
                        setTestEmail("");
                      }}
                      className="flex-1 sm:flex-initial inline-flex items-center justify-center border border-[#CBD5E1] text-[#334155] hover:bg-[#F1F5F9] rounded-lg h-9 px-4 text-sm font-medium cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Save */}
            <div className="pt-6 border-t border-[#E2E8F0] flex justify-end">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 bg-[#4F46E5] hover:bg-[#3730A3] text-white rounded-lg h-9 px-4 text-sm font-medium cursor-pointer transition-colors shadow-sm disabled:opacity-50"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        )}

        {/* SMTP configuration tab */}
        {activeTab === "smtp" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-semibold text-[#0F172A]">SMTP Configuration</h3>
              <p className="text-xs text-[#64748B] mt-0.5">
                Enter your SMTP server details.
              </p>
            </div>

            {/* SMTP fields grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-medium text-[#64748B] mb-1.5">
                  SMTP Host
                </label>
                <input
                  type="text"
                  value={settings.smtpHost}
                  onChange={(e) => set("smtpHost", e.target.value)}
                  placeholder="smtp.example.com"
                  className="w-full h-9 px-3 rounded-lg border border-[#CBD5E1] bg-white text-sm text-[#334155] outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5]/20"
                 aria-label="smtp.example.com"/>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#64748B] mb-1.5">
                  Port
                </label>
                <input
                  type="number"
                  value={settings.smtpPort}
                  onChange={(e) => set("smtpPort", Number(e.target.value))}
                  placeholder="587"
                  className="w-full h-9 px-3 rounded-lg border border-[#CBD5E1] bg-white text-sm text-[#334155] outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5]/20"
                 aria-label="587"/>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#64748B] mb-1.5">
                  Username
                </label>
                <input
                  type="text"
                  value={settings.smtpUsername}
                  onChange={(e) => set("smtpUsername", e.target.value)}
                  placeholder="user@example.com"
                  className="w-full h-9 px-3 rounded-lg border border-[#CBD5E1] bg-white text-sm text-[#334155] outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5]/20"
                 aria-label="user@example.com"/>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#64748B] mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  value={settings.smtpPassword}
                  onChange={(e) => set("smtpPassword", e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-9 px-3 rounded-lg border border-[#CBD5E1] bg-white text-sm text-[#334155] outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5]/20"
                 aria-label="••••••••"/>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#64748B] mb-1.5">
                  From Email
                </label>
                <input
                  type="email"
                  value={settings.smtpFromEmail}
                  onChange={(e) => set("smtpFromEmail", e.target.value)}
                  placeholder="noreply@example.com"
                  className="w-full h-9 px-3 rounded-lg border border-[#CBD5E1] bg-white text-sm text-[#334155] outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5]/20"
                 aria-label="noreply@example.com"/>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#64748B] mb-1.5">
                  From Name
                </label>
                <input
                  type="text"
                  value={settings.smtpFromName}
                  onChange={(e) => set("smtpFromName", e.target.value)}
                  placeholder="Sai CRM"
                  className="w-full h-9 px-3 rounded-lg border border-[#CBD5E1] bg-white text-sm text-[#334155] outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5]/20"
                 aria-label="Sai CRM"/>
              </div>
            </div>

            {/* SSL/TLS toggle */}
            <div className="flex items-center justify-between p-4 rounded-lg border border-[#E2E8F0]">
              <div>
                <h4 className="text-sm font-medium text-[#0F172A]">SSL / TLS</h4>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Enable secure connection (recommended for port 587 and 465).
                </p>
              </div>
              <Toggle
                enabled={settings.smtpSecure}
                onChange={(v) => set("smtpSecure", v)}
                aria-label="Toggle SSL/TLS secure connection"
              />
            </div>

            {/* Save */}
            <div className="pt-6 border-t border-[#E2E8F0] flex justify-end">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 bg-[#4F46E5] hover:bg-[#3730A3] text-white rounded-lg h-9 px-4 text-sm font-medium cursor-pointer transition-colors shadow-sm disabled:opacity-50"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        )}

        {/* Resend configuration tab */}
        {activeTab === "resend" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-semibold text-[#0F172A]">Resend Configuration</h3>
              <p className="text-xs text-[#64748B] mt-0.5">
                Enter your Resend API credentials.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-[#64748B] mb-1.5">
                  API Key
                </label>
                <input
                  type="password"
                  value={settings.resendApiKey}
                  onChange={(e) => set("resendApiKey", e.target.value)}
                  placeholder="re_xxxxxxxxxxxx"
                  className="w-full h-9 px-3 rounded-lg border border-[#CBD5E1] bg-white text-sm text-[#334155] outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5]/20"
                 aria-label="re_xxxxxxxxxxxx"/>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#64748B] mb-1.5">
                  From Email
                </label>
                <input
                  type="email"
                  value={settings.resendFromEmail}
                  onChange={(e) => set("resendFromEmail", e.target.value)}
                  placeholder="noreply@yourdomain.com"
                  className="w-full h-9 px-3 rounded-lg border border-[#CBD5E1] bg-white text-sm text-[#334155] outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5]/20"
                 aria-label="noreply@yourdomain.com"/>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#64748B] mb-1.5">
                  From Name
                </label>
                <input
                  type="text"
                  value={settings.resendFromName}
                  onChange={(e) => set("resendFromName", e.target.value)}
                  placeholder="Sai CRM"
                  className="w-full h-9 px-3 rounded-lg border border-[#CBD5E1] bg-white text-sm text-[#334155] outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5]/20"
                 aria-label="Sai CRM"/>
              </div>
            </div>

            {/* Save */}
            <div className="pt-6 border-t border-[#E2E8F0] flex justify-end">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 bg-[#4F46E5] hover:bg-[#3730A3] text-white rounded-lg h-9 px-4 text-sm font-medium cursor-pointer transition-colors shadow-sm disabled:opacity-50"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        )}

        {/* Brevo configuration tab */}
        {activeTab === "brevo" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-semibold text-[#0F172A]">Brevo Configuration</h3>
              <p className="text-xs text-[#64748B] mt-0.5">
                Enter your Brevo API credentials.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-[#64748B] mb-1.5">
                  API Key (v3)
                </label>
                <input
                  type="password"
                  value={settings.brevoApiKey || ""}
                  onChange={(e) => set("brevoApiKey", e.target.value)}
                  placeholder="xkeysib-xxxxxxxxxxxx"
                  className="w-full h-9 px-3 rounded-lg border border-[#CBD5E1] bg-white text-sm text-[#334155] outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5]/20"
                 aria-label="xkeysib-xxxxxxxxxxxx"/>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#64748B] mb-1.5">
                  From Email
                </label>
                <input
                  type="email"
                  value={settings.brevoFromEmail || ""}
                  onChange={(e) => set("brevoFromEmail", e.target.value)}
                  placeholder="noreply@yourdomain.com"
                  className="w-full h-9 px-3 rounded-lg border border-[#CBD5E1] bg-white text-sm text-[#334155] outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5]/20"
                 aria-label="noreply@yourdomain.com"/>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#64748B] mb-1.5">
                  From Name
                </label>
                <input
                  type="text"
                  value={settings.brevoFromName || ""}
                  onChange={(e) => set("brevoFromName", e.target.value)}
                  placeholder="Sai CRM"
                  className="w-full h-9 px-3 rounded-lg border border-[#CBD5E1] bg-white text-sm text-[#334155] outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5]/20"
                 aria-label="Sai CRM"/>
              </div>
            </div>

            {/* Save */}
            <div className="pt-6 border-t border-[#E2E8F0] flex justify-end">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 bg-[#4F46E5] hover:bg-[#3730A3] text-white rounded-lg h-9 px-4 text-sm font-medium cursor-pointer transition-colors shadow-sm disabled:opacity-50"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        )}

        {/* email notifications tab */}
        {activeTab === "notifications" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-semibold text-[#0F172A]">Notification Preferences</h3>
              <p className="text-xs text-[#64748B] mt-0.5">
                Control which emails your system sends automatically.
              </p>
            </div>

            <div className="space-y-1">
              {/* Master toggle */}
              <div className="flex items-center justify-between p-4 rounded-lg border-2 border-[#E2E8F0] bg-[#F8FAFC]">
                <div>
                  <h4 className="text-sm font-semibold text-[#0F172A]">
                    Auto Emails (Master)
                  </h4>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    Master toggle — disabling this stops all automated emails.
                  </p>
                </div>
                <Toggle
                  enabled={settings.autoEmails}
                  onChange={(v) => set("autoEmails", v)}
                  aria-label="Toggle all automated emails (master toggle)"
                />
              </div>

              {/* Individual toggles */}
              {[
                {
                  key: "invoiceEmails",
                  label: "Invoice Emails",
                  desc: "Send invoices and payment reminders to clients.",
                },
                {
                  key: "clientWelcomeEmails",
                  label: "Client Welcome Emails",
                  desc: "Send welcome emails when new clients are added.",
                },
                {
                  key: "staffWelcomeEmails",
                  label: "Staff Welcome Emails",
                  desc: "Send onboarding emails to new staff members.",
                },
                {
                  key: "projectAssignmentEmails",
                  label: "Project Assignment Emails",
                  desc: "Notify staff when assigned to a new project.",
                },
                {
                  key: "passwordResetEmails",
                  label: "Password Reset Emails",
                  desc: "Send password reset links when requested.",
                },
                {
                  key: "supportTicketEmails",
                  label: "Support Ticket Emails",
                  desc: "Send notifications for new and updated support tickets.",
                },
              ].map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between p-4 rounded-lg border border-[#E2E8F0]"
                >
                  <div>
                    <h4 className="text-sm font-medium text-[#0F172A]">
                      {item.label}
                    </h4>
                    <p className="text-xs text-[#64748B] mt-0.5">{item.desc}</p>
                  </div>
                  <Toggle
                    enabled={settings[item.key]}
                    onChange={(v) => set(item.key, v)}
                    disabled={!settings.autoEmails}
                    aria-label={`Toggle automated ${item.label}`}
                  />
                </div>
              ))}
            </div>

            {/* Save */}
            <div className="pt-6 border-t border-[#E2E8F0] flex justify-end">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 bg-[#4F46E5] hover:bg-[#3730A3] text-white rounded-lg h-9 px-4 text-sm font-medium cursor-pointer transition-colors shadow-sm disabled:opacity-50"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
