import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  Layers,
  ShieldCheck,
  Building,
  ArrowLeft,
  Mail
} from "lucide-react";
import MegaMenu from "../../components/layout/MegaMenu";
import PublicFooter from "../../components/layout/PublicFooter";
import { ENTERPRISE_SERVICES } from "../../services/publicData";
import { Icons } from "../../utils/iconHelper";
import API from "../../services/api";
import OptimizedImage from "../../components/common/OptimizedImage";

export default function ServiceDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [services, setServices] = useState(ENTERPRISE_SERVICES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    setLoading(true);
    API.get("/public/services")
      .then((res) => {
        if (res.data?.success && res.data.data?.length > 0) {
          setServices(res.data.data.filter((s) => s.isActive));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  const service = services.find((s) => s.slug === slug);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--page-bg, #F8FAFC)" }}>
        <MegaMenu />
        <div className="flex-1 flex flex-col items-center justify-center pt-24 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
        <PublicFooter />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--page-bg, #F8FAFC)" }}>
        <MegaMenu />
        <div className="flex-1 flex flex-col items-center justify-center pt-24 text-center px-4">
          <h2 className="text-2xl font-bold font-display text-slate-900">Service Offering Not Found</h2>
          <p className="text-xs text-slate-500 mt-2 mb-6">The requested enterprise IT service area could not be located.</p>
          <Link
            to="/services"
            className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg flex items-center gap-2"
          >
            <ArrowLeft size={14} /> Back to All Services
          </Link>
        </div>
        <PublicFooter />
      </div>
    );
  }

  const IconComponent = Icons[service.icon] || Layers;
  const relatedServices = services.filter((s) => s.slug !== slug).slice(0, 3);

  return (
    <div className="min-h-screen font-body flex flex-col" style={{ backgroundColor: "var(--page-bg, #F8FAFC)", color: "var(--page-text, #0F172A)" }}>
      <MegaMenu />

      <main className="flex-1 pt-16">
        {/* Service Hero Header */}
        <section className="relative px-4 sm:px-6 lg:px-8 pt-8 pb-12 sm:pb-16 overflow-hidden bg-slate-50 border-b border-slate-200">
          <div className="max-w-7xl mx-auto space-y-6 relative z-10">
            {/* Breadcrumb Navigation */}
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <Link to="/" className="hover:text-indigo-600 transition-colors text-slate-500">Home</Link>
              <ChevronRight size={12} className="text-slate-400" />
              <Link to="/services" className="hover:text-indigo-600 transition-colors text-slate-500">Services</Link>
              <ChevronRight size={12} className="text-slate-400" />
              <span className="font-bold text-slate-900 truncate max-w-[250px]">{service.title}</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-2">
              <div className="lg:col-span-8 space-y-5">
                <div
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border bg-indigo-50 text-indigo-700 border-indigo-200"
                >
                  <IconComponent size={16} className="text-indigo-500" /> Enterprise IT Practice
                </div>

                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-display leading-tight text-slate-900">
                  {service.title}
                </h1>

                <p className="text-base sm:text-lg leading-relaxed text-slate-600 max-w-2xl">
                  {service.subtitle}
                </p>

                {/* Key Highlights */}
                {service.highlights && service.highlights.length > 0 && (
                  <div className="flex flex-wrap gap-3 pt-2">
                    {service.highlights.slice(0, 4).map((item, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 shadow-xs">
                        <CheckCircle2 size={14} className="text-emerald-500" /> {item}
                      </span>
                    ))}
                  </div>
                )}

                {/* Technology Tags */}
                {service.technologies && service.technologies.length > 0 && (
                  <div className="pt-4 border-t border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Technology Stack</span>
                    <div className="flex flex-wrap gap-2">
                      {service.technologies.map((tech, idx) => (
                        <span key={idx} className="px-2.5 py-1 rounded-md bg-slate-100 text-[11px] font-semibold text-slate-600 border border-slate-200">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Banner */}
              <div className="lg:col-span-4">
                <div
                  className="p-6 rounded-2xl border bg-white shadow-lg space-y-4 border-slate-200 lg:sticky top-24"
                >
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                    Request Service Scope
                  </h4>
                  <p className="text-xs leading-relaxed text-slate-600">
                    Need custom implementation for your infrastructure? Discuss with our senior architects.
                  </p>
                  <Link
                    to="/contact"
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Mail size={14} /> Request Proposal
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Detailed Service Content Grid */}
        <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12 sm:space-y-16">
          {/* Detailed Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
            <div className="lg:col-span-2 space-y-8">
              <div className="p-8 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-6">
                <h2 className="text-2xl font-bold font-display text-slate-900">
                  Practice Overview & Architecture
                </h2>
                <div className="flex flex-col md:flex-row gap-8 items-start">
                  <div className="flex-1">
                    <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                      {service.fullDescription}
                    </p>
                  </div>
                  {service.image && (
                    <OptimizedImage
                      src={service.image}
                      alt={service.title}
                      className="w-full h-full"
                      wrapperClassName="w-full md:w-48 h-32 rounded-xl border border-slate-200 shadow-sm flex-shrink-0"
                    />
                  )}
                </div>
              </div>

              {/* Key Capabilities */}
              <div className="p-8 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-6">
                <h2 className="text-xl font-bold font-display text-slate-900 flex items-center gap-2">
                  <Sparkles size={20} className="text-indigo-600" /> Core Capabilities & Deliverables
                </h2>

                <div className="grid grid-cols-1 gap-4">
                  {service.keyCapabilities.map((cap, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-150 flex items-start gap-3">
                      <div className="p-1 rounded-md bg-emerald-100 text-emerald-700 shrink-0 mt-0.5">
                        <CheckCircle2 size={16} />
                      </div>
                      <span className="text-xs font-bold text-slate-800 leading-relaxed">
                        {cap}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Enterprise Benefits */}
              <div className="p-8 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-6">
                <h2 className="text-xl font-bold font-display text-slate-900 flex items-center gap-2">
                  <ShieldCheck size={20} className="text-indigo-600" /> Business Benefits & Value Impact
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {service.benefits.map((benefit, idx) => (
                    <div key={idx} className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/50 space-y-1">
                      <span className="text-[10px] font-extrabold uppercase text-indigo-600 tracking-wider">
                        Impact Metric {idx + 1}
                      </span>
                      <p className="text-xs font-bold text-slate-900 leading-relaxed">
                        {benefit}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar Tech Stack & Quick Facts */}
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
                <h3 className="text-sm font-bold font-display text-slate-900 uppercase tracking-wider">
                  Technology Ecosystem
                </h3>

                <div className="flex flex-wrap gap-2 pt-2">
                  {service.techStack.map((tech, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              <div
                className="p-6 rounded-2xl border text-white space-y-4 shadow-md"
                style={{ backgroundColor: "#0f172a", borderColor: "#1e293b" }}
              >
                <h3 className="text-base font-bold font-display" style={{ color: "#ffffff" }}>
                  Enterprise SLA Commitment
                </h3>
                <p className="text-xs leading-relaxed" style={{ color: "#e2e8f0" }}>
                  All enterprise consulting engagements include dedicated project management, transparent milestones, and ISO/SOC 2 compliance protocols.
                </p>
                <Link
                  to="/contact"
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5"
                >
                  Contact IT Team <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>

          {/* Related Services */}
          <div className="pt-8 border-t border-slate-200 space-y-6">
            <h3 className="text-xl font-bold font-display text-slate-900">
              Related Enterprise Practice Areas
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedServices.map((rel) => (
                <Link
                  key={rel.id}
                  to={`/services/${rel.slug}`}
                  className="p-5 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 shadow-xs hover:shadow-md transition-all group flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <h4 className="text-sm font-bold font-display text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {rel.title}
                    </h4>
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {rel.shortDescription}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-indigo-600 mt-4 inline-flex items-center gap-1">
                    Learn More <ArrowRight size={13} />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
