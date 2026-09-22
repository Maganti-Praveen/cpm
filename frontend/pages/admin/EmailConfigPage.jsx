// Email management panel linking mail configs, logs, branding, and template editors.
// Redirects settings tabs.


import { useState } from "react";
import { Mail, FileText, Palette, ScrollText } from "lucide-react";
import EmailSettingsTab from "./settings/EmailSettings";
import EmailTemplatesTab from "./settings/EmailTemplates";
import EmailBrandingTab from "./settings/EmailBranding";
import EmailLogs from "./settings/EmailLogs";

const TABS = [
  { key: "config", label: "Email Configuration", icon: Mail },
  { key: "templates", label: "Email Templates", icon: FileText },
  { key: "theme", label: "Email Theme", icon: Palette },
  { key: "logs", label: "Logs", icon: ScrollText },
];

export default function EmailConfigPage() {
  // Tracks active configuration selector tabs
  const [activeTab, setActiveTab] = useState("config");

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-[1.75rem] font-bold text-[#0F172A] font-display flex items-center gap-3">
          <Mail className="w-7 h-7 text-[#4F46E5]" />
          Email Configuration
        </h1>
        <p className="text-sm text-[#64748B] mt-1">
          Configure email providers, manage templates, and view email logs
        </p>
      </div>

      {/* Tab Navigation */}
      <div role="tablist" aria-label="Email configuration options" className="flex overflow-x-auto whitespace-nowrap border-b border-[#E2E8F0] mb-6 gap-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            id={`tab-${tab.key}`}
            role="tab"
            aria-selected={activeTab === tab.key}
            aria-controls={`tabpanel-${tab.key}`}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 pb-3 pt-1 text-sm font-semibold tracking-wide transition-all duration-200 cursor-pointer border-b-2 shrink-0 ${
              activeTab === tab.key
                ? "border-[#4F46E5] text-[#4F46E5]"
                : "border-transparent text-[#64748B] hover:text-[#334155] hover:border-[#CBD5E1]"
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="mt-4">
        {activeTab === "config" && (
          <div id="tabpanel-config" role="tabpanel" aria-labelledby="tab-config">
            <EmailSettingsTab embedded />
          </div>
        )}
        {activeTab === "templates" && (
          <div id="tabpanel-templates" role="tabpanel" aria-labelledby="tab-templates">
            <EmailTemplatesTab embedded />
          </div>
        )}
        {activeTab === "theme" && (
          <div id="tabpanel-theme" role="tabpanel" aria-labelledby="tab-theme">
            <EmailBrandingTab />
          </div>
        )}
        {activeTab === "logs" && (
          <div id="tabpanel-logs" role="tabpanel" aria-labelledby="tab-logs">
            <EmailLogs />
          </div>
        )}
      </div>
    </div>
  );
}
