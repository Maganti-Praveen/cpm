import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  Layers,
  ArrowLeft,
  Mail,
  Building,
  Globe,
  TrendingUp
} from "lucide-react";
import MegaMenu from "../../components/layout/MegaMenu";
import PublicFooter from "../../components/layout/PublicFooter";
import { ENTERPRISE_CASE_STUDIES } from "../../services/publicData";
import { Icons } from "../../utils/iconHelper";
import API from "../../services/api";
import OptimizedImage from "../../components/common/OptimizedImage";

export default function CaseStudyDetail() {
  const { slug } = useParams();
  const [projects, setProjects] = useState(ENTERPRISE_CASE_STUDIES);

  useEffect(() => {
    API.get("/public/case-studies")
      .then((res) => {
        if (res.data?.success && res.data.data?.length > 0) {
          setProjects(res.data.data.filter((p) => p.isActive));
        }
      })
      .catch(() => {});
  }, []);

  const project = projects.find((p) => p.slug === slug);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  if (!project) {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--page-bg, #F8FAFC)" }}>
        <MegaMenu />
        <div className="flex-1 flex flex-col items-center justify-center pt-24 text-center px-4">
          <h2 className="text-2xl font-bold font-display text-slate-900">Project Not Found</h2>
          <p className="text-xs text-slate-500 mt-2 mb-6">The requested case study could not be located.</p>
          <Link
            to="/case-studies"
            className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg flex items-center gap-2"
          >
            <ArrowLeft size={14} /> Back to All Projects
          </Link>
        </div>
        <PublicFooter />
      </div>
    );
  }

  const IconComponent = Icons[project.icon] || Layers;
  const relatedProjects = projects.filter((p) => p.slug !== slug).slice(0, 3);

  return (
    <div className="min-h-screen font-body flex flex-col" style={{ backgroundColor: "var(--page-bg, #F8FAFC)", color: "var(--page-text, #0F172A)" }}>
      <MegaMenu />

      <main className="flex-1 pt-16">
        {/* Project Hero Header */}
        <section className="relative px-4 sm:px-6 lg:px-8 pt-8 pb-12 sm:pb-16 overflow-hidden bg-slate-50 border-b border-slate-200">
          <div className="max-w-7xl mx-auto space-y-6 relative z-10">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <Link to="/" className="hover:text-indigo-600 transition-colors text-slate-500">Home</Link>
              <ChevronRight size={12} className="text-slate-400" />
              <Link to="/case-studies" className="hover:text-indigo-600 transition-colors text-slate-500">Projects</Link>
              <ChevronRight size={12} className="text-slate-400" />
              <span className="font-bold text-slate-900 truncate max-w-[250px]">{project.title}</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-2">
              <div className="lg:col-span-8 space-y-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border bg-indigo-50 text-indigo-700 border-indigo-200">
                    <IconComponent size={16} className="text-indigo-500" /> Case Study
                  </span>
                  {project.industry && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border bg-slate-100 text-slate-600 border-slate-200">
                      <Building size={12} /> {project.industry}
                    </span>
                  )}
                </div>

                <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-extrabold font-display leading-tight text-slate-900">
                  {project.title}
                </h1>

                <p className="text-base sm:text-lg leading-relaxed text-slate-600 max-w-2xl">
                  {project.subtitle}
                </p>

                {project.clientName && (
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <Globe size={14} className="text-indigo-500" /> Client: <span className="text-slate-700">{project.clientName}</span>
                  </div>
                )}

                {/* Key Results */}
                {project.keyResults && project.keyResults.length > 0 && (
                  <div className="flex flex-wrap gap-2.5 pt-2">
                    {project.keyResults.slice(0, 4).map((result, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 shadow-xs">
                        <CheckCircle2 size={14} className="text-emerald-500" /> {result}
                      </span>
                    ))}
                  </div>
                )}

                {/* Technology Tags */}
                {project.technologiesUsed && project.technologiesUsed.length > 0 && (
                  <div className="pt-4 border-t border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Technologies Used</span>
                    <div className="flex flex-wrap gap-2">
                      {project.technologiesUsed.map((tech, idx) => (
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
                <div className="p-6 rounded-2xl border bg-white shadow-lg space-y-4 border-slate-200 lg:sticky top-24">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                    Discuss This Project
                  </h4>
                  <p className="text-xs leading-relaxed text-slate-600">
                    Interested in achieving similar results for your organization? Talk to our senior architects.
                  </p>
                  <Link
                    to="/contact"
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Mail size={14} /> Get in Touch
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Project Image */}
        {project.image && (
          <section className="bg-white border-b border-slate-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <OptimizedImage
                src={project.image}
                alt={project.title}
                className="mx-auto block max-w-full h-auto max-h-[600px] object-contain rounded-2xl border border-slate-200 shadow-sm"
              />
            </div>
          </section>
        )}

        {/* Detailed Overview */}
        <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-6">
              <h2 className="text-xl sm:text-2xl font-extrabold font-display text-slate-900">Project Overview</h2>
              <div className="text-sm leading-relaxed text-slate-600 whitespace-pre-line">
                {project.fullDescription}
              </div>
            </div>

            {/* All Key Results */}
            {project.keyResults && project.keyResults.length > 0 && (
              <div className="lg:col-span-4">
                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                  <h3 className="text-sm font-bold font-display text-slate-900 flex items-center gap-2">
                    <TrendingUp size={16} className="text-indigo-500" /> Key Results
                  </h3>
                  <div className="space-y-3">
                    {project.keyResults.map((result, idx) => (
                      <div key={idx} className="flex items-start gap-2.5">
                        <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                        <span className="text-xs text-slate-700 leading-relaxed font-medium">{result}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Related Projects */}
        {relatedProjects.length > 0 && (
          <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 bg-slate-50">
            <div className="max-w-7xl mx-auto">
              <h2 className="text-xl sm:text-2xl font-extrabold font-display text-slate-900 mb-8">More Projects</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {relatedProjects.map((rp) => {
                  const RpIcon = Icons[rp.icon] || Layers;
                  return (
                    <Link
                      key={rp.slug || rp.id}
                      to={`/case-studies/${rp.slug}`}
                      className="group p-5 rounded-2xl border border-slate-200 bg-white hover:shadow-md hover:border-indigo-200 transition-all"
                    >
                      {rp.image && (
                        <OptimizedImage
                          src={rp.image}
                          alt={rp.title}
                          className="w-full h-full group-hover:scale-105 transition-transform duration-500"
                          wrapperClassName="h-36 rounded-xl overflow-hidden mb-4 bg-slate-100"
                        />
                      )}
                      <div className="flex items-center gap-2 mb-2">
                        <div className="p-1 rounded bg-indigo-50 text-indigo-500">
                          <RpIcon size={14} />
                        </div>
                        {rp.industry && (
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{rp.industry}</span>
                        )}
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 font-display group-hover:text-indigo-600 transition-colors line-clamp-2 mb-1.5">
                        {rp.title}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{rp.shortDescription}</p>
                      <span className="inline-flex items-center gap-1 mt-3 text-xs font-bold text-indigo-600 group-hover:gap-2 transition-all">
                        View Project <ArrowRight size={12} />
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        )}
      </main>

      <PublicFooter />
    </div>
  );
}
