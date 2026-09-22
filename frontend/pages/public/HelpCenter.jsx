// Support guides index rendering FAQs tables and guidelines resources.
// Details search lookups.


import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { useCmsSettings } from "../../context/CmsSettingsContext";
import { Icons } from "../../utils/iconHelper";
import MegaMenu from "../../components/layout/MegaMenu";
import PublicFooter from "../../components/layout/PublicFooter";

function HelpCenter() {
  const cms = useCmsSettings();
  const help = cms["help-center"] || {};
  
  const general = help.general || {};
  const guidance = help.guidance || {};
  const guidanceCards = guidance.cards || [];
  const faqs = help.faqs || {};
  const faqList = faqs.list || [];
  const cta = help.cta || {};

  return (
    <div className="min-h-screen font-body flex flex-col" style={{ backgroundColor: "var(--page-bg, #F8FAFC)", color: "var(--page-text, #0F172A)" }}>
      <MegaMenu />

      <main className="flex-1 pt-16">
        {/* Help Center Hero */}
        <section className="relative px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 overflow-hidden bg-slate-50 border-b border-slate-200 text-center">
          <div className="max-w-4xl mx-auto space-y-4 relative z-10">
            <span
              className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold border bg-indigo-50 text-indigo-700 border-indigo-200"
            >
              <Sparkles size={14} className="text-indigo-500" /> Support Resources
            </span>
            <h1 className="text-4xl sm:text-5xl font-extrabold font-display leading-tight tracking-tight text-slate-900">
              {general.title || "Help Center"}
            </h1>
            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              {general.subtitle || "Find guides, FAQs, and resources to help you manage your projects, clients, and workflows."}
            </p>
          </div>
        </section>

        {/* Help Center Content */}
        <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto rounded-2xl border shadow-sm p-8 sm:p-12" style={{ backgroundColor: "var(--card-bg, #FFFFFF)", borderColor: "var(--border-color, #E2E8F0)" }}>

          <section className="mb-10">
            <h2 className="font-display text-xl font-bold text-[var(--text-primary)] mb-4">
              {guidance.title || "Role-Based Guidance"}
            </h2>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-6">
              {guidance.description || "The Platform provides tailored workspaces with specific roles. Select your guide to get started:"}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Maps role guidance summaries configuration profiles */}
              {guidanceCards.map((card, idx) => {
                const CardIcon = Icons[card.icon] || Icons.HelpCircle;
                return (
                  <div key={idx} className="p-6 bg-primary-light/40 border border-primary-light/60 rounded-xl flex flex-col justify-between">
                    <div>
                      <div className="w-10 h-10 rounded-lg bg-primary text-white flex items-center justify-center mb-4">
                        <CardIcon className="w-5 h-5" />
                      </div>
                      <h4 className="text-sm font-bold text-[var(--text-primary)] mb-1 font-display">{card.title}</h4>
                      <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-4">
                        {card.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="mb-10">
            <h2 className="font-display text-xl font-bold text-[var(--text-primary)] mb-6">
              {faqs.title || "Frequently Asked Questions"}
            </h2>
            <div className="space-y-6">
              {faqList.map((faq, index) => (
                <div key={index} className="pb-6 border-b border-slate-200 last:border-0 last:pb-0">
                  <h4 className="text-sm font-bold text-[var(--text-primary)] mb-2 font-display flex items-start gap-2">
                    <span className="text-primary font-bold">Q:</span>
                    {faq.q}
                  </h4>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed pl-6">
                    {faq.a}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-8">
            <h2 className="font-display text-xl font-bold text-[var(--text-primary)] mb-4">
              {cta.title || "Need More Assistance?"}
            </h2>
            <div className="p-6 bg-primary-light/30 border border-primary-light/50 rounded-xl text-sm text-[var(--text-secondary)] leading-relaxed space-y-4">
              <p>
                {cta.description || "If you couldn't find the answers you need in our guides or FAQs, our technical support team is here to help. Get in touch to report issues, suggest enhancements, or get setup help."}
              </p>
              <div className="flex flex-wrap gap-4 items-center">
                <Link 
                  to="/contact" 
                  className="px-4 py-2 bg-primary text-white text-xs font-semibold rounded hover:bg-primary-dark transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  {cta.buttonText || "Contact Support"} <Icons.ArrowRight className="w-3.5 h-3.5" />
                </Link>
                {cta.email && (
                  <div className="flex items-center gap-2 text-xs">
                    <Icons.Mail className="w-4 h-4 text-primary" />
                    <span className="font-semibold text-[var(--text-primary)]">Email:</span>
                    <a href={`mailto:${cta.email}`} className="text-primary hover:underline">{cta.email}</a>
                  </div>
                )}
              </div>
            </div>
          </section>

          <div className="text-center text-xs text-[var(--text-secondary)]/75 pt-8 border-t border-slate-200">
            By continuing to use our platform, you acknowledge that you have read and understood our help guidelines.
          </div>
        </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}

export default HelpCenter;
