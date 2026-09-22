import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Award,
  Users,
  ShieldCheck,
  Sparkles,
  Building,
  CheckCircle2,
  Globe,
  TrendingUp
} from "lucide-react";
import MegaMenu from "../../components/layout/MegaMenu";
import PublicFooter from "../../components/layout/PublicFooter";
import { COMPANY_ABOUT_DATA } from "../../services/publicData";
import { Icons } from "../../utils/iconHelper";
import API from "../../services/api";

export default function AboutUs() {
  const [aboutData, setAboutData] = useState(COMPANY_ABOUT_DATA);

  useEffect(() => {
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
      <MegaMenu />

      <main className="flex-1 pt-16">
        {/* About Hero Header */}
        <section className="relative px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 min-h-[60vh] lg:min-h-screen flex items-center overflow-hidden bg-slate-50 border-b border-slate-200">

          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-12 items-center w-full relative z-10">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6">
              <span
                className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold border bg-indigo-50 text-indigo-700 border-indigo-200"
              >
                <Globe size={14} className="text-indigo-500" /> Global IT & Engineering Consultancy
              </span>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold font-display leading-tight tracking-tight text-slate-900">
                {aboutData.title}
              </h1>

              <p className="text-base sm:text-lg leading-relaxed max-w-2xl text-slate-600">
                {aboutData.subtitle}
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  to="/services"
                  className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-lg transition-all flex items-center gap-2"
                >
                  Explore Our Services <ArrowRight size={16} />
                </Link>
                <Link
                  to="/contact"
                  className="px-6 py-3.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-bold rounded-xl transition-all flex items-center gap-2"
                >
                  Get in Touch
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
                  <Globe size={16} className="text-indigo-500" /> 35+ Countries Served
                </span>
              </div>
            </div>

            {/* Right Highlights Column */}
            <div className="lg:col-span-5 space-y-4">
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600 shrink-0">
                    <Building size={20} />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 font-display">Our Mission</h3>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {aboutData.mission || "To empower global enterprises with transformative IT solutions that drive operational excellence, accelerate digital innovation, and deliver measurable business outcomes."}
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600 shrink-0">
                    <TrendingUp size={20} />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 font-display">Global Reach</h3>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Offices across North America, Europe, and Asia-Pacific with 150+ certified engineers delivering 24/7 enterprise support and managed services.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-amber-50 text-amber-600 shrink-0">
                    <Award size={20} />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 font-display">Recognized Excellence</h3>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  AWS Advanced Partner, Microsoft Gold Partner, and Google Cloud Partner with industry recognition for cloud transformation and cybersecurity.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Global Impact Stats Counter */}
        <section className="py-12 bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {aboutData.stats?.map((stat, idx) => (
              <div key={idx} className="p-6 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-3xl sm:text-4xl font-extrabold font-display text-indigo-600 block mb-1">
                  {stat.value}
                </span>
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Corporate Mission & Vision */}
        <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-8 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Building size={24} />
            </div>
            <h2 className="text-2xl font-bold font-display text-slate-900">
              Corporate Mission
            </h2>
            <p className="text-sm text-slate-700 leading-relaxed">
              {aboutData.mission}
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Award size={24} />
            </div>
            <h2 className="text-2xl font-bold font-display text-slate-900">
              Corporate Vision
            </h2>
            <p className="text-sm text-slate-700 leading-relaxed">
              {aboutData.vision}
            </p>
          </div>
        </section>

        {/* Core Engineering Values */}
        <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 bg-slate-50 border-y border-slate-200">
          <div className="max-w-7xl mx-auto space-y-12">
            <div className="text-center space-y-3">
              <span className="text-xs font-extrabold uppercase tracking-widest text-indigo-600 font-display">
                Guiding Principles
              </span>
              <h2 className="text-3xl font-extrabold font-display text-slate-900">
                Core Engineering Values
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {aboutData.coreValues?.map((val, idx) => (
                <div key={idx} className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                  <div className="p-2 w-fit rounded-lg bg-emerald-100 text-emerald-700">
                    <CheckCircle2 size={20} />
                  </div>
                  <h3 className="text-base font-bold font-display text-slate-900">
                    {val.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {val.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Growth & Corporate Milestones */}
        <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <span className="text-xs font-extrabold uppercase tracking-widest text-indigo-600 font-display">
              Corporate Evolution
            </span>
            <h2 className="text-3xl font-extrabold font-display text-slate-900">
              Milestones & Growth Journey
            </h2>
          </div>

          <div className="space-y-6 relative before:absolute before:inset-0 before:left-4 before:md:left-1/2 before:w-0.5 before:bg-slate-200">
            {aboutData.milestones?.map((ms, idx) => (
              <div key={idx} className="flex flex-col md:flex-row items-start gap-6 relative">
                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0 z-10">
                  {ms.year.slice(-2)}
                </div>
                <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs flex-1 space-y-1">
                  <span className="text-xs font-bold text-indigo-600 font-display">{ms.year}</span>
                  <h3 className="text-base font-bold text-slate-900 font-display">{ms.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{ms.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Contact Call to Action */}
        <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 bg-indigo-50/70 border-y border-indigo-100 text-center">
          <div className="max-w-4xl mx-auto space-y-6">
            <h2 className="text-3xl font-extrabold font-display text-slate-900">
              Partner With a Proven Enterprise Technology Leader
            </h2>
            <p className="text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Discover how our IT consultants and software engineering teams can accelerate your organization's digital roadmap.
            </p>
            <Link
              to="/contact"
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-lg transition-all inline-flex items-center gap-2"
            >
              Get in Touch <ArrowRight size={14} />
            </Link>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
