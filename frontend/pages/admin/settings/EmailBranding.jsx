// Customizes email layouts, signatures, and footers.
// Manages custom email headers.


import { useState, useEffect } from "react";
import { Save, Loader2, Palette, Type, FileText, Sparkles } from "lucide-react";
import { getEmailSettings, updateEmailSettings } from "../../../services/emailSettingsService";
import { useToast } from "../../../context/ToastContext";

export default function EmailBranding() {
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Styling States
  const [primaryColor, setPrimaryColor] = useState("#4F46E5");
  const [headerBg, setHeaderBg] = useState("#1E1B4B");
  const [bodyBg, setBodyBg] = useState("#FFFFFF");
  const [bgColor, setBgColor] = useState("#F8FAFC");
  const [fontColor, setFontColor] = useState("#334155");
  const [fontFamily, setFontFamily] = useState("Segoe UI, Arial, sans-serif");
  const [footerText, setFooterText] = useState("© 2026 {{companyName}}. All rights reserved.");

  // Fetch settings on mount
  useEffect(() => {
    async function loadBranding() {
      setIsLoading(true);
      try {
        const res = await getEmailSettings();
        if (res?.data) {
          const s = res.data;
          setPrimaryColor(s.emailPrimaryColor || "#4F46E5");
          setHeaderBg(s.emailHeaderBg || "#1E1B4B");
          setBodyBg(s.emailBodyBg || "#FFFFFF");
          setBgColor(s.emailBgColor || "#F8FAFC");
          setFontColor(s.emailFontColor || "#334155");
          setFontFamily(s.emailFontFamily || "Segoe UI, Arial, sans-serif");
          setFooterText(s.emailFooterText || "© 2026 {{companyName}}. All rights reserved.");
        }
      } catch (err) {
        console.error("Failed to load email branding settings:", err);
        showToast("Failed to load branding configurations", "error");
      } finally {
        setIsLoading(false);
      }
    }
    loadBranding();
  }, [showToast]);

  // Save changes
  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateEmailSettings({
        emailPrimaryColor: primaryColor,
        emailHeaderBg: headerBg,
        emailBodyBg: bodyBg,
        emailBgColor: bgColor,
        emailFontColor: fontColor,
        emailFontFamily: fontFamily,
        emailFooterText: footerText,
      });
      showToast("Email branding saved successfully", "success");
    } catch (err) {
      console.error("Failed to save email branding:", err);
      showToast(err.message || "Failed to save branding configurations", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const fontOptions = [
    { label: "Segoe UI (Clean Sans)", value: "Segoe UI, Arial, sans-serif" },
    { label: "Arial / Helvetica", value: "Arial, Helvetica, sans-serif" },
    { label: "Georgia (Elegant Serif)", value: "Georgia, serif" },
    { label: "Times New Roman", value: "'Times New Roman', Times, serif" },
    { label: "Courier New (Monospace)", value: "'Courier New', Courier, monospace" },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-[#4F46E5] animate-spin" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Configuration Controls (Left) */}
      <div className="lg:col-span-5 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Palette className="w-5 h-5 text-[#4F46E5]" />
          <h3 className="text-base font-bold text-slate-800">Email Theme Customizer</h3>
        </div>

        {/* Colors Section */}
        <div className="space-y-4">
          <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Colors</h4>
          
          {/* Primary Accent Color */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-600 flex items-center justify-between">
              <span>Primary Accent Color</span>
              <span className="font-mono text-[11px] text-slate-400">{primaryColor}</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-8 h-8 rounded border border-slate-200 cursor-pointer p-0 overflow-hidden shrink-0"
               aria-label="W-8 h-8 rounded border border-slate-200 cursor-pointer p-0 overflow-hidden shrink-0"/>
              <input
                type="text"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:outline-none focus:bg-white font-mono font-semibold"
               aria-label="W-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:outline-none focus:bg-white font-mono font-semibold"/>
            </div>
          </div>

          {/* Header Background */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-600 flex items-center justify-between">
              <span>Header Background</span>
              <span className="font-mono text-[11px] text-slate-400">{headerBg}</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={headerBg}
                onChange={(e) => setHeaderBg(e.target.value)}
                className="w-8 h-8 rounded border border-slate-200 cursor-pointer p-0 overflow-hidden shrink-0"
               aria-label="W-8 h-8 rounded border border-slate-200 cursor-pointer p-0 overflow-hidden shrink-0"/>
              <input
                type="text"
                value={headerBg}
                onChange={(e) => setHeaderBg(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:outline-none focus:bg-white font-mono font-semibold"
               aria-label="W-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:outline-none focus:bg-white font-mono font-semibold"/>
            </div>
          </div>

          {/* Body Canvas Background */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-600 flex items-center justify-between">
              <span>Email Body Background</span>
              <span className="font-mono text-[11px] text-slate-400">{bodyBg}</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={bodyBg}
                onChange={(e) => setBodyBg(e.target.value)}
                className="w-8 h-8 rounded border border-slate-200 cursor-pointer p-0 overflow-hidden shrink-0"
               aria-label="W-8 h-8 rounded border border-slate-200 cursor-pointer p-0 overflow-hidden shrink-0"/>
              <input
                type="text"
                value={bodyBg}
                onChange={(e) => setBodyBg(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:outline-none focus:bg-white font-mono font-semibold"
               aria-label="W-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:outline-none focus:bg-white font-mono font-semibold"/>
            </div>
          </div>

          {/* Outer Layout Backdrop */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-600 flex items-center justify-between">
              <span>Outer Layout Backdrop</span>
              <span className="font-mono text-[11px] text-slate-400">{bgColor}</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                className="w-8 h-8 rounded border border-slate-200 cursor-pointer p-0 overflow-hidden shrink-0"
               aria-label="W-8 h-8 rounded border border-slate-200 cursor-pointer p-0 overflow-hidden shrink-0"/>
              <input
                type="text"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:outline-none focus:bg-white font-mono font-semibold"
               aria-label="W-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:outline-none focus:bg-white font-mono font-semibold"/>
            </div>
          </div>

          {/* Font Color */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-600 flex items-center justify-between">
              <span>Body Font Color</span>
              <span className="font-mono text-[11px] text-slate-400">{fontColor}</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={fontColor}
                onChange={(e) => setFontColor(e.target.value)}
                className="w-8 h-8 rounded border border-slate-200 cursor-pointer p-0 overflow-hidden shrink-0"
               aria-label="W-8 h-8 rounded border border-slate-200 cursor-pointer p-0 overflow-hidden shrink-0"/>
              <input
                type="text"
                value={fontColor}
                onChange={(e) => setFontColor(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:outline-none focus:bg-white font-mono font-semibold"
               aria-label="W-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:outline-none focus:bg-white font-mono font-semibold"/>
            </div>
          </div>
        </div>

        {/* Typography Section */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-1.5">
            <Type className="w-4 h-4 text-slate-400" />
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Typography</h4>
          </div>
          
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-600 block">Font Family</label>
            <select
              value={fontFamily}
              onChange={(e) => setFontFamily(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:bg-white font-semibold cursor-pointer"
             aria-label="Select w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:bg-white font-semibold cursor-pointer">
              {fontOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Footer Section */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-slate-400" />
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Footer Signature</h4>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-600 block">Footer HTML / Text</label>
            <textarea
              rows={3}
              value={footerText}
              onChange={(e) => setFooterText(e.target.value)}
              placeholder="e.g. © 2026 Company Name. All rights reserved."
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:bg-white font-medium"
             aria-label="e.g. © 2026 Company Name. All rights reserved."/>
            <p className="text-[9px] text-slate-400 italic">
              Supports standard HTML text. Placeholders like <span className="font-mono bg-slate-100 px-1 py-0.5 rounded text-[8px] font-bold">{"{{companyName}}"}</span> will resolve dynamically.
            </p>
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-4 border-t border-slate-100">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#4F46E5] text-white text-xs font-semibold rounded-lg hover:bg-[#3730A3] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving Changes...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Theme Settings</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Live Preview Simulator (Right) */}
      <div className="lg:col-span-7 flex flex-col gap-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider"> Live Preview</h4>
          </div>
        </div>

        <div 
          className="w-full border border-slate-200 rounded-2xl p-4 sm:p-6 flex flex-col justify-center items-center overflow-hidden transition-all duration-300 min-h-[480px]"
          style={{ backgroundColor: bgColor }}
        >
          {/* Simulated Email Envelope */}
          <div 
            className="w-full max-w-[500px] bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 border border-slate-200/50 flex flex-col"
            style={{ backgroundColor: bodyBg, fontFamily: fontFamily }}
          >
            {/* Header */}
            <div 
              className="p-4 sm:p-8 text-center transition-all duration-300"
              style={{ backgroundColor: headerBg }}
            >
              <h1 className="text-white margin-0 text-xl font-bold tracking-tight">Invoice Created</h1>
            </div>

            {/* Body */}
            <div 
              className="p-4 sm:p-8 space-y-5 text-sm text-left leading-relaxed transition-all duration-300"
              style={{ color: fontColor }}
            >
              <p>Hi Sai,</p>
              
              <p>A new invoice has been generated for your account. Please review the details below to complete your payment.</p>

              <table className="w-full text-xs border-collapse">
                <tbody>
                  <tr className="border-b border-slate-100">
                    <th className="text-left font-bold text-slate-400 py-2.5 px-3 uppercase tracking-wider bg-slate-50/50 text-[11px]">Invoice #</th>
                    <td className="py-2.5 px-3 font-semibold">INV-2026-004</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <th className="text-left font-bold text-slate-400 py-2.5 px-3 uppercase tracking-wider bg-slate-50/50 text-[11px]">Amount</th>
                    <td className="py-2.5 px-3 font-extrabold text-slate-900" style={{ color: fontColor }}>₹15,000</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <th className="text-left font-bold text-slate-400 py-2.5 px-3 uppercase tracking-wider bg-slate-50/50 text-[11px]">Due Date</th>
                    <td className="py-2.5 px-3">July 10, 2026</td>
                  </tr>
                </tbody>
              </table>

              {/* Call-to-action Button */}
              <div className="text-center pt-3">
                <button
                  type="button"
                  className="px-8 py-2.5 rounded-lg text-white font-bold text-xs shadow-md border-none cursor-pointer inline-block transition-transform active:scale-98"
                  style={{ backgroundColor: primaryColor }}
                >
                  Pay Now
                </button>
              </div>

              {/* Blockquote Highlight Box */}
              <div 
                className="border-l-4 p-4 rounded-r-lg"
                style={{ 
                  borderColor: primaryColor,
                  backgroundColor: `${primaryColor}0d` // 5% opacity hex overlay
                }}
              >
                <p className="margin-0 text-xs italic font-medium">
                  <strong>Notice:</strong> Delayed payments may subject accounts to temporary service suspensions as per SLA terms.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-slate-50/80 border-t border-slate-100 py-6 px-4 sm:px-8 text-center text-[11px] text-slate-400 leading-normal">
              <p className="margin-0 font-medium">
                {footerText.replace("{{companyName}}", "Sai IT Services")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
