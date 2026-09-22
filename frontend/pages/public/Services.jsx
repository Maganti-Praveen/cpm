import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  Layers,
  Sparkles,
  Search,
  ShieldCheck,
  Cpu,
  Cloud,
  Code2,
  TrendingUp,
  Server
} from "lucide-react";
import MegaMenu from "../../components/layout/MegaMenu";
import PublicFooter from "../../components/layout/PublicFooter";
import { ENTERPRISE_SERVICES } from "../../services/publicData";
import { Icons } from "../../utils/iconHelper";
import API from "../../services/api";
import OptimizedImage from "../../components/common/OptimizedImage";

export default function Services() {
  const [searchQuery, setSearchQuery] = useState("");
  const [services, setServices] = useState(ENTERPRISE_SERVICES);

  useEffect(() => {
    API.get("/public/services")
      .then((res) => {
        if (res.data?.success && res.data.data?.length > 0) {
          setServices(res.data.data.filter((s) => s.isActive));
        }
      })
      .catch(() => {});
  }, []);

  const filteredServices = services.filter((srv) => {
    const query = searchQuery.toLowerCase();
    return (
      srv.title.toLowerCase().includes(query) ||
      srv.shortDescription.toLowerCase().includes(query) ||
      srv.keyCapabilities.some((c) => c.toLowerCase().includes(query))
    );
  });

  return (
    <div className="min-h-screen font-body flex flex-col" style={{ backgroundColor: "var(--page-bg, #F8FAFC)", color: "var(--page-text, #0F172A)" }}>
      <MegaMenu />

      <main className="flex-1 pt-16">
        {/* Services Hero Header */}
        <section className="relative px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 min-h-[60vh] lg:min-h-screen flex items-center overflow-hidden bg-slate-50 border-b border-slate-200">
          
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-12 items-center w-full relative z-10">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6">
              <span
                className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold border bg-indigo-50 text-indigo-700 border-indigo-200"
              >
                <Sparkles size={14} className="text-indigo-500" /> Enterprise Technology Offerings
              </span>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold font-display leading-tight tracking-tight text-slate-900">
                Transformative IT Services & Engineering Capabilities
              </h1>

              <p className="text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed">
                We empower global enterprises with cloud transformation, custom software engineering, generative AI, cybersecurity, and managed IT operations.
              </p>

              {/* Search Filter Bar */}
              <div className="max-w-lg pt-2">
                <div className="relative">
                  <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search IT services, capabilities, technologies..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-12 pl-11 pr-4 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-sm"
                  />
                </div>
              </div>

              {/* Trust Badges */}
              <div className="pt-6 border-t border-slate-200 flex flex-wrap items-center gap-6 text-xs text-slate-600">
                <span className="flex items-center gap-1.5 font-semibold">
                  <ShieldCheck size={16} className="text-emerald-500" /> Enterprise-Grade Security
                </span>
                <span className="flex items-center gap-1.5 font-semibold">
                  <Cloud size={16} className="text-indigo-500" /> Multi-Cloud Architecture
                </span>
                <span className="flex items-center gap-1.5 font-semibold">
                  <Cpu size={16} className="text-indigo-500" /> AI & ML Powered
                </span>
              </div>
            </div>

            {/* Right Quick Stats */}
            <div className="lg:col-span-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
                  <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 w-fit mb-2">
                    <Layers size={18} />
                  </div>
                  <span className="text-2xl font-extrabold font-display text-slate-900 block">{ENTERPRISE_SERVICES.length}+</span>
                  <span className="text-xs text-slate-500 font-medium">Service Practices</span>
                </div>
                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
                  <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 w-fit mb-2">
                    <CheckCircle2 size={18} />
                  </div>
                  <span className="text-2xl font-extrabold font-display text-slate-900 block">250+</span>
                  <span className="text-xs text-slate-500 font-medium">Projects Delivered</span>
                </div>
                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
                  <div className="p-2 rounded-lg bg-amber-50 text-amber-600 w-fit mb-2">
                    <TrendingUp size={18} />
                  </div>
                  <span className="text-2xl font-extrabold font-display text-slate-900 block">99.99%</span>
                  <span className="text-xs text-slate-500 font-medium">Uptime SLA</span>
                </div>
                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
                  <div className="p-2 rounded-lg bg-sky-50 text-sky-600 w-fit mb-2">
                    <Server size={18} />
                  </div>
                  <span className="text-2xl font-extrabold font-display text-slate-900 block">24/7</span>
                  <span className="text-xs text-slate-500 font-medium">Managed Operations</span>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-indigo-50 border border-indigo-100 space-y-2">
                <h4 className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Technology Ecosystem</h4>
                <p className="text-[11px] text-indigo-600 leading-relaxed">
                  AWS, Azure, GCP, Kubernetes, Terraform, React, Node.js, Python, PyTorch, Splunk, PostgreSQL, Docker, Jenkins.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Services Directory Grid */}
        <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto space-y-12">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-6">
              <div>
                <h2 className="text-2xl font-bold font-display text-slate-900">
                  Our Service Portfolio
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Showing {filteredServices.length} of {services.length} specialized IT practice areas
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {filteredServices.map((srv) => {
                const IconComp = Icons[srv.icon] || Layers;
                return (
                  <div
                    key={srv.id}
                    className="rounded-2xl border bg-white shadow-xs hover:shadow-md transition-all duration-300 flex flex-col sm:flex-row items-start p-5 gap-6 group border-slate-200"
                  >
                    {/* Service Thumbnail Image & Icon */}
                    <div className="relative w-full sm:w-48 h-32 flex-shrink-0">
                      <OptimizedImage
                        src={srv.image}
                        alt={srv.title}
                        className="w-full h-full group-hover:scale-105 transition-transform duration-500 opacity-90"
                        wrapperClassName="w-full h-full rounded-xl bg-slate-900 shadow-xs border border-slate-100"
                      />
                      <div className="absolute inset-0 bg-slate-950/10 pointer-events-none"></div>
                      
                      <div className="absolute top-3 left-3 p-2 rounded-lg bg-white/90 backdrop-blur-md text-indigo-600 shadow-sm border border-slate-100 z-10 pointer-events-none">
                        <IconComp size={16} />
                      </div>
                    </div>

                    {/* Content Column */}
                    <div className="flex-1 flex flex-col justify-between self-stretch">
                      <div className="space-y-2">
                        <h3 className="text-base font-bold font-display text-slate-900 group-hover:text-indigo-600 transition-colors leading-snug">
                          {srv.title}
                        </h3>

                        <p className="text-xs text-slate-600 leading-relaxed">
                          {srv.shortDescription}
                        </p>

                        {/* Capabilities Pills */}
                        <div className="pt-1 flex flex-wrap gap-1.5">
                          {srv.keyCapabilities.slice(0, 3).map((cap, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 text-[10px] font-semibold bg-slate-100 text-slate-700 rounded border border-slate-200"
                            >
                              {cap}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Card Footer Button */}
                      <div className="pt-3 border-t border-slate-100 mt-4 flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400">
                          {srv.techStack.length}+ Technologies
                        </span>

                        <Link
                          to={`/services/${srv.slug}`}
                          className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-all inline-flex items-center gap-1"
                        >
                          Explore Service <ArrowRight size={13} />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Enterprise Call-to-Action Section */}
        <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 bg-indigo-50/70 border-y border-indigo-100">
          <div className="max-w-5xl mx-auto text-center space-y-6 relative z-10">
            <h2 className="text-3xl font-extrabold font-display text-slate-900">
              Ready to Architect Your Enterprise Digital Future?
            </h2>
            <p className="text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Connect with our IT principal architects to evaluate your architecture, discuss custom engineering requirements, or request a service proposal.
            </p>
            <div className="pt-2 flex justify-center gap-4">
              <Link
                to="/contact"
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-lg transition-all inline-flex items-center gap-2"
              >
                Schedule Architecture Consultation <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
