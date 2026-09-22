// Consolidates copyright information, links, and contact information.
// Details visual configurations set in the CMS settings.


import { Link } from "react-router-dom";
import { Mail, Phone, MessageSquare, MapPin } from "lucide-react";
import logoImg from "../../assets/logo.webp";
import { useGlobalSettings } from "../../hooks/useGlobalSettings";

export default function PublicFooter() {
  // load site branding (logo, colors)
  const { siteTitle, siteLogo } = useGlobalSettings();
  const brandName = siteTitle.replace(/\s+(CRP|Portal|CRM|System|Solutions)\b/gi, "").trim();

  return (
    <footer className="w-full font-sans border-t" style={{ backgroundColor: "var(--sai-footer-bg, #1E1B4B)", color: "var(--sai-footer-font, #C7D2FE)", borderColor: "rgba(255, 255, 255, 0.08)" }} role="contentinfo">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 pb-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          <div className="col-span-1 md:col-span-5 flex flex-col items-start">
            <div className="flex items-center gap-3 mb-5">
              <img
                src={siteLogo || logoImg}
                width="32"
                height="32"
                className="w-8 h-8 shrink-0 object-contain rounded-md bg-white p-0.5"
                alt={siteTitle || "Sai IT Services logo"}
              />
              <div className="flex flex-col text-left">
                <span className="font-extrabold text-white text-sm tracking-wider uppercase font-display truncate max-w-[200px]" title={siteTitle}>{siteTitle}</span>
                <span className="text-[11px] font-bold uppercase tracking-widest -mt-0.5" style={{ color: "var(--sai-footer-font, #C7D2FE)", opacity: 0.7 }}>Project Portal</span>
              </div>
            </div>
            
            <p className="text-xs leading-relaxed mb-6 text-left max-w-sm" style={{ color: "var(--sai-footer-font, #C7D2FE)", opacity: 0.85 }}>
              Streamline your client and project operations, track deliverables, manage milestones, and collaborate securely on a single unified platform.
            </p>

            <div className="flex gap-4 items-center">
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter" className="p-2 hover:bg-white/10 rounded-full hover:text-white transition-colors cursor-pointer">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="p-2 hover:bg-white/10 rounded-full hover:text-white transition-colors cursor-pointer">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                </svg>
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="p-2 hover:bg-white/10 rounded-full hover:text-white transition-colors cursor-pointer">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                </svg>
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="p-2 hover:bg-white/10 rounded-full hover:text-white transition-colors cursor-pointer">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </a>
            </div>
          </div>

          <div className="col-span-1 md:col-span-3 flex flex-col items-start">
            <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-5 font-display">Quick Links</h3>
            <div className="flex flex-col gap-3 text-left">
              <Link to="/" className="text-xs font-medium hover:text-white transition-colors cursor-pointer py-1" style={{ color: "var(--sai-footer-font, #C7D2FE)", opacity: 0.85 }}>Home</Link>
              <Link to="/services" className="text-xs font-medium hover:text-white transition-colors cursor-pointer py-1" style={{ color: "var(--sai-footer-font, #C7D2FE)", opacity: 0.85 }}>IT Services</Link>
              <Link to="/case-studies" className="text-xs font-medium hover:text-white transition-colors cursor-pointer py-1" style={{ color: "var(--sai-footer-font, #C7D2FE)", opacity: 0.85 }}>Projects</Link>
              <Link to="/about" className="text-xs font-medium hover:text-white transition-colors cursor-pointer py-1" style={{ color: "var(--sai-footer-font, #C7D2FE)", opacity: 0.85 }}>About Us</Link>
              <Link to="/careers" className="text-xs font-medium hover:text-white transition-colors cursor-pointer py-1" style={{ color: "var(--sai-footer-font, #C7D2FE)", opacity: 0.85 }}>Careers</Link>
              <Link to="/contact" className="text-xs font-medium hover:text-white transition-colors cursor-pointer py-1" style={{ color: "var(--sai-footer-font, #C7D2FE)", opacity: 0.85 }}>Contact Us</Link>
            </div>
          </div>

          <div className="col-span-1 md:col-span-4 flex flex-col items-start gap-1">
            <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-5 font-display">Contact &amp; Support</h3>
            <div className="space-y-4 text-left w-full">
              <div className="flex gap-3 items-start">
                <Mail className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "var(--sai-cta-bg, #4F46E5)" }} />
                <div className="text-xs" style={{ color: "var(--sai-footer-font, #C7D2FE)", opacity: 0.85 }}>
                  <span className="block font-medium">info@saiitservices.com <span className="font-normal" style={{ opacity: 0.75 }}>(General)</span></span>
                  <span className="block font-medium">sales@saiitservices.com <span className="font-normal" style={{ opacity: 0.75 }}>(Sales)</span></span>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <Phone className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "var(--sai-cta-bg, #4F46E5)" }} />
                <div className="text-xs font-medium" style={{ color: "var(--sai-footer-font, #C7D2FE)", opacity: 0.85 }}>
                  <span className="block">+91-9429694298</span>
                  <span className="block">+91-9041914601</span>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <MessageSquare className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "var(--sai-cta-bg, #4F46E5)" }} />
                <div className="text-xs font-medium" style={{ color: "var(--sai-footer-font, #C7D2FE)", opacity: 0.85 }}>
                  <span className="hover:underline cursor-pointer">Message us on WhatsApp</span>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "var(--sai-cta-bg, #4F46E5)" }} />
                <p className="text-xs font-medium leading-relaxed max-w-[260px]" style={{ color: "var(--sai-footer-font, #C7D2FE)", opacity: 0.85 }}>
                  10009 Mount Tabor Road, City, Odessa Missouri, United States
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t pt-6 mt-12 flex flex-col md:flex-row justify-between items-center text-xs gap-4" style={{ borderColor: "rgba(255, 255, 255, 0.08)", color: "var(--sai-footer-font, #C7D2FE)", opacity: 0.8 }}>
          <span>&copy; 2026 {brandName}. All rights reserved.</span>
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 font-medium">
            <Link to="/privacy-policy" className="hover:text-white transition-colors cursor-pointer">Privacy Policy</Link>
            <Link to="/terms-of-service" className="hover:text-white transition-colors cursor-pointer">Terms &amp; Conditions</Link>
            <Link to="/cookie-policy" className="hover:text-white transition-colors cursor-pointer">Cookie Policy</Link>
            <Link to="/help-center" className="hover:text-white transition-colors cursor-pointer">Help Center</Link>
            <span style={{ opacity: 0.3 }}>|</span>
            <Link to="/staff/login" className="hover:text-white transition-colors cursor-pointer">Staff Login</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
