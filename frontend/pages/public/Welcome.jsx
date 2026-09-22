import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ShieldCheck,
  Globe,
  Sparkles,
  Award,
  Users,
  CheckCircle2,
  Layers,
  Cpu,
  Cloud,
  Code2,
  TrendingUp,
  Server,
  Building
} from "lucide-react";
import MegaMenu from "../../components/layout/MegaMenu";
import PublicFooter from "../../components/layout/PublicFooter";
import { ENTERPRISE_SERVICES, COMPANY_ABOUT_DATA, ENTERPRISE_CASE_STUDIES } from "../../services/publicData";
import { Icons } from "../../utils/iconHelper";
import API from "../../services/api";
import OptimizedImage from "../../components/common/OptimizedImage";

import { useCmsSettings } from "../../context/CmsSettingsContext";

function Welcome() {
  const [services, setServices] = useState(ENTERPRISE_SERVICES);
  const [caseStudies, setCaseStudies] = useState(ENTERPRISE_CASE_STUDIES);
  const [aboutData, setAboutData] = useState(COMPANY_ABOUT_DATA);
  const cms = useCmsSettings();

  const welcome = cms?.welcome || {};
  const hero = welcome.hero || {};
  const stats = welcome.stats || {};
  const cta = welcome.cta || {};

  const heroTitle = hero.title || "Accelerate Growth with Next-Gen IT Engineering & Cloud Innovation";
  const heroSubtitle = hero.subtitle || "We partner with global enterprises to architect scalable multi-cloud infrastructure, build mission-critical custom software platforms, deploy generative AI, and defend digital assets.";
  const heroButtonText = hero.buttonText || "Explore Services";

  const ctaTitle = cta.title || "Ready to Transform Your Corporate Technology Operations?";
  const ctaDescription = cta.description || "Connect with our enterprise solution architects to discuss your technical requirements or request a proposal.";
  const ctaButtonText = cta.buttonText || "Contact IT Sales & Engineering";

  const statsList = [
    { label: stats.stat1_title || "Global Projects Delivered", value: stats.stat1_value || "250+" },
    { label: stats.stat2_title || "Client Retention Rate", value: stats.stat2_value || "98%" },
    { label: stats.stat3_title || "Countries Served", value: stats.stat3_value || "35+" },
    { label: stats.stat4_title || "Dedicated IT Experts", value: stats.stat4_value || "150+" },
  ];

  useEffect(() => {
    API.get("/public/services")
      .then((res) => {
        if (res.data?.success && res.data.data?.length > 0) {
          setServices(res.data.data.filter((s) => s.isActive));
        }
      })
      .catch(() => {});

    API.get("/public/case-studies")
      .then((res) => {
        if (res.data?.success && res.data.data?.length > 0) {
          setCaseStudies(res.data.data.filter((cs) => cs.isActive));
        }
      })
      .catch(() => {});

    API.get("/public/about")
      .then((res) => {
        if (res.data?.success && res.data.data) {
          setAboutData(res.data.data);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen font-body flex flex-col" style={{ backgroundColor: "var(--page-bg, #F8FAFC)", color: "var(--page-text, #0F172A)" }}>
      {/* Header MegaMenu Navigation */}
      <MegaMenu />

      <main className="flex-1 pt-16">
        {/* Enterprise Hero Banner */}
        <section id="home" className="relative px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 min-h-[60vh] lg:min-h-screen flex items-center overflow-hidden bg-slate-50 border-b border-slate-200">

          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-12 items-center w-full relative z-10">
            {/* Left Content Column */}
            <div className="lg:col-span-7 space-y-6">
              <span
                className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold border bg-indigo-50 text-indigo-700 border-indigo-200"
              >
                <Sparkles size={14} className="text-indigo-500" /> Enterprise IT Services & Engineering Consultancy
              </span>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold font-display leading-tight tracking-tight text-slate-900">
                {heroTitle}
              </h1>

              <p className="text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed">
                {heroSubtitle}
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  to="/services"
                  className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-lg transition-all flex items-center gap-2"
                >
                  {heroButtonText} <ArrowRight size={16} />
                </Link>

                <Link
                  to="/contact"
                  className="px-6 py-3.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-bold rounded-xl transition-all flex items-center gap-2"
                >
                  Schedule Architecture Consultation
                </Link>
              </div>

              {/* Trust Badges */}
              <div className="pt-8 border-t border-slate-200 flex flex-wrap items-center gap-6 text-xs text-slate-600">
                <span className="flex items-center gap-1.5 font-semibold">
                  <ShieldCheck size={16} className="text-emerald-500" /> SOC 2 Type II Certified
                </span>
                <span className="flex items-center gap-1.5 font-semibold">
                  <Award size={16} className="text-indigo-500" /> ISO 27001 Accredited
                </span>
                <span className="flex items-center gap-1.5 font-semibold">
                  <Globe size={16} className="text-indigo-500" /> Global 24/7 Delivery
                </span>
              </div>
            </div>

            {/* Right Overview Card Column */}
            <div className="lg:col-span-5">
              <div
                className="p-8 rounded-2xl border bg-white shadow-lg space-y-6 border-slate-200"
              >
                <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2">
                    <Building size={20} className="text-indigo-600" />
                    <span className="text-sm font-bold font-display text-slate-900">
                      {stats.title || "Global Practice Overview"}
                    </span>
                  </div>
                  <span
                    className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200"
                  >
                    Live SLAs
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {statsList.map((stat, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl border border-slate-100 bg-slate-50 space-y-1"
                    >
                      <span className="text-xs block font-medium text-slate-500">{stat.label}</span>
                      <span className="text-2xl font-extrabold font-display text-slate-900">{stat.value}</span>
                    </div>
                  ))}
                </div>

                <div
                  className="p-4 rounded-xl border border-indigo-100 bg-indigo-50 space-y-2"
                >
                  <h4 className="text-xs font-bold text-indigo-700">Enterprise Technology Ecosystem</h4>
                  <p className="text-[11px] leading-relaxed text-indigo-600">
                    AWS, Azure, GCP, Kubernetes, Terraform, React, Node.js, Python, PyTorch, Splunk, PostgreSQL.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Enterprise Services Teaser Section */}
        <section id="services" className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <span className="text-xs font-extrabold uppercase tracking-widest text-indigo-600 font-display">
              Core Engineering Practices
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold font-display text-slate-900">
              Enterprise Technology Offerings
            </h2>
            <p className="text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Tailored technology solutions designed for speed, resilience, and business scalability.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {services.slice(0, 6).map((srv) => {
              const IconComp = Icons[srv.icon] || Layers;
              return (
                <div
                  key={srv.id}
                  className="rounded-2xl border bg-white shadow-xs hover:shadow-md transition-all duration-300 flex flex-col sm:flex-row items-start p-5 gap-6 group border-slate-200"
                >
                  {/* Service Thumbnail Image & Icon */}
                  {srv.image && (
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
                  )}

                  <div className="flex-1 flex flex-col justify-between self-stretch">
                    <div className="space-y-2">
                      <h3 className="text-base font-bold font-display text-slate-900 group-hover:text-indigo-600 transition-colors leading-snug">
                        {srv.title}
                      </h3>

                      <p className="text-xs text-slate-600 leading-relaxed">
                        {srv.shortDescription}
                      </p>

                      <div className="pt-1 flex flex-wrap gap-1.5">
                        {srv.keyCapabilities.slice(0, 3).map((cap, i) => (
                          <span key={i} className="px-2 py-0.5 text-[10px] font-semibold bg-slate-100 text-slate-700 rounded border border-slate-200">
                            {cap}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 mt-4 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400">Enterprise SLA</span>
                      <Link
                        to={`/services/${srv.slug}`}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors inline-flex items-center gap-1"
                      >
                        View Details <ArrowRight size={13} />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-center pt-4">
            <Link
              to="/services"
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all inline-flex items-center gap-2"
            >
              View Full Service Portfolio <ArrowRight size={14} />
            </Link>
          </div>
        </section>

        {/* Enterprise About Us Teaser */}
        <section id="about" className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 bg-slate-50 border-y border-slate-200">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <span className="text-xs font-extrabold uppercase tracking-widest text-indigo-600 font-display">
                About Sai IT Services
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold font-display text-slate-900 leading-tight">
                {aboutData.title}
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                {aboutData.subtitle}
              </p>

              <div className="space-y-3 pt-2">
                {aboutData.coreValues?.slice(0, 3).map((val, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3.5 rounded-xl bg-white border border-slate-200">
                    <div className="p-1 rounded-md bg-emerald-100 text-emerald-700 mt-0.5">
                      <CheckCircle2 size={16} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 font-display">{val.title}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">{val.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <Link
                  to="/about"
                  className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors inline-flex items-center gap-2"
                >
                  Read Full Corporate Story <ArrowRight size={14} />
                </Link>
              </div>
            </div>

            {/* About Card Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <ShieldCheck size={20} />
                </div>
                <h3 className="text-sm font-bold font-display text-slate-900">Zero Trust Architecture</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Bank-grade encryption, identity access management, and SOC 2 Type II compliance standards.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Cpu size={20} />
                </div>
                <h3 className="text-sm font-bold font-display text-slate-900">AI & MLOps Practice</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Generative AI, custom LLMs, predictive forecasting, and automated data pipelines.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3 sm:col-span-2">
                <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Cloud size={20} />
                </div>
                <h3 className="text-sm font-bold font-display text-slate-900">Multi-Cloud Infrastructure</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Resilient cloud migrations across AWS, Azure, and Google Cloud with FinOps optimization.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Case Studies Section */}
        <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <span className="text-xs font-extrabold uppercase tracking-widest text-indigo-600 font-display">
              Enterprise Success Stories
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold font-display text-slate-900">
              Featured Case Studies & Projects
            </h2>
            <p className="text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Discover how we architected and deployed advanced engineering solutions for global enterprises.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {caseStudies.slice(0, 3).map((cs) => {
              const IconComp = Icons[cs.icon] || Layers;
              return (
                <Link
                  key={cs.id}
                  to={`/case-studies/${cs.slug}`}
                  className="rounded-2xl border bg-white shadow-xs hover:shadow-xl hover:border-indigo-200 transition-all duration-300 flex flex-col justify-between overflow-hidden group border-slate-200"
                >
                  <div>
                    {cs.image && (
                      <div className="relative h-48 bg-slate-50 flex items-center justify-center p-4 border-b border-slate-100">
                        <div className="w-full h-full max-w-[240px] max-h-[140px] overflow-hidden rounded-xl border border-slate-200 shadow-sm relative">
                          <OptimizedImage
                            src={cs.image}
                            alt={cs.title}
                            className="w-full h-full group-hover:scale-105 transition-transform duration-500"
                            wrapperClassName="w-full h-full"
                          />
                        </div>
                        <div className="absolute top-4 left-4 p-2 rounded-xl bg-white/95 backdrop-blur-md text-indigo-600 shadow-sm border border-slate-200/50 z-10 pointer-events-none">
                          <IconComp size={16} />
                        </div>
                      </div>
                    )}

                    <div className="p-6 space-y-3">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 text-[9px] font-bold bg-indigo-50 text-indigo-700 rounded uppercase tracking-wider">
                          {cs.industry || "Enterprise"}
                        </span>
                      </div>

                      <h3 className="text-base font-bold font-display text-slate-900 group-hover:text-indigo-600 transition-colors leading-snug">
                        {cs.title}
                      </h3>

                      <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                        {cs.shortDescription}
                      </p>
                    </div>
                  </div>

                  <div className="p-6 pt-0 border-t border-slate-100 mt-4 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400">
                      {cs.clientName || "Case Study"}
                    </span>
                    <span className="text-xs font-bold text-indigo-600 group-hover:text-indigo-800 transition-colors inline-flex items-center gap-1">
                      View Project <ArrowRight size={13} />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="text-center pt-4">
            <Link
              to="/case-studies"
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all inline-flex items-center gap-2"
            >
              Explore All Case Studies <ArrowRight size={14} />
            </Link>
          </div>
        </section>

        {/* Global CTA Section */}
        <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 bg-indigo-50/70 border-y border-indigo-100 text-center">
          <div className="max-w-4xl mx-auto space-y-6 relative z-10">
            <h2 className="text-3xl font-extrabold font-display text-slate-900">
              {ctaTitle}
            </h2>
            <p className="text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed">
              {ctaDescription}
            </p>
            <div className="flex justify-center gap-4 pt-2">
              <Link
                to="/contact"
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-lg transition-all inline-flex items-center gap-2"
              >
                {ctaButtonText} <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}

export default Welcome;
