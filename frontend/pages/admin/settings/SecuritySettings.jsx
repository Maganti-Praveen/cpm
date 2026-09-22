// Form config setting login lock policies and password complexity rules.
// Manages global safety restrictions.


import { useState, useEffect, useCallback } from "react";
import {
  Shield,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Info,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  getSecuritySettings,
  updateSecuritySettings,
} from "../../../services/securitySettingsService";

// custom toggle switch component
function Toggle({ enabled, onChange, ...props }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 cursor-pointer focus:outline-none ${
        enabled ? "bg-[#4F46E5]" : "bg-[#CBD5E1]"
      }`}
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
    <div className="fixed top-6 right-6 z-50 animate-[fadeIn_0.2s_ease-out]">
      <div className={`flex items-center gap-2.5 px-4 py-3 rounded-lg shadow-lg border text-sm font-medium ${
        type === "success"
          ? "bg-emerald-50 border-emerald-200 text-emerald-700"
          : "bg-rose-50 border-rose-200 text-rose-700"
      }`}>
        {type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
        {message}
      </div>
    </div>
  );
}

const ROLE_CARDS = [
  {
    key: "admin2FAEnabled",
    role: "Admin",
    description: "Require two-factor authentication for all administrator accounts. Admins manage system settings, users, and sensitive data.",
    color: "bg-indigo-50",
    iconColor: "text-indigo-600",
  },
  {
    key: "staff2FAEnabled",
    role: "Staff",
    description: "Require two-factor authentication for staff members. Staff users access project data, tasks, and client information.",
    color: "bg-emerald-50",
    iconColor: "text-emerald-600",
  },
  {
    key: "client2FAEnabled",
    role: "Client",
    description: "Require two-factor authentication for client accounts. Clients view their projects, invoices, and submit support tickets.",
    color: "bg-amber-50",
    iconColor: "text-amber-600",
  },
];

export default function SecuritySettings() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [settings, setSettings] = useState({
    admin2FAEnabled: false,
    staff2FAEnabled: false,
    client2FAEnabled: false,
  });

  const showToast = (message, type = "success") => setToast({ message, type });

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getSecuritySettings();
      setSettings(res.data.data);
    } catch {
      showToast("Failed to load security settings", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateSecuritySettings(settings);
      showToast("Security settings saved");
    } catch {
      showToast("Save failed", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-[#4F46E5]" />
      </div>
    );
  }

  return (
    <div>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/admin/settings")}
            className="flex items-center justify-center w-9 h-9 rounded-lg border border-[#CBD5E1] hover:bg-[#F1F5F9] transition-colors cursor-pointer">
            <ArrowLeft size={16} className="text-[#64748B]" />
          </button>
          <div>
            <h1 className="text-[1.75rem] font-bold text-[#0F172A] font-display">Security Settings</h1>
            <p className="text-sm text-[#64748B] mt-1">Manage two-factor authentication and access controls</p>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-[#EEF2FF] border border-[#C7D2FE] rounded-xl p-4 mb-6 flex items-start gap-3">
        <Info size={18} className="text-[#4F46E5] mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-medium text-[#3730A3]">Two-Factor Authentication (2FA)</p>
          <p className="text-xs text-[#6366F1] mt-1">
            When enabled, users in the selected role will be required to verify their identity with a one-time code during login.
            OTP delivery integration is ready for setup with your configured email provider.
          </p>
        </div>
      </div>

      {/* 2FA Role Cards */}
      <div className="space-y-4 mb-8">
        {ROLE_CARDS.map((card) => (
          <div key={card.key} className="bg-white rounded-xl shadow-sm border border-[#E2E8F0] p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-11 h-11 rounded-xl ${card.color} flex items-center justify-center`}>
                  <Shield size={20} className={card.iconColor} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#0F172A]">{card.role} 2FA</h3>
                  <p className="text-xs text-[#64748B] mt-0.5 max-w-md">{card.description}</p>
                </div>
              </div>
              <Toggle
                enabled={settings[card.key]}
                onChange={(v) => setSettings((p) => ({ ...p, [card.key]: v }))}
                aria-label={`Toggle 2FA for ${card.role}`}
              />
            </div>
          </div>
        ))}
      </div>

      {/* OTP Notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
        <Info size={18} className="text-amber-600 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-medium text-amber-800">About Two-Factor Authentication</p>
          <p className="text-xs text-amber-600 mt-1">
            These settings control whether users are prompted for an email OTP during login. When enabled for a role, all users with that role will need to verify a 6-digit code sent to their email before accessing the portal.
          </p>
        </div>
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <button onClick={handleSave} disabled={saving}
          className="inline-flex items-center gap-2 h-9 px-5 rounded-lg bg-[#4F46E5] hover:bg-[#3730A3] text-white text-sm font-medium cursor-pointer transition-colors shadow-sm disabled:opacity-50">
          {saving && <Loader2 size={14} className="animate-spin" />}
          Save Settings
        </button>
      </div>
    </div>
  );
}
