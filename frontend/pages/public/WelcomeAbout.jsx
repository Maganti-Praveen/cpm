// Welcome section detailing company descriptions and service features.
// Feeds information blocks.


import React from "react";
import { useCmsSettings } from "../../context/CmsSettingsContext";
import { Icons } from "../../utils/iconHelper";

export default function WelcomeAbout() {
  const cms = useCmsSettings();
  const about = cms.welcome?.about || {};

  // Configures landing info cards mapping keys to roles
  const cards = [
    { title: about.card1_title || "Administrator", description: about.card1_description || "Manage users, configure settings, view reports, and oversee all projects and billing.", icon: about.card1_icon || "ShieldCheck" },
    { title: about.card2_title || "Team Member", description: about.card2_description || "View assigned tasks, update progress, upload documents, and coordinate with team and clients.", icon: about.card2_icon || "UserCheck" },
    { title: about.card3_title || "Client", description: about.card3_description || "Track project progress, download deliverables, pay invoices, and raise support tickets.", icon: about.card3_icon || "User" }
  ];

  return (
    <section id="about" className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 border-t" style={{ backgroundColor: "var(--page-bg, #F8FAFC)", borderColor: "var(--border-color, #E2E8F0)" }} aria-labelledby="about-heading">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 id="about-heading" className="text-3xl font-bold font-display mb-2" style={{ color: "var(--page-text, #0F172A)" }}>
            {about.title || "About"}
          </h2>
          <p className="text-sm font-semibold tracking-wider uppercase mb-1 font-display" style={{ color: "var(--primary-btn, #4F46E5)" }}>
            {about.badge || "Built for Every Role"}
          </p>
          <p className="text-sm max-w-2xl mx-auto" style={{ color: "var(--text-secondary, #475569)" }}>
            {about.subtitle || "Three separate dashboards so everyone sees exactly what they need."}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cards.map((card, idx) => {
            const Icon = Icons[card.icon] || Icons.HelpCircle;
            return (
              <div key={idx} className="border p-6 rounded-xl shadow-sm flex flex-col items-start text-left" style={{ backgroundColor: "var(--card-bg, #FFFFFF)", borderColor: "var(--border-color, #E2E8F0)" }}>
                <div className="w-12 h-12 rounded-lg text-white flex items-center justify-center mb-4 shadow-sm" style={{ backgroundColor: "var(--primary-btn, #4F46E5)" }} aria-hidden="true">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold mb-2 font-display" style={{ color: "var(--card-text, #0F172A)" }}>{card.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary, #475569)" }}>
                  {card.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
