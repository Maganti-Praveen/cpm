// Welcome section listing setup workflows and client registrations steps.
// Details setup guidelines.


import React from "react";
import { useCmsSettings } from "../../context/CmsSettingsContext";

export default function WelcomeWorkflow() {
  const cms = useCmsSettings();
  const workflow = cms.welcome?.workflow || {};
  const list = workflow.list || [];

  return (
    <section id="workflow" className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 border-t" style={{ backgroundColor: "var(--card-bg, #FFFFFF)", borderColor: "var(--border-color, #E2E8F0)" }} aria-labelledby="workflow-heading">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 id="workflow-heading" className="text-3xl font-bold font-display mb-2" style={{ color: "var(--page-text, #0F172A)" }}>
            {workflow.title || "Workflow"}
          </h2>
          <p className="text-sm font-semibold tracking-wider uppercase mb-1 font-display" style={{ color: "var(--primary-btn, #4F46E5)" }}>
            {workflow.badge || "How It Works"}
          </p>
          <p className="text-sm max-w-2xl mx-auto" style={{ color: "var(--text-secondary, #475569)" }}>
            {workflow.subtitle || "A simple five-step process from onboarding a client to closing out a project."}
          </p>
        </div>

        <div className="relative">
          <div className="hidden md:block absolute top-6 left-1/10 right-1/10 h-0.5 -z-10" style={{ backgroundColor: "var(--border-color, #E2E8F0)" }}></div>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
            {/* Renders sequential setup workflow step indicators */}
            {list.map((item, idx) => (
              <div key={idx} className="flex flex-col items-center text-center px-2">
                <div
                  className="w-12 h-12 rounded-full text-white flex items-center justify-center font-bold text-lg mb-4 shadow-sm z-10"
                  style={{ backgroundColor: "var(--primary-btn, #4F46E5)" }}
                >
                  {item.step || (idx + 1)}
                </div>
                <h3 className="text-base font-bold mb-2 font-display" style={{ color: "var(--page-text, #0F172A)" }}>{item.title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary, #475569)" }}>
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
