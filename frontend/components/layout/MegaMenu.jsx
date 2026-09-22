import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ChevronDown,
  Menu,
  X,
  ArrowRight,
  ShieldCheck,
  Building,
  UserCheck,
  User,
  Briefcase,
  Layers,
  Sparkles
} from "lucide-react";
import logoImg from "../../assets/logo.webp";
import { useGlobalSettings } from "../../hooks/useGlobalSettings";
import ThemeSelector from "./ThemeSelector";
import { ENTERPRISE_SERVICES, ENTERPRISE_CASE_STUDIES } from "../../services/publicData";
import { Icons } from "../../utils/iconHelper";
import API from "../../services/api";

export default function MegaMenu() {
  const [activeMenu, setActiveMenu] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { siteTitle, siteLogo } = useGlobalSettings();
  const location = useLocation();
  const navRef = useRef(null);
  const [services, setServices] = useState(ENTERPRISE_SERVICES);
  const [caseStudies, setCaseStudies] = useState(ENTERPRISE_CASE_STUDIES);

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
          setCaseStudies(res.data.data.filter((p) => p.isActive));
        }
      })
      .catch(() => {});
  }, []);

  // Close menus on route change
  useEffect(() => {
    setActiveMenu(null);
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Handle outside click to close active dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Track scroll position for transparent → solid navbar transition
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 80);
    handleScroll(); // Check initial position
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleMouseEnter = (menu) => {
    setActiveMenu(menu);
  };

  const handleMouseLeave = () => {
    setActiveMenu(null);
  };

  return (
    <header
      ref={navRef}
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 font-body ${
        scrolled
          ? "border-b shadow-xs"
          : ""
      }`}
      style={{
        backgroundColor: scrolled ? "var(--navbar-bg, #FFFFFF)" : "transparent",
        color: "var(--navbar-text, #475569)",
        borderColor: scrolled ? "var(--border-color, rgba(226,232,240,0.8))" : "transparent"
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo & Name */}
        <Link
          to="/"
          onClick={() => {
            if (location.pathname === "/") {
              window.scrollTo({ top: 0, behavior: "smooth" });
            }
          }}
          className="flex items-center gap-3 group cursor-pointer"
          title="Go to Homepage"
        >
          <img
            src={siteLogo || logoImg}
            width="40"
            height="40"
            className="w-10 h-10 shrink-0 object-contain rounded-lg p-1 border shadow-xs transition-all group-hover:scale-105"
            style={{ backgroundColor: "var(--card-bg, #FFFFFF)", borderColor: "var(--border-color, rgba(241,245,249,0.9))" }}
            alt={siteTitle || "Sai IT Services logo"}
          />
          <div className="flex flex-col">
            <span className="text-lg font-extrabold font-display leading-tight truncate max-w-[200px] sm:max-w-[280px]" style={{ color: "var(--page-text, #0F172A)" }}>
              {siteTitle || "Sai IT Services"}
            </span>
            <span className="text-[10px] font-bold tracking-widest uppercase text-indigo-600 font-display">
              Enterprise IT Services
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links with Mega Menu */}
        <nav className="hidden lg:flex items-center gap-1" role="navigation" aria-label="Main Enterprise Navigation">
          <Link
            to="/"
            className={`px-3.5 py-2 text-sm font-semibold rounded-lg transition-colors ${
              location.pathname === "/" ? "bg-indigo-50 text-indigo-600 font-bold" : "hover:bg-slate-100"
            }`}
            style={{ color: location.pathname === "/" ? "#4F46E5" : "var(--navbar-text, #475569)" }}
          >
            Home
          </Link>

          {/* Services Mega Menu Toggle */}
          <div
            className="relative"
            onMouseEnter={() => handleMouseEnter("services")}
            onMouseLeave={handleMouseLeave}
          >
            <Link
              to="/services"
              className={`px-3.5 py-2 text-sm font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                location.pathname.startsWith("/services") ? "bg-indigo-50 text-indigo-600 font-bold" : "hover:bg-slate-100"
              }`}
              style={{ color: location.pathname.startsWith("/services") ? "#4F46E5" : "var(--navbar-text, #475569)" }}
            >
              Services <ChevronDown size={15} className={`transition-transform duration-200 ${activeMenu === "services" ? "rotate-180 text-indigo-600" : ""}`} />
            </Link>

            {/* Mega Menu Dropdown */}
            {activeMenu === "services" && (
              <div className="absolute top-full left-0 w-[850px] pt-2 animate-fade-in z-50">
                <div className="rounded-2xl shadow-2xl border border-slate-200 bg-white p-6 grid grid-cols-3 gap-6 text-slate-900">
                  <div className="col-span-2 grid grid-cols-2 gap-4">
                    {services.map((srv) => {
                      const IconComp = Icons[srv.icon] || Layers;
                      return (
                        <Link
                          key={srv.id}
                          to={`/services/${srv.slug}`}
                          className="p-3.5 rounded-xl border border-slate-100 hover:border-indigo-200 bg-slate-50/50 hover:bg-indigo-50/60 transition-all group flex items-start gap-3"
                        >
                          <div className="p-2.5 rounded-lg bg-indigo-100/70 text-indigo-700 group-hover:bg-indigo-600 group-hover:text-white transition-colors shrink-0">
                            <IconComp size={20} />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors font-display line-clamp-1">
                              {srv.title}
                            </h4>
                            <p className="text-[11px] text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                              {srv.shortDescription}
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>

                  {/* Mega Menu Feature Box */}
                  <div
                    className="col-span-1 p-5 rounded-xl text-white flex flex-col justify-between relative overflow-hidden shadow-md border"
                    style={{ background: "linear-gradient(135deg, var(--primary-btn, #4338ca) 0%, var(--bg-sidebar, #3730a3) 100%)", color: "#ffffff", borderColor: "rgba(255,255,255,0.15)" }}
                  >
                    <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full blur-xl pointer-events-none" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}></div>
                    <div>
                      <span
                        className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full inline-block mb-3 border"
                        style={{ backgroundColor: "rgba(255,255,255,0.15)", color: "#ffffff", borderColor: "rgba(255,255,255,0.25)" }}
                      >
                        Enterprise Solutions
                      </span>
                      <h4 className="text-sm font-bold font-display mb-2 leading-snug" style={{ color: "#ffffff" }}>
                        Need Custom Enterprise Software Architecture?
                      </h4>
                      <p className="text-xs leading-relaxed mb-4" style={{ color: "rgba(255,255,255,0.85)" }}>
                        Talk directly with our senior IT solution architects to scope your enterprise project requirements.
                      </p>
                    </div>
                    <Link
                      to="/contact"
                      className="px-4 py-2 hover:bg-white/30 text-xs font-bold rounded-lg transition-colors inline-flex items-center gap-2 shadow-xs"
                      style={{ backgroundColor: "rgba(255,255,255,0.2)", color: "#ffffff", border: "1px solid rgba(255,255,255,0.3)" }}
                    >
                      Book Technical Consultation <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Projects Mega Menu Toggle */}
          <div
            className="relative"
            onMouseEnter={() => handleMouseEnter("projects")}
            onMouseLeave={handleMouseLeave}
          >
            <Link
              to="/case-studies"
              className={`px-3.5 py-2 text-sm font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                location.pathname.startsWith("/case-studies") ? "bg-indigo-50 text-indigo-600 font-bold" : "hover:bg-slate-100"
              }`}
              style={{ color: location.pathname.startsWith("/case-studies") ? "#4F46E5" : "var(--navbar-text, #475569)" }}
            >
              Projects <ChevronDown size={15} className={`transition-transform duration-200 ${activeMenu === "projects" ? "rotate-180 text-indigo-600" : ""}`} />
            </Link>

            {/* Projects Mega Menu Dropdown */}
            {activeMenu === "projects" && (
              <div className="absolute top-full left-0 w-[700px] pt-2 animate-fade-in z-50">
                <div className="rounded-2xl shadow-2xl border border-slate-200 bg-white p-6 grid grid-cols-3 gap-6 text-slate-900">
                  <div className="col-span-2 grid grid-cols-2 gap-4">
                    {caseStudies.slice(0, 4).map((proj) => {
                      const ProjIcon = Icons[proj.icon] || Briefcase;
                      return (
                        <Link
                          key={proj.id || proj.slug}
                          to={`/case-studies/${proj.slug}`}
                          className="p-3.5 rounded-xl border border-slate-100 hover:border-indigo-200 bg-slate-50/50 hover:bg-indigo-50/60 transition-all group flex items-start gap-3"
                        >
                          <div className="p-2.5 rounded-lg bg-indigo-100/70 text-indigo-700 group-hover:bg-indigo-600 group-hover:text-white transition-colors shrink-0">
                            <ProjIcon size={20} />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors font-display line-clamp-1">
                              {proj.title}
                            </h4>
                            <p className="text-[11px] text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                              {proj.shortDescription}
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>

                  {/* Projects CTA Box */}
                  <div
                    className="col-span-1 p-5 rounded-xl text-white flex flex-col justify-between relative overflow-hidden shadow-md border"
                    style={{ background: "linear-gradient(135deg, var(--primary-btn, #4338ca) 0%, var(--bg-sidebar, #3730a3) 100%)", color: "#ffffff", borderColor: "rgba(255,255,255,0.15)" }}
                  >
                    <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full blur-xl pointer-events-none" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}></div>
                    <div>
                      <span
                        className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full inline-block mb-3 border"
                        style={{ backgroundColor: "rgba(255,255,255,0.15)", color: "#ffffff", borderColor: "rgba(255,255,255,0.25)" }}
                      >
                        Our Portfolio
                      </span>
                      <h4 className="text-sm font-bold font-display mb-2 leading-snug" style={{ color: "#ffffff" }}>
                        See How We Deliver Results
                      </h4>
                      <p className="text-xs leading-relaxed mb-4" style={{ color: "rgba(255,255,255,0.85)" }}>
                        Explore our complete portfolio of enterprise projects and proven case studies.
                      </p>
                    </div>
                    <Link
                      to="/case-studies"
                      className="px-4 py-2 hover:bg-white/30 text-xs font-bold rounded-lg transition-colors inline-flex items-center gap-2 shadow-xs"
                      style={{ backgroundColor: "rgba(255,255,255,0.2)", color: "#ffffff", border: "1px solid rgba(255,255,255,0.3)" }}
                    >
                      View All Projects <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* About Company Link */}
          <Link
            to="/about"
            className={`px-3.5 py-2 text-sm font-semibold rounded-lg transition-colors ${
              location.pathname === "/about" ? "bg-indigo-50 text-indigo-600 font-bold" : "hover:bg-slate-100"
            }`}
            style={{ color: location.pathname === "/about" ? "#4F46E5" : "var(--navbar-text, #475569)" }}
          >
            About Us
          </Link>

          {/* Careers Link */}
          <Link
            to="/careers"
            className={`px-3.5 py-2 text-sm font-semibold rounded-lg transition-colors ${
              location.pathname === "/careers" ? "bg-indigo-50 text-indigo-600 font-bold" : "hover:bg-slate-100"
            }`}
            style={{ color: location.pathname === "/careers" ? "#4F46E5" : "var(--navbar-text, #475569)" }}
          >
            Careers
          </Link>

          {/* Contact Us Link */}
          <Link
            to="/contact"
            className={`px-3.5 py-2 text-sm font-semibold rounded-lg transition-colors ${
              location.pathname === "/contact" ? "bg-indigo-50 text-indigo-600 font-bold" : "hover:bg-slate-100"
            }`}
            style={{ color: location.pathname === "/contact" ? "#4F46E5" : "var(--navbar-text, #475569)" }}
          >
            Contact
          </Link>
        </nav>

        {/* Right Actions & Portal Login */}
        <div className="hidden lg:flex items-center gap-3">
          <ThemeSelector portal="public" />
          
          <div className="h-5 w-px bg-slate-200"></div>

          {/* Portal Access Buttons */}
          <Link
            to="/client/login"
            className="px-4 py-2 text-xs font-bold rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5"
          >
            <User size={14} /> Client Portal
          </Link>

          <Link
            to="/contact"
            className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-all shadow-xs flex items-center gap-1.5"
          >
            Request Proposal <ArrowRight size={14} />
          </Link>
        </div>

        {/* Mobile Hamburger Toggle */}
        <div className="flex items-center gap-2 lg:hidden">
          <ThemeSelector portal="public" />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white animate-fade-in px-4 py-6 space-y-4 max-h-[85vh] overflow-y-auto">
          <div className="space-y-1">
            <Link
              to="/"
              className="block px-3 py-2.5 text-sm font-bold text-slate-800 hover:bg-slate-50 rounded-lg"
            >
              Home
            </Link>
            <Link
              to="/services"
              className="block px-3 py-2.5 text-sm font-bold text-slate-800 hover:bg-slate-50 rounded-lg"
            >
              Services
            </Link>
            <Link
              to="/case-studies"
              className="block px-3 py-2.5 text-sm font-bold text-slate-800 hover:bg-slate-50 rounded-lg"
            >
              Projects
            </Link>
            <Link
              to="/about"
              className="block px-3 py-2.5 text-sm font-bold text-slate-800 hover:bg-slate-50 rounded-lg"
            >
              About Us
            </Link>
            <Link
              to="/careers"
              className="block px-3 py-2.5 text-sm font-bold text-slate-800 hover:bg-slate-50 rounded-lg"
            >
              Careers
            </Link>
            <Link
              to="/contact"
              className="block px-3 py-2.5 text-sm font-bold text-slate-800 hover:bg-slate-50 rounded-lg"
            >
              Contact Us
            </Link>
          </div>

          <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
            <Link
              to="/contact"
              className="w-full py-3 text-center text-xs font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Request Proposal
            </Link>
            <Link
              to="/client/login"
              className="w-full py-2.5 text-center text-xs font-bold text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              Client Login
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
