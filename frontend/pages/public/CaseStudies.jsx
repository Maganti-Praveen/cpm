import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Search,
  Sparkles,
  CheckCircle2,
  Briefcase,
  Globe,
  Award,
  TrendingUp,
  Building,
  ShieldCheck
} from "lucide-react";
import MegaMenu from "../../components/layout/MegaMenu";
import PublicFooter from "../../components/layout/PublicFooter";
import { ENTERPRISE_CASE_STUDIES } from "../../services/publicData";
import { Icons } from "../../utils/iconHelper";
import API from "../../services/api";
import OptimizedImage from "../../components/common/OptimizedImage";

export default function CaseStudies() {
  const [searchQuery, setSearchQuery] = useState("");
  const [projects, setProjects] = useState(ENTERPRISE_CASE_STUDIES);
  const [selectedIndustry, setSelectedIndustry] = useState("All");

  useEffect(() => {
    API.get("/public/case-studies")
      .then((res) => {
        if (res.data?.success && res.data.data?.length > 0) {
          setProjects(res.data.data.filter((p) => p.isActive));
        }
      })
      .catch(() => {});
  }, []);

  const industries = ["All", ...Array.from(new Set(projects.map((p) => p.industry).filter(Boolean)))];

  const filteredProjects = projects.filter((proj) => {
    const matchesIndustry = selectedIndustry === "All" || proj.industry === selectedIndustry;
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      proj.title.toLowerCase().includes(query) ||
      proj.shortDescription.toLowerCase().includes(query) ||
      (proj.industry || "").toLowerCase().includes(query) ||
      (proj.clientName || "").toLowerCase().includes(query);
    return matchesIndustry && matchesSearch;
  });

  return (
    <div className="min-h-screen font-body flex flex-col" style={{ backgroundColor: "var(--page-bg, #F8FAFC)", color: "var(--page-text, #0F172A)" }}>
      <MegaMenu />

      <main className="flex-1 pt-16">
        {/* Projects Hero */}
        <section className="relative px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 min-h-[60vh] lg:min-h-screen flex items-center overflow-hidden bg-slate-50 border-b border-slate-200">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-12 items-center w-full relative z-10">
            {/* Left Content */}
            <div className="md:col-span-1 lg:col-span-7 space-y-6">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold border bg-indigo-50 text-indigo-700 border-indigo-200">
                <Sparkles size={14} className="text-indigo-500" /> Our Project Portfolio
              </span>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold font-display leading-tight tracking-tight text-slate-900">
                Proven Results Across Industries
              </h1>

              <p className="text-base sm:text-lg leading-relaxed max-w-2xl text-slate-600">
                Explore our portfolio of enterprise-grade projects delivering measurable business impact — from cloud migrations and AI platforms to cybersecurity frameworks and ERP modernizations.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  to="/contact"
                  className="w-full sm:w-auto px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  Discuss Your Project <ArrowRight size={16} />
                </Link>
                <Link
                  to="/services"
                  className="w-full sm:w-auto px-6 py-3.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  View Our Services
                </Link>
              </div>

              {/* Trust Badges */}
              <div className="pt-6 border-t border-slate-200 flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-slate-600">
                <span className="flex items-center gap-1.5 font-semibold">
                  <Award size={16} className="text-indigo-500" /> {projects.length}+ Projects Delivered
                </span>
                <span className="flex items-center gap-1.5 font-semibold">
                  <Globe size={16} className="text-emerald-500" /> {industries.length - 1} Industries Served
                </span>
                <span className="flex items-center gap-1.5 font-semibold">
                  <TrendingUp size={16} className="text-indigo-500" /> 98% Client Satisfaction
                </span>
              </div>
            </div>

            {/* Right Stats Column */}
            <div className="md:col-span-1 lg:col-span-5 grid grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm text-center">
                <span className="text-2xl font-extrabold font-display text-slate-900 block">{projects.length}+</span>
                <span className="text-[11px] font-semibold text-slate-500 block mt-1">Projects Completed</span>
              </div>
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm text-center">
                <span className="text-2xl font-extrabold font-display text-slate-900 block">{industries.length - 1}+</span>
                <span className="text-[11px] font-semibold text-slate-500 block mt-1">Industry Verticals</span>
              </div>
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm text-center">
                <span className="text-2xl font-extrabold font-display text-slate-900 block">35+</span>
                <span className="text-[11px] font-semibold text-slate-500 block mt-1">Countries Served</span>
              </div>
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm text-center">
                <span className="text-2xl font-extrabold font-display text-slate-900 block">98%</span>
                <span className="text-[11px] font-semibold text-slate-500 block mt-1">Client Retention</span>
              </div>
            </div>
          </div>
        </section>

        {/* Search & Filters */}
        <section className="py-8 bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="relative w-full sm:max-w-xs">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 h-11 text-xs border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {industries.map((ind) => (
                <button
                  key={ind}
                  onClick={() => setSelectedIndustry(ind)}
                  className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-all ${
                    selectedIndustry === ind
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300"
                  }`}
                >
                  {ind}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Projects Grid */}
        <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
              {filteredProjects.map((proj) => {
                const IconComponent = Icons[proj.icon] || Briefcase;
                return (
                  <Link
                    key={proj.slug || proj.id}
                    to={`/case-studies/${proj.slug}`}
                    className="group flex flex-col sm:flex-row rounded-2xl border border-slate-200 overflow-hidden bg-white hover:shadow-lg hover:border-indigo-200 transition-all duration-300"
                  >
                    {/* Project Image Thumbnail */}
                    {proj.image && (
                      <div className="relative w-full sm:w-48 h-40 sm:h-auto flex-shrink-0 bg-slate-50/50 border-b sm:border-b-0 sm:border-r border-slate-100 flex items-center justify-center p-4">
                        <div className="w-full h-full sm:w-40 sm:h-28 overflow-hidden rounded-xl border border-slate-200 shadow-sm relative">
                          <OptimizedImage
                            src={proj.image}
                            alt={proj.title}
                            className="w-full h-full group-hover:scale-105 transition-transform duration-500"
                            wrapperClassName="w-full h-full"
                          />
                        </div>
                        {proj.industry && (
                          <span className="absolute top-2 left-2 px-2 py-0.5 bg-white/95 backdrop-blur-sm border border-slate-200 rounded-full text-[9px] font-bold text-slate-700 uppercase tracking-wider z-10 pointer-events-none">
                            {proj.industry}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Project Content */}
                    <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2.5">
                          <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                            <IconComponent size={14} />
                          </div>
                          {proj.clientName && (
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{proj.clientName}</span>
                          )}
                        </div>

                        <h3 className="text-base sm:text-lg font-bold text-slate-900 font-display group-hover:text-indigo-600 transition-colors line-clamp-1 mb-2">
                          {proj.title}
                        </h3>

                        <p className="text-xs text-slate-600 leading-relaxed line-clamp-2 mb-3">
                          {proj.shortDescription}
                        </p>

                        {/* Key Results Preview */}
                        {proj.keyResults && proj.keyResults.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-3.5">
                            {proj.keyResults.slice(0, 2).map((result, idx) => (
                              <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-[10px] font-semibold text-emerald-700 border border-emerald-100">
                                <CheckCircle2 size={9} /> {result}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Tech Tags */}
                      {proj.technologiesUsed && proj.technologiesUsed.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-3 border-t border-slate-100">
                          {proj.technologiesUsed.slice(0, 4).map((tech, idx) => (
                            <span key={idx} className="px-2 py-0.5 rounded bg-slate-100 text-[10px] font-semibold text-slate-500">
                              {tech}
                            </span>
                          ))}
                          {proj.technologiesUsed.length > 4 && (
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-[10px] font-semibold text-slate-400">
                              +{proj.technologiesUsed.length - 4} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>

            {filteredProjects.length === 0 && (
              <div className="text-center py-16">
                <Briefcase size={40} className="mx-auto text-slate-300 mb-4" />
                <h3 className="text-lg font-bold text-slate-700 font-display">No projects found</h3>
                <p className="text-xs text-slate-500 mt-1">Try adjusting your search or filter criteria.</p>
              </div>
            )}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 bg-slate-50 border-t border-slate-200">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900">
              Ready to Start Your Next Project?
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed max-w-xl mx-auto">
              Let's discuss how our enterprise engineering team can deliver measurable results for your organization. Schedule a consultation with our senior architects.
            </p>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-lg transition-all"
            >
              Schedule a Consultation <ArrowRight size={18} />
            </Link>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
