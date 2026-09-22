import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Briefcase,
  MapPin,
  Clock,
  Award,
  Search,
  Filter,
  ArrowRight,
  CheckCircle2,
  X,
  Send,
  Mail,
  Sparkles,
  Users,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import MegaMenu from "../../components/layout/MegaMenu";
import PublicFooter from "../../components/layout/PublicFooter";
import { CAREER_OPENINGS } from "../../services/publicData";
import API from "../../services/api";

export default function Careers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("All");
  const [selectedJob, setSelectedJob] = useState(null);
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [jobs, setJobs] = useState(CAREER_OPENINGS);

  useEffect(() => {
    API.get("/public/careers")
      .then((res) => {
        if (res.data?.success && res.data.data?.length > 0) {
          setJobs(res.data.data.filter((j) => j.active));
        }
      })
      .catch(() => {});
  }, []);

  // Application Form State
  const [candidateName, setCandidateName] = useState("");
  const [candidateEmail, setCandidateEmail] = useState("");
  const [candidatePhone, setCandidatePhone] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [coverNote, setCoverNote] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // Departments list for filtering
  const departments = ["All", ...Array.from(new Set(jobs.map((j) => j.department)))];

  const filteredJobs = jobs.filter((job) => {
    const matchesDept = selectedDepartment === "All" || job.department === selectedDepartment;
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      job.title.toLowerCase().includes(query) ||
      job.department.toLowerCase().includes(query) ||
      job.location.toLowerCase().includes(query) ||
      job.description.toLowerCase().includes(query);
    return matchesDept && matchesSearch;
  });

  const openApplyModal = (job) => {
    setSelectedJob(job);
    setCandidateName("");
    setCandidateEmail("");
    setCandidatePhone("");
    setLinkedinUrl("");
    setCoverNote("");
    setSubmitted(false);
    setApplyModalOpen(true);
  };

  const handleApplySubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);

    // Build mailto link for direct mail fallback
    const subject = encodeURIComponent(`Application for ${selectedJob?.title} - ${candidateName}`);
    const body = encodeURIComponent(
      `Dear Hiring Team,\n\nI am applying for the ${selectedJob?.title} position.\n\nName: ${candidateName}\nEmail: ${candidateEmail}\nPhone: ${candidatePhone}\nLinkedIn/Portfolio: ${linkedinUrl}\n\nCover Note:\n${coverNote}\n\nThank you!`
    );
    const mailtoUrl = `mailto:${selectedJob?.contactEmail || "careers@saiitservices.com"}?subject=${subject}&body=${body}`;

    setTimeout(() => {
      window.location.href = mailtoUrl;
    }, 400);
  };

  return (
    <div className="min-h-screen font-body flex flex-col" style={{ backgroundColor: "var(--page-bg, #F8FAFC)", color: "var(--page-text, #0F172A)" }}>
      <MegaMenu />

      <main className="flex-1 pt-16">
        {/* Careers Hero Header */}
        <section className="relative px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 min-h-[60vh] lg:min-h-screen flex items-center overflow-hidden bg-slate-50 border-b border-slate-200">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-12 items-center w-full relative z-10">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6">
              <span
                className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold border bg-indigo-50 text-indigo-700 border-indigo-200"
              >
                <Sparkles size={14} className="text-indigo-500" /> Join Our Enterprise Team
              </span>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold font-display leading-tight tracking-tight text-slate-900">
                Shape the Future of Enterprise Technology
              </h1>

              <p className="text-base sm:text-lg leading-relaxed max-w-2xl text-slate-600">
                Work alongside world-class IT architects, software engineers, data scientists, and cybersecurity specialists building mission-critical solutions for global enterprises.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <a
                  href="#openings"
                  className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-lg transition-all flex items-center gap-2"
                >
                  View Open Positions <ArrowRight size={16} />
                </a>
                <Link
                  to="/contact"
                  className="px-6 py-3.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-bold rounded-xl transition-all flex items-center gap-2"
                >
                  <Mail size={14} /> Send Your Resume
                </Link>
              </div>

              {/* Quick Stats */}
              <div className="pt-6 border-t border-slate-200 flex flex-wrap items-center gap-6 text-xs text-slate-600">
                <span className="flex items-center gap-1.5 font-semibold">
                  <Briefcase size={16} className="text-indigo-500" /> {CAREER_OPENINGS.length} Open Positions
                </span>
                <span className="flex items-center gap-1.5 font-semibold">
                  <MapPin size={16} className="text-emerald-500" /> Remote & Hybrid Options
                </span>
                <span className="flex items-center gap-1.5 font-semibold">
                  <Users size={16} className="text-indigo-500" /> 150+ Team Members
                </span>
              </div>
            </div>

            {/* Right Highlights Column */}
            <div className="lg:col-span-5 space-y-4">
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-start gap-4">
                <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600 shrink-0">
                  <Users size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 font-display">Global Remote & Hybrid Flexibility</h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">Collaborate with high-impact distributed engineering teams across 35+ countries worldwide.</p>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-start gap-4">
                <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600 shrink-0">
                  <Award size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 font-display">Continuous Growth & Certification</h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">Full sponsorship for AWS, Azure, GCP, and security accreditations with dedicated learning time.</p>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-start gap-4">
                <div className="p-2.5 rounded-lg bg-amber-50 text-amber-600 shrink-0">
                  <Briefcase size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 font-display">Enterprise-Scale Projects</h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">Build systems used by Fortune 500 companies — cloud platforms, AI pipelines, and security infrastructure.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Culture & Benefits Highlights */}
        <section className="py-12 bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-4">
              <div className="p-3 rounded-lg bg-indigo-50 text-indigo-600 shrink-0">
                <Users size={22} />
              </div>
              <div>
                <h3 className="text-sm font-bold font-display text-slate-900">Global Remote & Hybrid Flexibility</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">Collaborate with high-impact distributed engineering teams worldwide.</p>
              </div>
            </div>

            <div className="p-6 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-4">
              <div className="p-3 rounded-lg bg-indigo-50 text-indigo-600 shrink-0">
                <Award size={22} />
              </div>
              <div>
                <h3 className="text-sm font-bold font-display text-slate-900">Continuous Growth & Certification</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">Full sponsorship for cloud (AWS/Azure) and security accreditations.</p>
              </div>
            </div>

            <div className="p-6 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-4">
              <div className="p-3 rounded-lg bg-indigo-50 text-indigo-600 shrink-0">
                <Briefcase size={22} />
              </div>
              <div>
                <h3 className="text-sm font-bold font-display text-slate-900">Fortune 500 Enterprise Impact</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">Build large-scale architectures supporting millions of concurrent users.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Job Listings Directory */}
        <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
            <div>
              <h2 className="text-2xl font-bold font-display text-slate-900">Open Opportunities</h2>
              <p className="text-xs text-slate-500 mt-1">Explore current career openings across our engineering and consulting practices.</p>
            </div>

            {/* Department Filter Tabs */}
            <div className="flex flex-wrap gap-2">
              {departments.map((dept) => (
                <button
                  key={dept}
                  onClick={() => setSelectedDepartment(dept)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedDepartment === dept
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {dept}
                </button>
              ))}
            </div>
          </div>

          {/* Search Box */}
          <div className="relative max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search job title, location, or department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10 transition-all"
            />
          </div>

          {/* Job List Cards */}
          <div className="space-y-4">
            {filteredJobs.length === 0 ? (
              <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl text-xs text-slate-500">
                No open career opportunities match your current filters.
              </div>
            ) : (
              filteredJobs.map((job) => (
                <div
                  key={job.id}
                  className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition-all space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase bg-indigo-50 text-indigo-700 rounded-md border border-indigo-200">
                          {job.department}
                        </span>
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-600 rounded-md">
                          {job.type}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold font-display text-slate-900 mt-2">{job.title}</h3>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <button
                        onClick={() => openApplyModal(job)}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                      >
                        Apply Now <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed max-w-4xl">{job.description}</p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-2 border-t border-slate-100">
                    <span className="flex items-center gap-1 font-medium">
                      <MapPin size={14} className="text-slate-400" /> {job.location}
                    </span>
                    <span className="flex items-center gap-1 font-medium">
                      <Clock size={14} className="text-slate-400" /> Experience: {job.experience}
                    </span>
                  </div>

                  {/* Accordion Role Details */}
                  <div className="pt-3 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs space-y-2">
                        <h4 className="font-bold text-slate-900">Key Responsibilities:</h4>
                        <ul className="space-y-1 text-slate-600 list-disc list-inside">
                          {job.responsibilities.map((r, i) => (
                            <li key={i}>{r}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs space-y-2">
                        <h4 className="font-bold text-slate-900">Requirements & Qualifications:</h4>
                        <ul className="space-y-1 text-slate-600 list-disc list-inside">
                          {job.requirements.map((req, i) => (
                            <li key={i}>{req}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>

      {/* Candidate Application Modal */}
      {applyModalOpen && selectedJob && (
        <div className="fixed inset-0 bg-[#0f172a]/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in font-sans">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg max-h-[90vh] overflow-y-auto animate-scale-up">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold font-display text-slate-900">Apply for Position</h3>
                <p className="text-xs text-indigo-600 font-semibold">{selectedJob.title} ({selectedJob.department})</p>
              </div>
              <button
                onClick={() => setApplyModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {submitted ? (
              <div className="p-8 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 size={24} />
                </div>
                <h4 className="text-lg font-bold font-display text-slate-900">Application Prepared!</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Your email client has been launched with your pre-filled application details to <strong>{selectedJob.contactEmail}</strong>. If your email program didn't open automatically, please send your resume directly to <strong>{selectedJob.contactEmail}</strong>.
                </p>
                <button
                  onClick={() => setApplyModalOpen(false)}
                  className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold"
                >
                  Close Window
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplySubmit} className="p-6 space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="John Doe"
                    value={candidateName}
                    onChange={(e) => setCandidateName(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-slate-300 text-xs outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="john@example.com"
                      value={candidateEmail}
                      onChange={(e) => setCandidateEmail(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg border border-slate-300 text-xs outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      value={candidatePhone}
                      onChange={(e) => setCandidatePhone(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg border border-slate-300 text-xs outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">LinkedIn Profile / Portfolio Link *</label>
                  <input
                    type="url"
                    required
                    placeholder="https://linkedin.com/in/johndoe"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-slate-300 text-xs outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Cover Note / Experience Summary</label>
                  <textarea
                    rows="4"
                    placeholder="Briefly introduce yourself and highlight relevant enterprise IT experience..."
                    value={coverNote}
                    onChange={(e) => setCoverNote(e.target.value)}
                    className="w-full p-3 rounded-lg border border-slate-300 text-xs outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10 resize-none"
                  ></textarea>
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setApplyModalOpen(false)}
                    className="px-4 h-9 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 h-9 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs"
                  >
                    <Send size={13} /> Submit Application
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <PublicFooter />
    </div>
  );
}
