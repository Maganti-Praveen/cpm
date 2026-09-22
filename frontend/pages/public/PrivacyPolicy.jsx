// Policy page details rules regarding data storage and compliance.
// Renders legal statements.


import { Link } from "react-router-dom";
import { ShieldCheck, Sparkles } from "lucide-react";
import MegaMenu from "../../components/layout/MegaMenu";
import PublicFooter from "../../components/layout/PublicFooter";
import { useCmsSettings } from "../../context/CmsSettingsContext";

function PrivacyPolicy() {
  const cms = useCmsSettings();
  const privacy = cms["privacy-policy"] || {};
  const general = privacy.general || {};
  // Retrieves legal policy paragraphs list from CMS database variables
  const sections = general.sections || [];

  return (
    <div className="min-h-screen font-body flex flex-col" style={{ backgroundColor: "var(--page-bg, #F8FAFC)", color: "var(--page-text, #0F172A)" }}>
      <MegaMenu />

      <main className="flex-1 pt-16">
        {/* Privacy Policy Hero */}
        <section className="relative px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 overflow-hidden bg-slate-50 border-b border-slate-200 text-center">
          <div className="max-w-4xl mx-auto space-y-4 relative z-10">
            <span
              className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold border bg-indigo-50 text-indigo-700 border-indigo-200"
            >
              <Sparkles size={14} className="text-indigo-500" /> Legal
            </span>
            <h1 className="text-4xl sm:text-5xl font-extrabold font-display leading-tight tracking-tight text-slate-900">
              {general.title || "Privacy Policy"}
            </h1>
            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              {general.effectiveDate || "Effective Date: February 12, 2026"}
            </p>
          </div>
        </section>

        {/* Privacy Policy Content */}
        <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto rounded-2xl border shadow-sm p-8 sm:p-12" style={{ backgroundColor: "var(--card-bg, #FFFFFF)", borderColor: "var(--border-color, #E2E8F0)" }}>

          {general.intro && (
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-8 whitespace-pre-line">
              {general.intro}
            </p>
          )}

          {sections.map((section, idx) => (
            <section key={idx} className="mb-8">
              {section.title && (
                <h2 className="font-display text-xl font-bold text-[var(--text-primary)] mb-4">
                  {section.title}
                </h2>
              )}
              {section.body && (
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-6 whitespace-pre-line">
                  {section.body}
                </p>
              )}
              
              {section.boxes && section.boxes.map((box, bIdx) => (
                <div 
                  key={bIdx} 
                  className={`p-6 border rounded-xl mb-6 ${
                    box.type === "primary" 
                      ? "bg-primary-light/40 border-primary-light/60 text-sm text-[var(--text-secondary)] leading-relaxed" 
                      : "bg-slate-50 border-slate-200 text-sm text-[var(--text-secondary)] leading-relaxed"
                  }`}
                >
                  {box.title && (
                    <h3 className={`font-display text-sm font-bold mb-3 flex items-center gap-2 ${box.type === "primary" ? "text-primary" : "text-[var(--text-primary)]"}`}>
                      <span className={`w-1.5 h-1.5 rounded-full block ${box.type === "primary" ? "bg-primary" : "bg-slate-650"}`}></span>
                      {box.title}
                    </h3>
                  )}
                  {box.intro && (
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-4 whitespace-pre-line">
                      {box.intro}
                    </p>
                  )}
                  {box.items && box.items.length > 0 && (
                    <ul className="list-disc pl-5 space-y-2 text-xs text-[var(--text-secondary)] leading-relaxed">
                      {box.items.map((item, iIdx) => (
                        <li key={iIdx}>{item}</li>
                      ))}
                    </ul>
                  )}
                  {box.note && (
                    <p className="text-[11px] text-primary mt-3 font-semibold">
                      {box.note}
                    </p>
                  )}
                </div>
              ))}
            </section>
          ))}

          <div className="text-center text-xs text-[var(--text-secondary)]/75 pt-8 border-t border-slate-200">
            By continuing to use our platform, you acknowledge that you have read and understood this Privacy Policy.
          </div>
        </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}

export default PrivacyPolicy;
