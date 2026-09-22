// Welcome section displaying dashboard layouts, files options, and helpdesk features.
// Displays visual assets.


import React from "react";
import { useCmsSettings } from "../../context/CmsSettingsContext";
import { Icons } from "../../utils/iconHelper";

export default function WelcomeFeatures() {
  const cms = useCmsSettings();
  const featuresSection = cms.welcome?.features || {};
  const list = featuresSection.list || [];

  return (
    <section id="features" className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 border-t" style={{ backgroundColor: "var(--card-bg, #FFFFFF)", borderColor: "var(--border-color, #E2E8F0)" }} aria-labelledby="features-heading">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 id="features-heading" className="text-3xl font-bold font-display" style={{ color: "var(--page-text, #0F172A)" }}>
            {featuresSection.title || "Features"}
          </h2>
          <p className="text-sm max-w-2xl mx-auto mt-2" style={{ color: "var(--text-secondary, #475569)" }}>
            {featuresSection.subtitle || "All the tools you need to run your projects and serve your clients."}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Maps landing page features to custom visual display blocks */}
          {list.map((feature, i) => {
            const Icon = Icons[feature.icon] || Icons.HelpCircle;
            return (
              <div key={i} className="p-6 rounded-xl transition-colors duration-300 group shadow-sm flex flex-col items-start text-left border" style={{ backgroundColor: "var(--page-bg, #F8FAFC)", borderColor: "var(--border-color, rgba(226,232,240,0.8))" }}>
                <div className="mb-4 group-hover:scale-105 transition-transform duration-300" style={{ color: "var(--primary-btn, #4F46E5)" }} aria-hidden="true">
                  <Icon className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold mb-2 font-display" style={{ color: "var(--card-text, #0F172A)" }}>{feature.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary, #475569)" }}>{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
