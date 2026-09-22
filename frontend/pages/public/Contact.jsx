// Public contact form enabling users to submit inquiry comments to support teams.
// Connects message entries.


import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Building,
  ShieldCheck,
  CheckCircle2,
  Mail,
  Phone,
  MessageSquare,
  MapPin,
  Send,
  RefreshCw,
  Sparkles
} from "lucide-react";
import { createContactSubmission } from "../../services/contactService";
import PublicFooter from "../../components/layout/PublicFooter";
import MegaMenu from "../../components/layout/MegaMenu";
import { useGlobalSettings } from "../../hooks/useGlobalSettings";
import { useCmsSettings } from "../../context/CmsSettingsContext";
import { Icons } from "../../utils/iconHelper";

function Contact() {
  const [firstName, setFirstName] = useState("");
  const { siteTitle, siteLogo } = useGlobalSettings();
  const cms = useCmsSettings();

  const contact = cms.contact || {};
  const hero = contact.hero || {};
  const columns = contact.columns || {};
  const sidebar = contact.sidebar || {};

  const Col1_Icon = Icons[columns.col1_icon] || Icons.Building;
  const Col2_Icon = Icons[columns.col2_icon] || Icons.ShieldCheck;
  const Col3_Icon = Icons[columns.col3_icon] || Icons.CheckCircle2;

  const emailList = sidebar.emails ? sidebar.emails.split(",").map(e => e.trim()) : ["info@saiitservices.com (General)", "sales@saiitservices.com (Sales)"];
  const phoneList = sidebar.phones ? sidebar.phones.split(",").map(p => p.trim()) : ["+91-9429694298", "+91-9041914601"];

  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [toast, setToast] = useState(null);

  const [mathProblem, setMathProblem] = useState(() => {
    const operations = ["+", "-", "*", "/"];
    const op = operations[Math.floor(Math.random() * operations.length)];
    let num1, num2, answer, displayOp;
    if (op === "+") {
      num1 = Math.floor(Math.random() * 20) + 1;
      num2 = Math.floor(Math.random() * 20) + 1;
      answer = num1 + num2;
      displayOp = "+";
    } else if (op === "-") {
      num1 = Math.floor(Math.random() * 20) + 10;
      num2 = Math.floor(Math.random() * 10) + 1;
      answer = num1 - num2;
      displayOp = "-";
    } else if (op === "*") {
      num1 = Math.floor(Math.random() * 10) + 1;
      num2 = Math.floor(Math.random() * 10) + 1;
      answer = num1 * num2;
      displayOp = "×";
    } else {
      num2 = Math.floor(Math.random() * 9) + 2;
      answer = Math.floor(Math.random() * 9) + 1;
      num1 = num2 * answer;
      displayOp = "÷";
    }
    return { question: `${num1} ${displayOp} ${num2}`, answer };
  });
  const [userMathInput, setUserMathInput] = useState("");

  const resetMathProblem = () => {
    const operations = ["+", "-", "*", "/"];
    const op = operations[Math.floor(Math.random() * operations.length)];
    let num1, num2, answer, displayOp;
    if (op === "+") {
      num1 = Math.floor(Math.random() * 20) + 1;
      num2 = Math.floor(Math.random() * 20) + 1;
      answer = num1 + num2;
      displayOp = "+";
    } else if (op === "-") {
      num1 = Math.floor(Math.random() * 20) + 10;
      num2 = Math.floor(Math.random() * 10) + 1;
      answer = num1 - num2;
      displayOp = "-";
    } else if (op === "*") {
      num1 = Math.floor(Math.random() * 10) + 1;
      num2 = Math.floor(Math.random() * 10) + 1;
      answer = num1 * num2;
      displayOp = "×";
    } else {
      num2 = Math.floor(Math.random() * 9) + 2;
      answer = Math.floor(Math.random() * 9) + 1;
      num1 = num2 * answer;
      displayOp = "÷";
    }
    setMathProblem({ question: `${num1} ${displayOp} ${num2}`, answer });
    setUserMathInput("");
  };

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 4000);
  };

  // Checks anti-spam math validations and submits guest message logs
  const handleSubmit = (e) => {
    e.preventDefault();

    const parsedUserAnswer = parseInt(userMathInput.trim(), 10);
    if (isNaN(parsedUserAnswer) || parsedUserAnswer !== mathProblem.answer) {
      showToast("Incorrect math verification answer. Please try again.");
      resetMathProblem();
      return;
    }

    createContactSubmission({ firstName, lastName, email, subject, message })
      .then(() => {
        showToast("Message sent successfully!");
        setFirstName("");
        setLastName("");
        setEmail("");
        setSubject("");
        setMessage("");
        resetMathProblem();
      })
      .catch((err) => {
        showToast("Failed to send message. Please try again.");
        resetMathProblem();
      });
  };

  return (
    <div className="min-h-screen font-body flex flex-col" style={{ backgroundColor: "var(--page-bg, #F8FAFC)", color: "var(--page-text, #0F172A)" }}>
      {toast && (
        <div className="fixed top-5 right-5 text-xs font-semibold px-4 py-3 rounded-lg shadow-md z-[9999] flex items-center" style={{ backgroundColor: "var(--card-bg, #FFFFFF)", borderColor: "var(--border-color, #E2E8F0)", color: "var(--text-primary, #1E293B)", border: "1px solid var(--border-color, #E2E8F0)" }}>
          <span>{toast}</span>
        </div>
      )}
      <MegaMenu />

      <main className="flex-1 pt-16">
        <section className="relative px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 min-h-[60vh] lg:min-h-screen flex items-center overflow-hidden border-b" style={{ backgroundColor: "var(--page-bg, #F8FAFC)", borderColor: "var(--border-color, #E2E8F0)" }}>
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
            <div className="lg:col-span-6 flex flex-col justify-center space-y-6">
              <span
                className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold border self-start font-display"
                style={{ backgroundColor: "rgba(99,102,241,0.1)", color: "#818cf8", borderColor: "rgba(99,102,241,0.3)" }}
              >
                <Sparkles size={14} className="text-indigo-500" /> {hero.badge || "Contact Us"}
              </span>
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight" style={{ color: "var(--text-primary, #0F172A)" }}>
                {hero.title || "Let's streamline your client and project operations."}
              </h1>
              <p className="text-base sm:text-lg leading-relaxed max-w-xl" style={{ color: "var(--text-secondary, #475569)" }}>
                {hero.description || "Reach out for workspace setup, administrator onboarding, technical assistance, or integration support. The portal connects administrators, team members, and clients on a single unified platform."}
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <a
                  href="#contact-form"
                  className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-lg transition-all flex items-center gap-2"
                >
                  <Send size={14} /> Send a Message
                </a>
                <a
                  href="mailto:contact@saiitservices.com"
                  className="px-6 py-3.5 hover:opacity-90 text-xs font-bold rounded-xl transition-all flex items-center gap-2 border"
                  style={{ backgroundColor: "var(--card-bg, #FFFFFF)", color: "var(--text-primary, #334155)", borderColor: "var(--border-color, #CBD5E1)" }}
                >
                  <Mail size={14} /> Email Directly
                </a>
              </div>

              {/* Trust Badges */}
              <div className="pt-6 border-t flex flex-wrap items-center gap-6 text-xs" style={{ borderColor: "var(--border-color, #E2E8F0)", color: "var(--text-secondary, #475569)" }}>
                <span className="flex items-center gap-1.5 font-semibold">
                  <ShieldCheck size={16} className="text-emerald-500" /> Secure & Encrypted
                </span>
                <span className="flex items-center gap-1.5 font-semibold">
                  <CheckCircle2 size={16} className="text-indigo-500" /> Response within 24h
                </span>
                <span className="flex items-center gap-1.5 font-semibold">
                  <MapPin size={16} className="text-indigo-500" /> Global Support
                </span>
              </div>
            </div>

            <div className="lg:col-span-6 flex flex-col gap-4">
              <div className="p-5 border rounded-xl shadow-sm flex items-start gap-4" style={{ backgroundColor: "var(--card-bg, #FFFFFF)", borderColor: "var(--border-color, #E2E8F0)" }}>
                <div className="p-2.5 bg-primary-light text-primary rounded-lg shadow-sm">
                  <Col1_Icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[var(--text-primary)] mb-1 font-display">
                    {columns.col1_title || "Workspace & Onboarding"}
                  </h4>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    {columns.col1_description || "Speak with us about system configuration, administrator setup, and platform deployment plans."}
                  </p>
                </div>
              </div>

              <div className="p-5 border rounded-xl shadow-sm flex items-start gap-4" style={{ backgroundColor: "var(--card-bg, #FFFFFF)", borderColor: "var(--border-color, #E2E8F0)" }}>
                <div className="p-2.5 bg-primary-light text-primary rounded-lg shadow-sm">
                  <Col2_Icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[var(--text-primary)] mb-1 font-display">
                    {columns.col2_title || "Technical Support"}
                  </h4>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    {columns.col2_description || "Get assistance with role-based privileges, document management, or client portal queries."}
                  </p>
                </div>
              </div>

              <div className="p-5 border rounded-xl shadow-sm flex items-start gap-4" style={{ backgroundColor: "var(--card-bg, #FFFFFF)", borderColor: "var(--border-color, #E2E8F0)" }}>
                <div className="p-2.5 bg-primary-light text-primary rounded-lg shadow-sm">
                  <Col3_Icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[var(--text-primary)] mb-1 font-display">
                    {columns.col3_title || "Fast response"}
                  </h4>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    {columns.col3_description || "Reach out through email, phone, or WhatsApp and our team will follow up promptly."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 border-t" style={{ backgroundColor: "var(--page-bg, #F8FAFC)", borderColor: "var(--border-color, #E2E8F0)" }}>
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            <div className="lg:col-span-5 rounded-2xl p-8 flex flex-col justify-between relative overflow-hidden shadow-lg border" style={{ backgroundColor: "var(--bg-sidebar, #1E1B4B)", borderColor: "rgba(255,255,255,0.1)" }}>
              <div>
                <span className="text-xs font-bold tracking-widest uppercase mb-4 block font-display" style={{ color: "#c7d2fe" }}>
                  Contact Info
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold mb-4 tracking-tight leading-snug font-display" style={{ color: "#ffffff" }}>
                  {sidebar.title || "Ready to optimize your project management workflow?"}
                </h2>
                <p className="text-sm mb-8 leading-relaxed max-w-sm" style={{ color: "#e2e8f0" }}>
                  {sidebar.description || "Speak with our team about portal configuration, role assignment, or secure collaboration features."}
                </p>

                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="p-2.5 rounded-lg" style={{ backgroundColor: "rgba(255,255,255,0.1)", color: "#ffffff" }}>
                      <Mail className="w-5 h-5" />
                    </div>
                    <div className="text-sm">
                      {emailList.map((email, idx) => (
                        <span key={idx} className="block font-medium" style={{ color: "#ffffff" }}>{email}</span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="p-2.5 rounded-lg" style={{ backgroundColor: "rgba(255,255,255,0.1)", color: "#ffffff" }}>
                      <Phone className="w-5 h-5" />
                    </div>
                    <div className="text-sm">
                      {phoneList.map((phone, idx) => (
                        <span key={idx} className="block font-medium" style={{ color: "#ffffff" }}>{phone}</span>
                      ))}
                    </div>
                  </div>

                  {sidebar.whatsapp_label && (
                    <div className="flex items-start gap-4">
                      <div className="p-2.5 rounded-lg" style={{ backgroundColor: "rgba(255,255,255,0.1)", color: "#ffffff" }}>
                        <MessageSquare className="w-5 h-5" />
                      </div>
                      <div className="text-sm flex items-center">
                        <span className="font-medium cursor-pointer hover:underline" style={{ color: "#ffffff" }}>
                          {sidebar.whatsapp_label}
                        </span>
                      </div>
                    </div>
                  )}

                  {sidebar.address && (
                    <div className="flex items-start gap-4">
                      <div className="p-2.5 rounded-lg" style={{ backgroundColor: "rgba(255,255,255,0.1)", color: "#ffffff" }}>
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div className="text-sm">
                        <p className="font-medium leading-relaxed max-w-[240px]" style={{ color: "#ffffff" }}>
                          {sidebar.address}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4 mt-12 z-10" style={{ color: "#c7d2fe" }}>
                {sidebar.social_twitter && (
                  <a href={sidebar.social_twitter} target="_blank" rel="noopener noreferrer" aria-label="Twitter" className="p-2 hover:bg-white/10 rounded-full hover:text-white transition-colors cursor-pointer">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  </a>
                )}
                {sidebar.social_facebook && (
                  <a href={sidebar.social_facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="p-2 hover:bg-white/10 rounded-full hover:text-white transition-colors cursor-pointer">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                    </svg>
                  </a>
                )}
                {sidebar.social_linkedin && (
                  <a href={sidebar.social_linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="p-2 hover:bg-white/10 rounded-full hover:text-white transition-colors cursor-pointer">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                    </svg>
                  </a>
                )}
                {sidebar.social_instagram && (
                  <a href={sidebar.social_instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="p-2 hover:bg-white/10 rounded-full hover:text-white transition-colors cursor-pointer">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                    </svg>
                  </a>
                )}
              </div>

              <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-[var(--bg-sidebar-active)]/30 rounded-full blur-3xl"></div>
            </div>

            <div className="lg:col-span-7 rounded-2xl p-8 border shadow-md" style={{ backgroundColor: "var(--card-bg, #FFFFFF)", borderColor: "var(--border-color, #E2E8F0)" }}>
              <span className="text-xs font-bold tracking-wider text-slate-400 uppercase mb-2 block font-display">
                Send a Message
              </span>
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2 font-display">
                Tell us what you need and we'll help you move forward.
              </h2>
              <p className="text-sm text-[var(--text-secondary)] mb-8 font-body font-normal leading-normal">
                Please fill in details below and our team will get back to you as soon as possible.
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[11px] font-bold text-[var(--text-secondary)] tracking-wider uppercase mb-1.5 font-display">
                      First Name
                    </label>
                    <input 
                      type="text" 
                      required
                      placeholder="Sai"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full h-[2.375rem] px-3 text-sm border text-[var(--text-primary)] rounded outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all font-body"
                      style={{ backgroundColor: "var(--card-bg, #FFFFFF)", borderColor: "var(--border-color, #E2E8F0)" }}
                     aria-label="Sai"/>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[var(--text-secondary)] tracking-wider uppercase mb-1.5 font-display">
                      Last Name
                    </label>
                    <input 
                      type="text" 
                      required
                      placeholder="m"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full h-[2.375rem] px-3 text-sm border text-[var(--text-primary)] rounded outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all font-body"
                      style={{ backgroundColor: "var(--card-bg, #FFFFFF)", borderColor: "var(--border-color, #E2E8F0)" }}
                     aria-label="m"/>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[var(--text-secondary)] tracking-wider uppercase mb-1.5 font-display">
                    Work Email
                  </label>
                  <input 
                    type="email" 
                    required
                    placeholder="sai@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-[2.375rem] px-3 text-sm border text-[var(--text-primary)] rounded outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all font-body"
                    style={{ backgroundColor: "var(--card-bg, #FFFFFF)", borderColor: "var(--border-color, #E2E8F0)" }}
                   aria-label="sai@example.com"/>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[var(--text-secondary)] tracking-wider uppercase mb-1.5 font-display">
                    Subject
                  </label>
                  <input 
                    type="text" 
                    required
                    placeholder="How can we help you?"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full h-[2.375rem] px-3 text-sm border text-[var(--text-primary)] rounded outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all font-body"
                    style={{ backgroundColor: "var(--card-bg, #FFFFFF)", borderColor: "var(--border-color, #E2E8F0)" }}
                   aria-label="How can we help you?"/>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[var(--text-secondary)] tracking-wider uppercase mb-1.5 font-display">
                    Message
                  </label>
                  <textarea 
                    required
                    rows={4}
                    placeholder="Tell us about your requirements..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full p-3 text-sm border text-[var(--text-primary)] rounded outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all font-body resize-y"
                    style={{ backgroundColor: "var(--card-bg, #FFFFFF)", borderColor: "var(--border-color, #E2E8F0)" }}
                   aria-label="Tell us about your requirements..."/>
                </div>

                <div className="space-y-2">
                  <label className="block text-[11px] font-bold text-[var(--text-secondary)] tracking-wider uppercase mb-1.5 font-display">
                    Verification Challenge
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="text-sm font-semibold h-[2.375rem] px-4 flex items-center rounded border select-none" style={{ backgroundColor: "var(--card-bg, #F1F5F9)", color: "var(--text-primary, #1E293B)", borderColor: "var(--border-color, #E2E8F0)" }}>
                      {mathProblem.question}
                    </div>
                    <button
                      type="button"
                      onClick={resetMathProblem}
                      title="Generate new calculation"
                      className="flex items-center justify-center w-[2.375rem] h-[2.375rem] border rounded hover:text-primary hover:border-primary/50 transition-colors cursor-pointer"
                      style={{ backgroundColor: "var(--card-bg, #FFFFFF)", borderColor: "var(--border-color, #E2E8F0)", color: "var(--text-secondary, #64748B)" }}
                     aria-label="Generate new calculation">
                      <RefreshCw className="w-4 h-4" />
                    </button>
                    <input 
                      type="number" 
                      required
                      placeholder="Your answer"
                      value={userMathInput}
                      onChange={(e) => setUserMathInput(e.target.value)}
                      className="flex-1 h-[2.375rem] px-3 text-sm border text-[var(--text-primary)] rounded outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all font-body"
                      style={{ backgroundColor: "var(--card-bg, #FFFFFF)", borderColor: "var(--border-color, #E2E8F0)" }}
                     aria-label="Your answer"/>
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full h-12 bg-primary text-white text-xs font-bold tracking-widest rounded-lg hover:bg-primary-dark transition-colors uppercase font-display flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  Send Message <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}

export default Contact;
