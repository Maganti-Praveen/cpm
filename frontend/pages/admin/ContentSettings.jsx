// CMS workspace for editing landing page sections and descriptions.
// Syncs texts with public views.


import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useToast } from "../../context/ToastContext";
import { useRefreshCmsSettings } from "../../context/CmsSettingsContext";
import API from "../../services/api";
import {
  Globe,
  Mail,
  HelpCircle,
  FileText,
  ShieldCheck,
  Cookie,
  Save,
  Plus,
  Trash2,
  UploadCloud,
  Image as ImageIcon,
  Loader2,
  Layout,
  ChevronDown,
  ChevronUp,
  Edit2,
  Briefcase,
  Award,
  Sparkles,
  Users,
  CheckCircle,
  Link,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Common Lucide Icon lists that can be selected in CMS dropdowns
const AVAILABLE_ICONS = [
  "LayoutDashboard",
  "Users",
  "Briefcase",
  "CheckCircle2",
  "Flag",
  "FileText",
  "Box",
  "Ticket",
  "Receipt",
  "Building",
  "ShieldCheck",
  "Mail",
  "Phone",
  "MessageSquare",
  "MapPin",
  "HelpCircle",
  "User",
  "UserCheck",
];

export default function ContentSettings() {
  const { token } = useSelector((state) => state.auth);
  const { showToast } = useToast();
  const refreshCmsSettings = useRefreshCmsSettings();

  const [activeTab, setActiveTab] = useState("welcome");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // CMS state values
  const [cmsData, setCmsData] = useState(null);

  // Fetch current CMS configuration on mount
  useEffect(() => {
    fetchCmsData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Requests CMS variables parameters from database and maps to state fields
  const fetchCmsData = async () => {
    try {
      setLoading(true);
      const res = await API.get("/cms/content");
      const json = res.data;
      if (json.success && json.data) {
        setCmsData(json.data);
      } else {
        showToast("Failed to load CMS content.");
      }
    } catch (err) {
      showToast("Error connecting to server.");
    } finally {
      setLoading(false);
    }
  };

  // Generic key change handler
  const handleKeyChange = (page, section, key, value) => {
    setCmsData((prev) => ({
      ...prev,
      [page]: {
        ...prev[page],
        [section]: {
          ...prev[page][section],
          [key]: value,
        },
      },
    }));
  };

  // Image upload handler
  const handleImageUpload = async (page, section, key, file) => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      showToast("Uploading media...");
      const res = await API.post("/cms/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      const json = res.data;

      if (json.success && json.data?.url) {
        handleKeyChange(page, section, key, json.data.url);
        showToast("Media uploaded successfully!");
      } else {
        showToast(json.message || "Upload failed.");
      }
    } catch (err) {
      showToast("Error uploading file.");
    }
  };

  // Save changes to database
  const handleSave = async (tabName) => {
    try {
      setSaving(true);
      const updates = [];

      // Extract all keys under this tab/page
      const pagesToSave = tabName === "footer" ? ["global", "contact"] : [tabName];

      pagesToSave.forEach((pageKey) => {
        const sections = cmsData[pageKey];
        if (!sections) return;

        Object.keys(sections).forEach((sectionKey) => {
          const keys = sections[sectionKey];
          Object.keys(keys).forEach((k) => {
            updates.push({
              page: pageKey,
              section: sectionKey,
              key: k,
              value: keys[k],
            });
          });
        });
      });

      const res = await API.post("/cms/content", { updates });
      const json = res.data;
      if (json.success) {
        showToast(`${tabName.toUpperCase()} section updated successfully!`);
        // Refresh dynamic variables context
        await refreshCmsSettings();
        // Dispatch window sync event
        window.dispatchEvent(new Event("cmsContentUpdated"));
      } else {
        showToast(json.message || "Failed to update content.");
      }
    } catch (err) {
      showToast("Server error during save.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-500 font-sans">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
        <span className="text-sm font-semibold">Loading CMS configuration...</span>
      </div>
    );
  }

  if (!cmsData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-500 font-sans p-6 bg-white border border-slate-200 rounded-xl">
        <span className="text-red-500 font-bold mb-2">Failed to load CMS content</span>
        <button
          onClick={fetchCmsData}
          className="px-4 py-2 bg-primary text-white text-xs font-semibold rounded hover:bg-primary-dark cursor-pointer transition-colors"
        >
          Retry Loading
        </button>
      </div>
    );
  }

  return (
    <div className="w-full font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-display">Content Settings CMS</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage all public-facing text copies, sections, logos, footers, and FAQs dynamically.
          </p>
        </div>
        <div className="flex gap-3">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 border border-slate-200 text-slate-700 text-sm font-semibold rounded hover:bg-slate-100 transition-colors inline-flex items-center gap-1.5"
          >
            Preview Site
          </a>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-[#E2E8F0] mb-8">
        <nav className="flex flex-nowrap gap-0 overflow-x-auto whitespace-nowrap">
          {[
            { id: "welcome", label: "Welcome Page" },
            { id: "contact", label: "Contact Page" },
            { id: "services", label: "Services Directory" },
            { id: "case-studies", label: "Case Studies" },
            { id: "careers", label: "Careers & Jobs" },
            { id: "about", label: "Corporate About Us" },
            { id: "privacy-policy", label: "Privacy Policy" },
            { id: "terms-of-service", label: "Terms of Service" },
            { id: "cookie-policy", label: "Cookie Policy" },
            { id: "help-center", label: "Help Center" },
            { id: "footer", label: "Footer" },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-5 py-3 text-sm font-semibold transition-colors cursor-pointer ${
                  isActive
                    ? "text-[#4F46E5]"
                    : "text-[#64748B] hover:text-[#0F172A]"
                }`}
              >
                {tab.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#4F46E5] rounded-t-full" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Panels */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 md:p-8">
        {activeTab === "welcome" && (
          <WelcomePanel
            data={cmsData.welcome}
            onChange={(sec, k, val) => handleKeyChange("welcome", sec, k, val)}
            onSave={() => handleSave("welcome")}
            saving={saving}
          />
        )}

        {activeTab === "contact" && (
          <ContactPanel
            data={cmsData.contact}
            onChange={(sec, k, val) => handleKeyChange("contact", sec, k, val)}
            onSave={() => handleSave("contact")}
            saving={saving}
          />
        )}

        {activeTab === "services" && (
          <ServicesPanel showToast={showToast} />
        )}

        {activeTab === "case-studies" && (
          <CaseStudiesPanel showToast={showToast} />
        )}

        {activeTab === "careers" && (
          <CareersPanel showToast={showToast} />
        )}

        {activeTab === "about" && (
          <AboutPanel showToast={showToast} />
        )}

        {activeTab === "help-center" && (
          <HelpCenterPanel
            data={cmsData["help-center"]}
            onChange={(sec, k, val) => handleKeyChange("help-center", sec, k, val)}
            onSave={() => handleSave("help-center")}
            saving={saving}
          />
        )}

        {activeTab === "privacy-policy" && (
          <PolicyPanel
            data={cmsData["privacy-policy"]}
            pageKey="privacy-policy"
            onChange={(sec, k, val) => handleKeyChange("privacy-policy", sec, k, val)}
            onSave={() => handleSave("privacy-policy")}
            saving={saving}
          />
        )}

        {activeTab === "terms-of-service" && (
          <PolicyPanel
            data={cmsData["terms-of-service"]}
            pageKey="terms-of-service"
            onChange={(sec, k, val) => handleKeyChange("terms-of-service", sec, k, val)}
            onSave={() => handleSave("terms-of-service")}
            saving={saving}
          />
        )}

        {activeTab === "cookie-policy" && (
          <PolicyPanel
            data={cmsData["cookie-policy"]}
            pageKey="cookie-policy"
            onChange={(sec, k, val) => handleKeyChange("cookie-policy", sec, k, val)}
            onSave={() => handleSave("cookie-policy")}
            saving={saving}
          />
        )}

        {activeTab === "footer" && (
          <FooterPanel
            data={cmsData}
            onChange={(page, sec, k, val) => handleKeyChange(page, sec, k, val)}
            onSave={() => handleSave("footer")}
            saving={saving}
          />
        )}
      </div>
    </div>
  );
}

// ---------------- WELCOME TAB PANEL ----------------
function WelcomePanel({ data, onChange, onSave, saving }) {
  const [activeSubTab, setActiveSubTab] = useState("home");
  const [features, setFeatures] = useState(data.features?.list || []);
  const [steps, setSteps] = useState(data.workflow?.list || []);

  const handleFeatureChange = (index, field, val) => {
    const updated = [...features];
    updated[index][field] = val;
    setFeatures(updated);
    onChange("features", "list", updated);
  };

  // appends list elements for dynamic feature list section previews
  const handleAddFeature = () => {
    const newFeatures = [...features, { icon: "Briefcase", title: "New Feature", description: "Describe feature benefit." }];
    setFeatures(newFeatures);
    onChange("features", "list", newFeatures);
  };

  const handleRemoveFeature = (idx) => {
    const newFeatures = features.filter((_, i) => i !== idx);
    setFeatures(newFeatures);
    onChange("features", "list", newFeatures);
  };

  const handleStepChange = (index, field, val) => {
    const updated = [...steps];
    updated[index][field] = val;
    setSteps(updated);
    onChange("workflow", "list", updated);
  };

  return (
    <div className="space-y-6">
      {/* Sub-Tabs */}
      <div className="flex flex-nowrap gap-6 overflow-x-auto whitespace-nowrap border-b border-[#E2E8F0] pb-0 mb-6">
        {[
          { id: "home", label: "Home / Hero" },
          { id: "features", label: "Features Section" },
          { id: "about", label: "About Section" },
          { id: "workflow", label: "Workflow Section" },
        ].map((subTab) => {
          const isSubActive = activeSubTab === subTab.id;
          return (
            <button
              key={subTab.id}
              onClick={() => setActiveSubTab(subTab.id)}
              className={`relative pb-3 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                isSubActive
                  ? "text-[#4F46E5]"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              {subTab.label}
              {isSubActive && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#4F46E5] rounded-t-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* Sub-panels */}
      {activeSubTab === "home" && (
        <div className="space-y-8 divide-y divide-slate-100">
          {/* Hero */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-800 font-display">Hero Section</h3>
            <div className="max-w-2xl space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Hero Title</label>
                <textarea
                  value={data.hero?.title || ""}
                  onChange={(e) => onChange("hero", "title", e.target.value)}
                  rows={3}
                  className="w-full p-3 border border-slate-200 rounded outline-none focus:border-primary text-slate-900 bg-white text-sm"
                 aria-label="W-full p-3 border border-slate-200 rounded outline-none focus:border-primary text-slate-900 bg-white text-sm"/>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Hero Subtitle</label>
                <textarea
                  value={data.hero?.subtitle || ""}
                  onChange={(e) => onChange("hero", "subtitle", e.target.value)}
                  rows={4}
                  className="w-full p-3 border border-slate-200 rounded outline-none focus:border-primary text-slate-900 bg-white text-sm"
                 aria-label="W-full p-3 border border-slate-200 rounded outline-none focus:border-primary text-slate-900 bg-white text-sm"/>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Button Text</label>
                <input
                  type="text"
                  value={data.hero?.buttonText || ""}
                  onChange={(e) => onChange("hero", "buttonText", e.target.value)}
                  className="w-full h-10 px-3 border border-slate-200 rounded outline-none focus:border-primary text-slate-900 bg-white text-sm"
                 aria-label="W-full h-10 px-3 border border-slate-200 rounded outline-none focus:border-primary text-slate-900 bg-white text-sm"/>
              </div>
            </div>
          </div>

          {/* Welcome Page Bottom CTA Banner */}
          <div className="space-y-4 pt-6">
            <h3 className="text-lg font-bold text-slate-800 font-display">Bottom CTA Banner</h3>
            <div className="max-w-2xl space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">CTA Heading Title</label>
                <input
                  type="text"
                  value={data.cta?.title || ""}
                  onChange={(e) => onChange("cta", "title", e.target.value)}
                  className="w-full h-10 px-3 border border-slate-200 rounded outline-none focus:border-primary text-slate-900 bg-white text-sm"
                  aria-label="CTA Heading Title"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">CTA Description Subtext</label>
                <textarea
                  value={data.cta?.description || ""}
                  onChange={(e) => onChange("cta", "description", e.target.value)}
                  rows={3}
                  className="w-full p-3 border border-slate-200 rounded outline-none focus:border-primary text-slate-900 bg-white text-sm"
                  aria-label="CTA Description Subtext"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">CTA Button Text</label>
                <input
                  type="text"
                  value={data.cta?.buttonText || ""}
                  onChange={(e) => onChange("cta", "buttonText", e.target.value)}
                  className="w-full h-10 px-3 border border-slate-200 rounded outline-none focus:border-primary text-slate-900 bg-white text-sm"
                  aria-label="CTA Button Text"
                />
              </div>
            </div>
          </div>

          {/* Landing stats */}
          <div className="space-y-4 pt-6">
            <h3 className="text-lg font-bold text-slate-800 font-display">Overview Statistics Cards</h3>
            <div className="max-w-md">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Statistics Title</label>
              <input
                type="text"
                value={data.stats?.title || ""}
                onChange={(e) => onChange("stats", "title", e.target.value)}
                className="w-full h-10 px-3 border border-slate-200 rounded outline-none focus:border-primary text-slate-900 bg-white text-sm"
               aria-label="W-full h-10 px-3 border border-slate-200 rounded outline-none focus:border-primary text-slate-900 bg-white text-sm"/>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
              {[1, 2, 3, 4].map((idx) => (
                <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Card {idx} Name</label>
                    <input
                      type="text"
                      value={data.stats?.[`stat${idx}_title`] || ""}
                      onChange={(e) => onChange("stats", `stat${idx}_title`, e.target.value)}
                      className="w-full h-9 px-2.5 border border-slate-200 rounded outline-none focus:border-primary text-slate-900 bg-white text-xs"
                     aria-label="W-full h-9 px-2.5 border border-slate-200 rounded outline-none focus:border-primary text-slate-900 bg-white text-xs"/>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Card {idx} Count</label>
                    <input
                      type="text"
                      value={data.stats?.[`stat${idx}_value`] || ""}
                      onChange={(e) => onChange("stats", `stat${idx}_value`, e.target.value)}
                      className="w-full h-9 px-2.5 border border-slate-200 rounded outline-none focus:border-primary text-slate-900 bg-white text-xs"
                     aria-label="W-full h-9 px-2.5 border border-slate-200 rounded outline-none focus:border-primary text-slate-900 bg-white text-xs"/>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeSubTab === "features" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-800 font-display">Features List</h3>
            <button
              onClick={handleAddFeature}
              className="px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 text-xs font-semibold rounded inline-flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add Feature Card
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Section Title</label>
              <input
                type="text"
                value={data.features?.title || ""}
                onChange={(e) => onChange("features", "title", e.target.value)}
                className="w-full h-10 px-3 border border-slate-200 rounded outline-none focus:border-primary text-slate-900 bg-white text-sm"
               aria-label="W-full h-10 px-3 border border-slate-200 rounded outline-none focus:border-primary text-slate-900 bg-white text-sm"/>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Section Subtitle</label>
              <input
                type="text"
                value={data.features?.subtitle || ""}
                onChange={(e) => onChange("features", "subtitle", e.target.value)}
                className="w-full h-10 px-3 border border-slate-200 rounded outline-none focus:border-primary text-slate-900 bg-white text-sm"
               aria-label="W-full h-10 px-3 border border-slate-200 rounded outline-none focus:border-primary text-slate-900 bg-white text-sm"/>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-4">
            {features.map((feat, idx) => (
              <div key={idx} className="p-4 border border-slate-200 bg-slate-50 rounded-xl relative group space-y-3">
                <button
                  onClick={() => handleRemoveFeature(idx)}
                  className="absolute top-2 right-2 p-1.5 bg-slate-200 hover:bg-red-100 hover:text-red-700 text-slate-600 rounded-md transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Icon</label>
                  <select
                    value={feat.icon}
                    onChange={(e) => handleFeatureChange(idx, "icon", e.target.value)}
                    className="w-full h-8 px-2 border border-slate-200 rounded outline-none bg-white text-xs"
                   aria-label="Select w-full h-8 px-2 border border-slate-200 rounded outline-none bg-white text-xs">
                    {AVAILABLE_ICONS.map((i) => (
                      <option key={i} value={i}>
                        {i}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Title</label>
                  <input
                    type="text"
                    value={feat.title}
                    onChange={(e) => handleFeatureChange(idx, "title", e.target.value)}
                    className="w-full h-8 px-2 border border-slate-200 rounded outline-none bg-white text-xs"
                   aria-label="W-full h-8 px-2 border border-slate-200 rounded outline-none bg-white text-xs"/>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Description</label>
                  <textarea
                    value={feat.description}
                    onChange={(e) => handleFeatureChange(idx, "description", e.target.value)}
                    rows={2}
                    className="w-full p-2 border border-slate-200 rounded outline-none bg-white text-xs"
                   aria-label="W-full p-2 border border-slate-200 rounded outline-none bg-white text-xs"/>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSubTab === "about" && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-800 font-display">About Section</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Section Title</label>
              <input
                type="text"
                value={data.about?.title || ""}
                onChange={(e) => onChange("about", "title", e.target.value)}
                className="w-full h-10 px-3 border border-slate-200 rounded outline-none focus:border-primary text-slate-900 bg-white text-sm"
               aria-label="W-full h-10 px-3 border border-slate-200 rounded outline-none focus:border-primary text-slate-900 bg-white text-sm"/>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Section Subtitle</label>
              <input
                type="text"
                value={data.about?.subtitle || ""}
                onChange={(e) => onChange("about", "subtitle", e.target.value)}
                className="w-full h-10 px-3 border border-slate-200 rounded outline-none focus:border-primary text-slate-900 bg-white text-sm"
               aria-label="W-full h-10 px-3 border border-slate-200 rounded outline-none focus:border-primary text-slate-900 bg-white text-sm"/>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Section Badge</label>
              <input
                type="text"
                value={data.about?.badge || ""}
                onChange={(e) => onChange("about", "badge", e.target.value)}
                className="w-full h-10 px-3 border border-slate-200 rounded outline-none focus:border-primary text-slate-900 bg-white text-sm"
               aria-label="W-full h-10 px-3 border border-slate-200 rounded outline-none focus:border-primary text-slate-900 bg-white text-sm"/>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
            {[1, 2, 3].map((cardIdx) => (
              <div key={cardIdx} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <h4 className="text-xs font-bold text-slate-700 font-display">Card {cardIdx} Configuration</h4>
                <div>
                  <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block mb-1">Icon</label>
                  <select
                    value={data.about?.[`card${cardIdx}_icon`] || "User"}
                    onChange={(e) => onChange("about", `card${cardIdx}_icon`, e.target.value)}
                    className="w-full h-8 px-2 border border-slate-200 rounded outline-none bg-white text-xs"
                   aria-label="Select w-full h-8 px-2 border border-slate-200 rounded outline-none bg-white text-xs">
                    {AVAILABLE_ICONS.map((i) => (
                      <option key={i} value={i}>
                        {i}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-455 uppercase tracking-wider block mb-1">Title</label>
                  <input
                    type="text"
                    value={data.about?.[`card${cardIdx}_title`] || ""}
                    onChange={(e) => onChange("about", `card${cardIdx}_title`, e.target.value)}
                    className="w-full h-8 px-2 border border-slate-200 rounded outline-none bg-white text-xs"
                   aria-label="W-full h-8 px-2 border border-slate-200 rounded outline-none bg-white text-xs"/>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-460 uppercase tracking-wider block mb-1">Description</label>
                  <textarea
                    value={data.about?.[`card${cardIdx}_description`] || ""}
                    onChange={(e) => onChange("about", `card${cardIdx}_description`, e.target.value)}
                    rows={3}
                    className="w-full p-2 border border-slate-200 rounded outline-none bg-white text-xs"
                   aria-label="W-full p-2 border border-slate-200 rounded outline-none bg-white text-xs"/>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSubTab === "workflow" && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-800 font-display">Workflow (How It Works) Steps</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Section Title</label>
              <input
                type="text"
                value={data.workflow?.title || ""}
                onChange={(e) => onChange("workflow", "title", e.target.value)}
                className="w-full h-10 px-3 border border-slate-200 rounded outline-none focus:border-primary text-slate-900 bg-white text-sm"
               aria-label="W-full h-10 px-3 border border-slate-200 rounded outline-none focus:border-primary text-slate-900 bg-white text-sm"/>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Section Subtitle</label>
              <input
                type="text"
                value={data.workflow?.subtitle || ""}
                onChange={(e) => onChange("workflow", "subtitle", e.target.value)}
                className="w-full h-10 px-3 border border-slate-200 rounded outline-none focus:border-primary text-slate-900 bg-white text-sm"
               aria-label="W-full h-10 px-3 border border-slate-200 rounded outline-none focus:border-primary text-slate-900 bg-white text-sm"/>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Section Badge</label>
              <input
                type="text"
                value={data.workflow?.badge || ""}
                onChange={(e) => onChange("workflow", "badge", e.target.value)}
                className="w-full h-10 px-3 border border-slate-200 rounded outline-none focus:border-primary text-slate-900 bg-white text-sm"
               aria-label="W-full h-10 px-3 border border-slate-200 rounded outline-none focus:border-primary text-slate-900 bg-white text-sm"/>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 mt-4">
            {steps.map((st, idx) => (
              <div key={idx} className="p-3 border border-slate-200 bg-slate-50 rounded-xl space-y-2">
                <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                  {idx + 1}
                </span>
                <div>
                  <label className="text-[9px] font-bold text-slate-450 uppercase block mb-0.5">Title</label>
                  <input
                    type="text"
                    value={st.title}
                    onChange={(e) => handleStepChange(idx, "title", e.target.value)}
                    className="w-full h-8 px-2 border border-slate-200 rounded bg-white text-xs outline-none focus:border-primary"
                   aria-label="W-full h-8 px-2 border border-slate-200 rounded bg-white text-xs outline-none focus:border-primary"/>
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-450 uppercase block mb-0.5">Description</label>
                  <textarea
                    value={st.description}
                    onChange={(e) => handleStepChange(idx, "description", e.target.value)}
                    rows={3}
                    className="w-full p-2 border border-slate-200 rounded bg-white text-xs outline-none focus:border-primary"
                   aria-label="W-full p-2 border border-slate-200 rounded bg-white text-xs outline-none focus:border-primary"/>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Save Button */}
      <div className="pt-6 flex justify-end border-t border-slate-100">
        <button
          onClick={onSave}
          disabled={saving}
          className="px-6 h-10 text-sm font-semibold rounded bg-primary text-white hover:bg-primary-dark cursor-pointer transition-colors shadow-sm inline-flex items-center gap-1.5"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Welcome Page
        </button>
      </div>
    </div>
  );
}

// ---------------- CONTACT TAB PANEL ----------------
function ContactPanel({ data, onChange, onSave, saving }) {
  return (
    <div className="space-y-8 divide-y divide-slate-100">
      {/* Hero */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-800 font-display">Hero & Headers</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Badge</label>
            <input
              type="text"
              value={data.hero?.badge || ""}
              onChange={(e) => onChange("hero", "badge", e.target.value)}
              className="w-full h-10 px-3 border border-slate-200 rounded outline-none focus:border-primary text-slate-900 bg-white text-sm"
             aria-label="W-full h-10 px-3 border border-slate-200 rounded outline-none focus:border-primary text-slate-900 bg-white text-sm"/>
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Main Heading</label>
            <input
              type="text"
              value={data.hero?.title || ""}
              onChange={(e) => onChange("hero", "title", e.target.value)}
              className="w-full h-10 px-3 border border-slate-200 rounded outline-none focus:border-primary text-slate-900 bg-white text-sm"
             aria-label="W-full h-10 px-3 border border-slate-200 rounded outline-none focus:border-primary text-slate-900 bg-white text-sm"/>
          </div>
          <div className="md:col-span-3">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Description</label>
            <textarea
              value={data.hero?.description || ""}
              onChange={(e) => onChange("hero", "description", e.target.value)}
              rows={3}
              className="w-full p-3 border border-slate-200 rounded outline-none focus:border-primary text-slate-900 bg-white text-sm"
             aria-label="W-full p-3 border border-slate-200 rounded outline-none focus:border-primary text-slate-900 bg-white text-sm"/>
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="space-y-4 pt-6">
        <h3 className="text-lg font-bold text-slate-800 font-display">Help Columns</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((colIdx) => (
            <div key={colIdx} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <h4 className="text-xs font-bold text-slate-700 font-display">Column {colIdx}</h4>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Icon</label>
                <select
                  value={data.columns?.[`col${colIdx}_icon`] || "Building"}
                  onChange={(e) => onChange("columns", `col${colIdx}_icon`, e.target.value)}
                  className="w-full h-8 px-2 border border-slate-200 bg-white rounded text-xs outline-none"
                 aria-label="Select w-full h-8 px-2 border border-slate-200 bg-white rounded text-xs outline-none">
                  {AVAILABLE_ICONS.map((i) => (
                    <option key={i} value={i}>
                      {i}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Title</label>
                <input
                  type="text"
                  value={data.columns?.[`col${colIdx}_title`] || ""}
                  onChange={(e) => onChange("columns", `col${colIdx}_title`, e.target.value)}
                  className="w-full h-8 px-2 border border-slate-200 bg-white rounded text-xs outline-none"
                 aria-label="W-full h-8 px-2 border border-slate-200 bg-white rounded text-xs outline-none"/>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Description</label>
                <textarea
                  value={data.columns?.[`col${colIdx}_description`] || ""}
                  onChange={(e) => onChange("columns", `col${colIdx}_description`, e.target.value)}
                  rows={3}
                  className="w-full p-2 border border-slate-200 bg-white rounded text-xs outline-none"
                 aria-label="W-full p-2 border border-slate-200 bg-white rounded text-xs outline-none"/>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sidebar Details */}
      <div className="space-y-4 pt-6">
        <h3 className="text-lg font-bold text-slate-800 font-display">Contact Sidebar & Coordinates</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Sidebar Title</label>
              <input
                type="text"
                value={data.sidebar?.title || ""}
                onChange={(e) => onChange("sidebar", "title", e.target.value)}
                className="w-full h-10 px-3 border border-slate-200 rounded bg-white text-sm outline-none focus:border-primary"
               aria-label="W-full h-10 px-3 border border-slate-200 rounded bg-white text-sm outline-none focus:border-primary"/>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Sidebar Description</label>
              <textarea
                value={data.sidebar?.description || ""}
                onChange={(e) => onChange("sidebar", "description", e.target.value)}
                rows={3}
                className="w-full p-3 border border-slate-200 rounded bg-white text-sm outline-none focus:border-primary"
               aria-label="W-full p-3 border border-slate-200 rounded bg-white text-sm outline-none focus:border-primary"/>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Office Address</label>
              <input
                type="text"
                value={data.sidebar?.address || ""}
                onChange={(e) => onChange("sidebar", "address", e.target.value)}
                className="w-full h-10 px-3 border border-slate-200 rounded bg-white text-sm outline-none focus:border-primary"
               aria-label="W-full h-10 px-3 border border-slate-200 rounded bg-white text-sm outline-none focus:border-primary"/>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Emails (comma separated)</label>
              <input
                type="text"
                value={data.sidebar?.emails || ""}
                onChange={(e) => onChange("sidebar", "emails", e.target.value)}
                className="w-full h-10 px-3 border border-slate-200 rounded bg-white text-sm outline-none focus:border-primary"
               aria-label="W-full h-10 px-3 border border-slate-200 rounded bg-white text-sm outline-none focus:border-primary"/>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Phones (comma separated)</label>
              <input
                type="text"
                value={data.sidebar?.phones || ""}
                onChange={(e) => onChange("sidebar", "phones", e.target.value)}
                className="w-full h-10 px-3 border border-slate-200 rounded bg-white text-sm outline-none focus:border-primary"
               aria-label="W-full h-10 px-3 border border-slate-200 rounded bg-white text-sm outline-none focus:border-primary"/>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">WhatsApp Label</label>
              <input
                type="text"
                value={data.sidebar?.whatsapp_label || ""}
                onChange={(e) => onChange("sidebar", "whatsapp_label", e.target.value)}
                className="w-full h-10 px-3 border border-slate-200 rounded bg-white text-sm outline-none focus:border-primary"
               aria-label="W-full h-10 px-3 border border-slate-200 rounded bg-white text-sm outline-none focus:border-primary"/>
            </div>
          </div>
        </div>

        {/* Social Links */}
        <div className="pt-4">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Social Media Account Links</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {["Twitter", "Facebook", "LinkedIn", "Instagram"].map((platform) => {
              const key = `social_${platform.toLowerCase()}`;
              return (
                <div key={platform}>
                  <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">{platform}</label>
                  <input
                    type="text"
                    value={data.sidebar?.[key] || ""}
                    onChange={(e) => onChange("sidebar", key, e.target.value)}
                    placeholder="https://"
                    className="w-full h-9 px-2.5 border border-slate-200 bg-white rounded text-xs outline-none focus:border-primary"
                   aria-label="https://"/>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="pt-6 flex justify-end">
        <button
          onClick={onSave}
          disabled={saving}
          className="px-6 h-10 text-sm font-semibold rounded bg-primary text-white hover:bg-primary-dark cursor-pointer transition-colors shadow-sm inline-flex items-center gap-1.5"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Contact Page
        </button>
      </div>
    </div>
  );
}

// ---------------- HELP CENTER TAB PANEL ----------------
function HelpCenterPanel({ data, onChange, onSave, saving }) {
  const [faqs, setFaqs] = useState(data.faqs?.list || []);
  const [guidance, setGuidance] = useState(data.guidance?.cards || []);

  const handleFaqChange = (index, field, val) => {
    const updated = [...faqs];
    updated[index][field] = val;
    setFaqs(updated);
    onChange("faqs", "list", updated);
  };

  const handleAddFaq = () => {
    const updated = [...faqs, { q: "New Question?", a: "Explain response here." }];
    setFaqs(updated);
    onChange("faqs", "list", updated);
  };

  const handleRemoveFaq = (idx) => {
    const updated = faqs.filter((_, i) => i !== idx);
    setFaqs(updated);
    onChange("faqs", "list", updated);
  };

  const handleGuidanceChange = (index, field, val) => {
    const updated = [...guidance];
    updated[index][field] = val;
    setGuidance(updated);
    onChange("guidance", "cards", updated);
  };

  return (
    <div className="space-y-8 divide-y divide-slate-100">
      {/* Header */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-800 font-display">General Banner</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Page Title</label>
            <input
              type="text"
              value={data.general?.title || ""}
              onChange={(e) => onChange("general", "title", e.target.value)}
              className="w-full h-10 px-3 border border-slate-200 rounded bg-white text-sm outline-none focus:border-primary"
             aria-label="W-full h-10 px-3 border border-slate-200 rounded bg-white text-sm outline-none focus:border-primary"/>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Page Subtitle</label>
            <input
              type="text"
              value={data.general?.subtitle || ""}
              onChange={(e) => onChange("general", "subtitle", e.target.value)}
              className="w-full h-10 px-3 border border-slate-200 rounded bg-white text-sm outline-none focus:border-primary"
             aria-label="W-full h-10 px-3 border border-slate-200 rounded bg-white text-sm outline-none focus:border-primary"/>
          </div>
        </div>
      </div>

      {/* Role Guidance */}
      <div className="space-y-4 pt-6">
        <h3 className="text-lg font-bold text-slate-800 font-display">Role Guidance Sections</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Section Title</label>
            <input
              type="text"
              value={data.guidance?.title || ""}
              onChange={(e) => onChange("guidance", "title", e.target.value)}
              className="w-full h-10 px-3 border border-slate-200 rounded bg-white text-sm outline-none focus:border-primary"
             aria-label="W-full h-10 px-3 border border-slate-200 rounded bg-white text-sm outline-none focus:border-primary"/>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Section Description</label>
            <input
              type="text"
              value={data.guidance?.description || ""}
              onChange={(e) => onChange("guidance", "description", e.target.value)}
              className="w-full h-10 px-3 border border-slate-200 rounded bg-white text-sm outline-none focus:border-primary"
             aria-label="W-full h-10 px-3 border border-slate-200 rounded bg-white text-sm outline-none focus:border-primary"/>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
          {guidance.map((card, idx) => (
            <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <h4 className="text-xs font-bold text-slate-700 font-display">Card {idx + 1}</h4>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Icon</label>
                <select
                  value={card.icon}
                  onChange={(e) => handleGuidanceChange(idx, "icon", e.target.value)}
                  className="w-full h-8 px-2 border border-slate-200 bg-white rounded text-xs outline-none focus:border-primary"
                 aria-label="Select w-full h-8 px-2 border border-slate-200 bg-white rounded text-xs outline-none focus:border-primary">
                  {AVAILABLE_ICONS.map((i) => (
                    <option key={i} value={i}>
                      {i}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Title</label>
                <input
                  type="text"
                  value={card.title}
                  onChange={(e) => handleGuidanceChange(idx, "title", e.target.value)}
                  className="w-full h-8 px-2 border border-slate-200 bg-white rounded text-xs outline-none focus:border-primary"
                 aria-label="W-full h-8 px-2 border border-slate-200 bg-white rounded text-xs outline-none focus:border-primary"/>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Description</label>
                <textarea
                  value={card.description}
                  onChange={(e) => handleGuidanceChange(idx, "description", e.target.value)}
                  rows={3}
                  className="w-full p-2 border border-slate-200 bg-white rounded text-xs outline-none focus:border-primary"
                 aria-label="W-full p-2 border border-slate-200 bg-white rounded text-xs outline-none focus:border-primary"/>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FAQs */}
      <div className="space-y-4 pt-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold text-slate-800 font-display">Frequently Asked Questions (FAQs)</h3>
          <button
            onClick={handleAddFaq}
            className="px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 text-xs font-semibold rounded inline-flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add FAQ Item
          </button>
        </div>
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Section Title</label>
          <input
            type="text"
            value={data.faqs?.title || ""}
            onChange={(e) => onChange("faqs", "title", e.target.value)}
            className="w-full h-10 px-3 border border-slate-200 rounded bg-white text-sm outline-none focus:border-primary"
           aria-label="W-full h-10 px-3 border border-slate-200 rounded bg-white text-sm outline-none focus:border-primary"/>
        </div>

        <div className="space-y-4 mt-4">
          {faqs.map((faq, idx) => (
            <div key={idx} className="p-4 border border-slate-200 bg-slate-50 rounded-xl relative group space-y-3">
              <button
                onClick={() => handleRemoveFaq(idx)}
                className="absolute top-4 right-4 p-1.5 bg-slate-200 hover:bg-red-100 hover:text-red-700 text-slate-600 rounded-md transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Question</label>
                <input
                  type="text"
                  value={faq.q}
                  onChange={(e) => handleFaqChange(idx, "q", e.target.value)}
                  className="w-full h-9 px-3 border border-slate-200 rounded bg-white text-sm outline-none"
                 aria-label="W-full h-9 px-3 border border-slate-200 rounded bg-white text-sm outline-none"/>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Answer</label>
                <textarea
                  value={faq.a}
                  onChange={(e) => handleFaqChange(idx, "a", e.target.value)}
                  rows={3}
                  className="w-full p-3 border border-slate-200 rounded bg-white text-sm outline-none"
                 aria-label="W-full p-3 border border-slate-200 rounded bg-white text-sm outline-none"/>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Support CTA */}
      <div className="space-y-4 pt-6">
        <h3 className="text-lg font-bold text-slate-800 font-display">Footer Support Banner</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">CTA Heading</label>
            <input
              type="text"
              value={data.cta?.title || ""}
              onChange={(e) => onChange("cta", "title", e.target.value)}
              className="w-full h-10 px-3 border border-slate-200 rounded bg-white text-sm outline-none"
             aria-label="W-full h-10 px-3 border border-slate-200 rounded bg-white text-sm outline-none"/>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Support Email</label>
            <input
              type="email"
              value={data.cta?.email || ""}
              onChange={(e) => onChange("cta", "email", e.target.value)}
              className="w-full h-10 px-3 border border-slate-200 rounded bg-white text-sm outline-none"
             aria-label="W-full h-10 px-3 border border-slate-200 rounded bg-white text-sm outline-none"/>
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">CTA Description</label>
            <textarea
              value={data.cta?.description || ""}
              onChange={(e) => onChange("cta", "description", e.target.value)}
              rows={3}
              className="w-full p-3 border border-slate-200 rounded bg-white text-sm outline-none"
             aria-label="W-full p-3 border border-slate-200 rounded bg-white text-sm outline-none"/>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Button Text</label>
            <input
              type="text"
              value={data.cta?.buttonText || ""}
              onChange={(e) => onChange("cta", "buttonText", e.target.value)}
              className="w-full h-10 px-3 border border-slate-200 rounded bg-white text-sm outline-none"
             aria-label="W-full h-10 px-3 border border-slate-200 rounded bg-white text-sm outline-none"/>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="pt-6 flex justify-end">
        <button
          onClick={onSave}
          disabled={saving}
          className="px-6 h-10 text-sm font-semibold rounded bg-primary text-white hover:bg-primary-dark cursor-pointer transition-colors shadow-sm inline-flex items-center gap-1.5"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Help Center
        </button>
      </div>
    </div>
  );
}

// ---------------- LEGAL POLICY TAB PANEL ----------------
function PolicyPanel({ data, pageKey, onChange, onSave, saving }) {
  const [sections, setSections] = useState(data.general?.sections || []);

  const handleSectionFieldChange = (secIdx, field, val) => {
    const updated = [...sections];
    updated[secIdx][field] = val;
    setSections(updated);
    onChange("general", "sections", updated);
  };

  const handleAddSection = () => {
    const updated = [...sections, { title: `${sections.length + 1}. New Heading`, body: "Paragraph contents." }];
    setSections(updated);
    onChange("general", "sections", updated);
  };

  const handleRemoveSection = (secIdx) => {
    const updated = sections.filter((_, i) => i !== secIdx);
    setSections(updated);
    onChange("general", "sections", updated);
  };

  const handleMoveSection = (idx, direction) => {
    if (direction === "up" && idx === 0) return;
    if (direction === "down" && idx === sections.length - 1) return;

    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    const updated = [...sections];
    const temp = updated[idx];
    updated[idx] = updated[targetIdx];
    updated[targetIdx] = temp;

    setSections(updated);
    onChange("general", "sections", updated);
  };

  // Box details handler
  const handleBoxChange = (secIdx, boxIdx, field, val) => {
    const updated = [...sections];
    if (!updated[secIdx].boxes) updated[secIdx].boxes = [];
    updated[secIdx].boxes[boxIdx][field] = val;
    setSections(updated);
    onChange("general", "sections", updated);
  };

  const handleAddBox = (secIdx) => {
    const updated = [...sections];
    if (!updated[secIdx].boxes) updated[secIdx].boxes = [];
    updated[secIdx].boxes.push({ type: "neutral", title: "Sub-section Card", intro: "Intro context.", items: [], note: "" });
    setSections(updated);
    onChange("general", "sections", updated);
  };

  const handleRemoveBox = (secIdx, boxIdx) => {
    const updated = [...sections];
    updated[secIdx].boxes = updated[secIdx].boxes.filter((_, i) => i !== boxIdx);
    setSections(updated);
    onChange("general", "sections", updated);
  };

  // Box list items editor helper
  const handleBoxItemChange = (secIdx, boxIdx, itemIdx, val) => {
    const updated = [...sections];
    updated[secIdx].boxes[boxIdx].items[itemIdx] = val;
    setSections(updated);
    onChange("general", "sections", updated);
  };

  const handleAddBoxItem = (secIdx, boxIdx) => {
    const updated = [...sections];
    if (!updated[secIdx].boxes[boxIdx].items) updated[secIdx].boxes[boxIdx].items = [];
    updated[secIdx].boxes[boxIdx].items.push("List bullet point text.");
    setSections(updated);
    onChange("general", "sections", updated);
  };

  const handleRemoveBoxItem = (secIdx, boxIdx, itemIdx) => {
    const updated = [...sections];
    updated[secIdx].boxes[boxIdx].items = updated[secIdx].boxes[boxIdx].items.filter((_, i) => i !== itemIdx);
    setSections(updated);
    onChange("general", "sections", updated);
  };

  return (
    <div className="space-y-8 divide-y divide-slate-100">
      {/* Title & Date */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-800 font-display">Document Header</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Page Title</label>
            <input
              type="text"
              value={data.general?.title || ""}
              onChange={(e) => onChange("general", "title", e.target.value)}
              className="w-full h-10 px-3 border border-slate-200 rounded bg-white text-sm outline-none"
             aria-label="W-full h-10 px-3 border border-slate-200 rounded bg-white text-sm outline-none"/>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Effective Date / Updated</label>
            <input
              type="text"
              value={data.general?.effectiveDate || ""}
              onChange={(e) => onChange("general", "effectiveDate", e.target.value)}
              className="w-full h-10 px-3 border border-slate-200 rounded bg-white text-sm outline-none"
             aria-label="W-full h-10 px-3 border border-slate-200 rounded bg-white text-sm outline-none"/>
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Intro Text</label>
            <textarea
              value={data.general?.intro || ""}
              onChange={(e) => onChange("general", "intro", e.target.value)}
              rows={4}
              className="w-full p-3 border border-slate-200 rounded bg-white text-sm outline-none"
             aria-label="W-full p-3 border border-slate-200 rounded bg-white text-sm outline-none"/>
          </div>
        </div>
      </div>

      {/* Sections List */}
      <div className="space-y-6 pt-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold text-slate-800 font-display">Policy Articles & Sections</h3>
          <button
            onClick={handleAddSection}
            className="px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 text-xs font-semibold rounded inline-flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add Section Block
          </button>
        </div>

        <div className="space-y-6 mt-4">
          {sections.map((sec, secIdx) => (
            <div key={secIdx} className="p-5 border border-slate-200 bg-slate-50 rounded-xl relative group space-y-4 shadow-xs">
              {/* Order and delete widgets */}
              <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleMoveSection(secIdx, "up")}
                  disabled={secIdx === 0}
                  className="p-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-md disabled:opacity-40 cursor-pointer"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleMoveSection(secIdx, "down")}
                  disabled={secIdx === sections.length - 1}
                  className="p-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-md disabled:opacity-40 cursor-pointer"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleRemoveSection(secIdx)}
                  className="p-1.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded-md cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Section Title</label>
                <input
                  type="text"
                  value={sec.title}
                  onChange={(e) => handleSectionFieldChange(secIdx, "title", e.target.value)}
                  className="w-full h-9 px-3 border border-slate-200 bg-white rounded text-sm outline-none focus:border-primary font-bold"
                 aria-label="W-full h-9 px-3 border border-slate-200 bg-white rounded text-sm outline-none focus:border-primary font-bold"/>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Section Body</label>
                <textarea
                  value={sec.body}
                  onChange={(e) => handleSectionFieldChange(secIdx, "body", e.target.value)}
                  rows={4}
                  className="w-full p-3 border border-slate-200 bg-white rounded text-sm outline-none focus:border-primary"
                 aria-label="W-full p-3 border border-slate-200 bg-white rounded text-sm outline-none focus:border-primary"/>
              </div>

              {/* Sub-section highlight boxes */}
              <div className="pt-2 border-t border-slate-200/60">
                <div className="flex justify-between items-center mb-3">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Highlight Boxes / Lists</label>
                  <button
                    onClick={() => handleAddBox(secIdx)}
                    className="px-2.5 py-1 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 text-[10px] font-semibold rounded cursor-pointer inline-flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add Highlight Box
                  </button>
                </div>

                <div className="space-y-4">
                  {sec.boxes &&
                    sec.boxes.map((box, boxIdx) => (
                      <div key={boxIdx} className="p-4 border border-slate-200 bg-white rounded-lg relative space-y-3 shadow-xs">
                        <button
                          onClick={() => handleRemoveBox(secIdx, boxIdx)}
                          className="absolute top-2 right-2 p-1 text-slate-400 hover:text-red-650 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Box Design</label>
                            <select
                              value={box.type}
                              onChange={(e) => handleBoxChange(secIdx, boxIdx, "type", e.target.value)}
                              className="w-full h-8 px-2 border border-slate-200 rounded text-xs outline-none"
                             aria-label="Select w-full h-8 px-2 border border-slate-200 rounded text-xs outline-none">
                              <option value="primary">Accent (Blue outline/fill)</option>
                              <option value="neutral">Neutral (Slate outline/fill)</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Box Title</label>
                            <input
                              type="text"
                              value={box.title}
                              onChange={(e) => handleBoxChange(secIdx, boxIdx, "title", e.target.value)}
                              className="w-full h-8 px-2 border border-slate-200 rounded text-xs outline-none"
                             aria-label="W-full h-8 px-2 border border-slate-200 rounded text-xs outline-none"/>
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Box Intro Text</label>
                          <textarea
                            value={box.intro}
                            onChange={(e) => handleBoxChange(secIdx, boxIdx, "intro", e.target.value)}
                            rows={2}
                            className="w-full p-2 border border-slate-200 rounded text-xs outline-none"
                           aria-label="W-full p-2 border border-slate-200 rounded text-xs outline-none"/>
                        </div>

                        {/* List bullets inside the highlight card */}
                        <div className="pl-3 border-l-2 border-slate-100 space-y-2">
                          <div className="flex justify-between items-center">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bullet Points</label>
                            <button
                              onClick={() => handleAddBoxItem(secIdx, boxIdx)}
                              className="text-[9px] font-semibold text-primary hover:underline cursor-pointer"
                            >
                              + Add Bullet
                            </button>
                          </div>
                          {box.items &&
                            box.items.map((item, itemIdx) => (
                              <div key={itemIdx} className="flex gap-2 items-center">
                                <input
                                  type="text"
                                  value={item}
                                  onChange={(e) => handleBoxItemChange(secIdx, boxIdx, itemIdx, e.target.value)}
                                  className="flex-1 h-8 px-2 border border-slate-200 rounded text-xs outline-none"
                                 aria-label="Flex-1 h-8 px-2 border border-slate-200 rounded text-xs outline-none"/>
                                <button
                                  onClick={() => handleRemoveBoxItem(secIdx, boxIdx, itemIdx)}
                                  className="p-1.5 text-slate-400 hover:text-red-500 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Bottom Note (Warning/Highlight)</label>
                          <input
                            type="text"
                            value={box.note || ""}
                            onChange={(e) => handleBoxChange(secIdx, boxIdx, "note", e.target.value)}
                            className="w-full h-8 px-2 border border-slate-200 rounded text-xs outline-none"
                           aria-label="W-full h-8 px-2 border border-slate-200 rounded text-xs outline-none"/>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <div className="pt-6 flex justify-end">
        <button
          onClick={onSave}
          disabled={saving}
          className="px-6 h-10 text-sm font-semibold rounded bg-primary text-white hover:bg-primary-dark cursor-pointer transition-colors shadow-sm inline-flex items-center gap-1.5"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save {pageKey === "privacy-policy" ? "Privacy Policy" : pageKey === "terms-of-service" ? "Terms of Service" : "Cookie Policy"}
        </button>
      </div>
    </div>
  );
}

// ---------------- FOOTER TAB PANEL ----------------
function FooterPanel({ data, onChange, onSave, saving }) {
  const globalData = data.global || {};
  const contactData = data.contact || {};

  return (
    <div className="space-y-8 divide-y divide-slate-100">
      {/* Brand & Copyright */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-800 font-display">Footer Branding</h3>
        <div className="grid grid-cols-1 gap-6">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Copyright Text</label>
            <input
              type="text"
              value={globalData.footer?.copyright || ""}
              onChange={(e) => onChange("global", "footer", "copyright", e.target.value)}
              className="w-full h-10 px-3 border border-slate-200 rounded bg-white text-sm outline-none focus:border-primary text-slate-900"
             aria-label="W-full h-10 px-3 border border-slate-200 rounded bg-white text-sm outline-none focus:border-primary text-slate-900"/>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Footer Brand Subtext</label>
            <textarea
              value={globalData.footer?.description || ""}
              onChange={(e) => onChange("global", "footer", "description", e.target.value)}
              rows={3}
              className="w-full p-3 border border-slate-200 rounded bg-white text-sm outline-none focus:border-primary text-slate-900"
             aria-label="W-full p-3 border border-slate-200 rounded bg-white text-sm outline-none focus:border-primary text-slate-900"/>
          </div>
        </div>
      </div>

      {/* Contact & Support */}
      <div className="space-y-4 pt-6">
        <h3 className="text-lg font-bold text-slate-800 font-display">Footer Contact & Support Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Office Address</label>
              <input
                type="text"
                value={contactData.sidebar?.address || ""}
                onChange={(e) => onChange("contact", "sidebar", "address", e.target.value)}
                className="w-full h-10 px-3 border border-slate-200 rounded bg-white text-sm outline-none focus:border-primary text-slate-900"
               aria-label="W-full h-10 px-3 border border-slate-200 rounded bg-white text-sm outline-none focus:border-primary text-slate-900"/>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">WhatsApp Label</label>
              <input
                type="text"
                value={contactData.sidebar?.whatsapp_label || ""}
                onChange={(e) => onChange("contact", "sidebar", "whatsapp_label", e.target.value)}
                className="w-full h-10 px-3 border border-slate-200 rounded bg-white text-sm outline-none focus:border-primary text-slate-900"
               aria-label="W-full h-10 px-3 border border-slate-200 rounded bg-white text-sm outline-none focus:border-primary text-slate-900"/>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Emails (comma separated)</label>
              <input
                type="text"
                value={contactData.sidebar?.emails || ""}
                onChange={(e) => onChange("contact", "sidebar", "emails", e.target.value)}
                className="w-full h-10 px-3 border border-slate-200 rounded bg-white text-sm outline-none focus:border-primary text-slate-900"
               aria-label="W-full h-10 px-3 border border-slate-200 rounded bg-white text-sm outline-none focus:border-primary text-slate-900"/>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Phones (comma separated)</label>
              <input
                type="text"
                value={contactData.sidebar?.phones || ""}
                onChange={(e) => onChange("contact", "sidebar", "phones", e.target.value)}
                className="w-full h-10 px-3 border border-slate-200 rounded bg-white text-sm outline-none focus:border-primary text-slate-900"
               aria-label="W-full h-10 px-3 border border-slate-200 rounded bg-white text-sm outline-none focus:border-primary text-slate-900"/>
            </div>
          </div>
        </div>
      </div>

      {/* Social Media Links */}
      <div className="space-y-4 pt-6">
        <h3 className="text-lg font-bold text-slate-800 font-display">Footer Social Media Links</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {["Twitter", "Facebook", "LinkedIn", "Instagram"].map((platform) => {
            const key = `social_${platform.toLowerCase()}`;
            return (
              <div key={platform}>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">{platform} Link</label>
                <input
                  type="text"
                  value={contactData.sidebar?.[key] || ""}
                  onChange={(e) => onChange("contact", "sidebar", key, e.target.value)}
                  placeholder="https://"
                  className="w-full h-9 px-3 border border-slate-200 bg-white rounded text-xs outline-none focus:border-primary text-slate-900"
                 aria-label="https://"/>
              </div>
            );
          })}
        </div>
      </div>

      {/* Save Button */}
      <div className="pt-6 flex justify-end">
        <button
          onClick={onSave}
          disabled={saving}
          className="px-6 h-10 text-sm font-semibold rounded bg-primary text-white hover:bg-primary-dark cursor-pointer transition-colors shadow-sm inline-flex items-center gap-1.5"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Footer Settings
        </button>
      </div>
    </div>
  );
}

// ==================== SERVICES MANAGEMENT PANEL ====================
function ServicesPanel({ showToast }) {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);

  // Form Fields
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [icon, setIcon] = useState("Cloud");
  const [image, setImage] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [fullDescription, setFullDescription] = useState("");
  const [capabilities, setCapabilities] = useState([]);
  const [benefits, setBenefits] = useState([]);
  const [techStack, setTechStack] = useState([]);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Temp item inputs for dynamic list builders
  const [capInput, setCapInput] = useState("");
  const [benInput, setBenInput] = useState("");
  const [techInput, setTechInput] = useState("");

  const AVAILABLE_ICONS = ["Cloud", "Code2", "Cpu", "ShieldCheck", "TrendingUp", "Server", "Globe", "Award", "Users", "Sparkles", "Lock", "Settings", "HelpCircle"];

  useEffect(() => {
    fetchServices();
  }, []);

  const handleUploadImage = async (file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      setUploadingImage(true);
      showToast("Uploading service image...");
      const res = await API.post("/cms/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      if (res.data?.success && res.data.data?.url) {
        setImage(res.data.data.url);
        showToast("Image uploaded successfully!");
      } else {
        showToast(res.data?.message || "Upload failed.");
      }
    } catch (err) {
      showToast("Error uploading image.");
    } finally {
      setUploadingImage(false);
    }
  };

  const fetchServices = async () => {
    try {
      setLoading(true);
      const res = await API.get("/public/services");
      if (res.data?.success) {
        setServices(res.data.data);
      }
    } catch (err) {
      showToast("Error fetching services.");
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingService(null);
    setTitle("");
    setSlug("");
    setIcon("Cloud");
    setImage("");
    setShortDescription("");
    setFullDescription("");
    setCapabilities([]);
    setBenefits([]);
    setTechStack([]);
    setIsModalOpen(true);
  };

  const openEditModal = (service) => {
    setEditingService(service);
    setTitle(service.title || "");
    setSlug(service.slug || "");
    setIcon(service.icon || "Cloud");
    setImage(service.image || "");
    setShortDescription(service.shortDescription || "");
    setFullDescription(service.fullDescription || "");
    setCapabilities(service.keyCapabilities || []);
    setBenefits(service.benefits || []);
    setTechStack(service.techStack || []);
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!title || !slug || !shortDescription || !fullDescription) {
      showToast("Please fill in all required fields.");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        title,
        slug,
        icon,
        image,
        shortDescription,
        fullDescription,
        keyCapabilities: capabilities,
        benefits,
        techStack,
      };

      if (editingService) {
        const res = await API.put(`/admin/cms/services/${editingService.id}`, payload);
        if (res.data?.success) {
          showToast("Service updated successfully!");
          setIsModalOpen(false);
          fetchServices();
        }
      } else {
        const res = await API.post("/admin/cms/services", payload);
        if (res.data?.success) {
          showToast("Service created successfully!");
          setIsModalOpen(false);
          fetchServices();
        }
      }
    } catch (err) {
      showToast("Error saving service.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this service practice area?")) return;
    try {
      const res = await API.delete(`/admin/cms/services/${id}`);
      if (res.data?.success) {
        showToast("Service deleted successfully.");
        fetchServices();
      }
    } catch (err) {
      showToast("Error deleting service.");
    }
  };

  const handleToggleActive = async (service) => {
    try {
      const res = await API.put(`/admin/cms/services/${service.id}`, {
        ...service,
        isActive: !service.isActive,
      });
      if (res.data?.success) {
        showToast(`Service ${service.isActive ? "disabled" : "enabled"} successfully.`);
        fetchServices();
      }
    } catch (err) {
      showToast("Error updating service status.");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-900 font-display">Services Portfolio CMS</h2>
        <button
          onClick={openAddModal}
          className="px-4 h-9 bg-primary text-white text-xs font-semibold rounded hover:bg-primary-dark cursor-pointer transition-colors shadow-sm inline-flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Add Service Area
        </button>
      </div>

      {/* Services Table */}
      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-xs uppercase tracking-wider">
              <th className="p-4">Service Practice Area</th>
              <th className="p-4">Slug</th>
              <th className="p-4">Icon</th>
              <th className="p-4">Tech Stack</th>
              <th className="p-4 text-center">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {services.map((srv) => (
              <tr key={srv.id} className="hover:bg-slate-50/55 transition-colors">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    {srv.image ? (
                      <img src={srv.image} alt={srv.title} className="w-14 h-9 object-cover rounded-lg border border-slate-200 flex-shrink-0 bg-slate-50" />
                    ) : (
                      <div className="w-14 h-9 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center flex-shrink-0 text-slate-400">
                        <ImageIcon className="w-4 h-4" />
                      </div>
                    )}
                    <div>
                      <div className="font-semibold text-slate-900">{srv.title}</div>
                      <div className="text-xs text-slate-500 line-clamp-1 max-w-[280px]">{srv.shortDescription}</div>
                    </div>
                  </div>
                </td>
                <td className="p-4 font-mono text-xs text-slate-600">{srv.slug}</td>
                <td className="p-4">
                  <span className="inline-flex items-center px-2 py-1 rounded bg-slate-100 text-xs text-slate-700 font-medium">
                    {srv.icon}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex flex-wrap gap-1 max-w-xs">
                    {srv.techStack?.slice(0, 3).map((tech, i) => (
                      <span key={i} className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-50 text-indigo-700 font-medium border border-indigo-100">
                        {tech}
                      </span>
                    ))}
                    {srv.techStack?.length > 3 && (
                      <span className="text-[10px] text-slate-400 font-medium">+{srv.techStack.length - 3} more</span>
                    )}
                  </div>
                </td>
                <td className="p-4 text-center">
                  <button
                    onClick={() => handleToggleActive(srv)}
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer ${
                      srv.isActive
                        ? "bg-green-100 text-green-800"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {srv.isActive ? "Active" : "Inactive"}
                  </button>
                </td>
                <td className="p-4 text-right space-x-2 whitespace-nowrap">
                  <button
                    onClick={() => openEditModal(srv)}
                    className="p-1.5 text-slate-500 hover:text-primary transition-colors cursor-pointer inline-flex items-center justify-center border border-slate-200 hover:border-primary-light rounded bg-white"
                    title="Edit"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(srv.id)}
                    className="p-1.5 text-slate-500 hover:text-red-600 transition-colors cursor-pointer inline-flex items-center justify-center border border-slate-200 hover:border-red-200 rounded bg-white"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900 font-display">
                {editingService ? "Edit Service practice area" : "Create Service practice area"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-semibold text-lg cursor-pointer"
              >
                ×
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Service Title *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      if (!editingService) {
                        setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""));
                      }
                    }}
                    className="w-full h-10 px-3 border border-slate-200 rounded-lg bg-white text-sm outline-none focus:border-primary text-slate-900"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Slug (URL Keyword) *</label>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="w-full h-10 px-3 border border-slate-200 rounded-lg bg-white text-sm outline-none focus:border-primary text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Icon *</label>
                  <select
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    className="w-full h-10 px-3 border border-slate-200 rounded-lg bg-white text-sm outline-none focus:border-primary text-slate-900"
                  >
                    {AVAILABLE_ICONS.map((name) => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Service Cover Image</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Image URL or upload below..."
                      value={image}
                      onChange={(e) => setImage(e.target.value)}
                      className="flex-1 h-10 px-3 border border-slate-200 rounded-lg bg-white text-sm outline-none focus:border-primary text-slate-900"
                    />
                    <label className="px-4 h-10 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold flex items-center justify-center cursor-pointer border border-slate-200">
                      {uploadingImage ? "Uploading..." : "Upload File"}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleUploadImage(e.target.files[0])}
                        className="hidden"
                        disabled={uploadingImage}
                      />
                    </label>
                  </div>
                  {image && (
                    <div className="mt-2 relative w-full max-w-[240px] aspect-video rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
                      <img src={image} alt="Preview" className="w-full h-full object-contain" />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Short Description *</label>
                <textarea
                  required
                  rows={2}
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-lg bg-white text-sm outline-none focus:border-primary text-slate-900"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Full Practice Overview *</label>
                <textarea
                  required
                  rows={4}
                  value={fullDescription}
                  onChange={(e) => setFullDescription(e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-lg bg-white text-sm outline-none focus:border-primary text-slate-900"
                />
              </div>

              {/* Key Capabilities */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Key Capabilities</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={capInput}
                    onChange={(e) => setCapInput(e.target.value)}
                    placeholder="Add a key capability..."
                    className="flex-1 h-10 px-3 border border-slate-200 rounded-lg bg-white text-sm outline-none focus:border-primary text-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (capInput.trim() && !capabilities.includes(capInput.trim())) {
                        setCapabilities([...capabilities, capInput.trim()]);
                        setCapInput("");
                      }
                    }}
                    className="px-4 bg-slate-900 text-white rounded-lg text-sm hover:bg-slate-800 cursor-pointer"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  {capabilities.map((cap, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-medium border border-slate-200">
                      {cap}
                      <button
                        type="button"
                        onClick={() => setCapabilities(capabilities.filter((_, idx) => idx !== i))}
                        className="text-slate-400 hover:text-slate-600 font-bold"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Benefits */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Business Benefits & Impact Metrics</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={benInput}
                    onChange={(e) => setBenInput(e.target.value)}
                    placeholder="Add a business benefit/metric..."
                    className="flex-1 h-10 px-3 border border-slate-200 rounded-lg bg-white text-sm outline-none focus:border-primary text-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (benInput.trim() && !benefits.includes(benInput.trim())) {
                        setBenefits([...benefits, benInput.trim()]);
                        setBenInput("");
                      }
                    }}
                    className="px-4 bg-slate-900 text-white rounded-lg text-sm hover:bg-slate-800 cursor-pointer"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  {benefits.map((ben, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-55/10 text-indigo-800 text-xs font-medium border border-indigo-100">
                      {ben}
                      <button
                        type="button"
                        onClick={() => setBenefits(benefits.filter((_, idx) => idx !== i))}
                        className="text-indigo-400 hover:text-indigo-600 font-bold"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Tech Stack */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Tech Stack Pills</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={techInput}
                    onChange={(e) => setTechInput(e.target.value)}
                    placeholder="Add a technology (e.g. AWS, React)..."
                    className="flex-1 h-10 px-3 border border-slate-200 rounded-lg bg-white text-sm outline-none focus:border-primary text-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (techInput.trim() && !techStack.includes(techInput.trim())) {
                        setTechStack([...techStack, techInput.trim()]);
                        setTechInput("");
                      }
                    }}
                    className="px-4 bg-slate-900 text-white rounded-lg text-sm hover:bg-slate-800 cursor-pointer"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  {techStack.map((tech, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-medium border border-emerald-100">
                      {tech}
                      <button
                        type="button"
                        onClick={() => setTechStack(techStack.filter((_, idx) => idx !== i))}
                        className="text-emerald-400 hover:text-emerald-600 font-bold"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 h-10 rounded-lg text-slate-700 hover:bg-slate-100 text-sm font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 h-10 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingService ? "Save Changes" : "Create Service"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== CAREERS & JOB OPENINGS PANEL ====================
function CareersPanel({ showToast }) {
  const [careers, setCareers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCareer, setEditingCareer] = useState(null);
  const [selectedDept, setSelectedDept] = useState("All");

  // Form Fields
  const [title, setTitle] = useState("");
  const [department, setDepartment] = useState("");
  const [location, setLocation] = useState("");
  const [type, setType] = useState("Full-time");
  const [experience, setExperience] = useState("");
  const [description, setDescription] = useState("");
  const [contactEmail, setContactEmail] = useState("careers@saiitservices.com");
  const [active, setActive] = useState(true);
  const [responsibilities, setResponsibilities] = useState([]);
  const [requirements, setRequirements] = useState([]);

  // Temp item inputs
  const [respInput, setRespInput] = useState("");
  const [reqInput, setReqInput] = useState("");

  useEffect(() => {
    fetchCareers();
  }, []);

  const fetchCareers = async () => {
    try {
      setLoading(true);
      const res = await API.get("/public/careers");
      if (res.data?.success) {
        setCareers(res.data.data);
      }
    } catch (err) {
      showToast("Error fetching careers.");
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingCareer(null);
    setTitle("");
    setDepartment("");
    setLocation("");
    setType("Full-time");
    setExperience("");
    setDescription("");
    setContactEmail("careers@saiitservices.com");
    setActive(true);
    setResponsibilities([]);
    setRequirements([]);
    setIsModalOpen(true);
  };

  const openEditModal = (job) => {
    setEditingCareer(job);
    setTitle(job.title || "");
    setDepartment(job.department || "");
    setLocation(job.location || "");
    setType(job.type || "Full-time");
    setExperience(job.experience || "");
    setDescription(job.description || "");
    setContactEmail(job.contactEmail || "careers@saiitservices.com");
    setActive(job.active);
    setResponsibilities(job.responsibilities || []);
    setRequirements(job.requirements || []);
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!title || !department || !location || !experience || !description) {
      showToast("Please fill in all required fields.");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        title,
        department,
        location,
        type,
        experience,
        description,
        responsibilities,
        requirements,
        contactEmail,
        active,
      };

      if (editingCareer) {
        const res = await API.put(`/admin/cms/careers/${editingCareer.id}`, payload);
        if (res.data?.success) {
          showToast("Career posting updated successfully!");
          setIsModalOpen(false);
          fetchCareers();
        }
      } else {
        const res = await API.post("/admin/cms/careers", payload);
        if (res.data?.success) {
          showToast("Career posting created successfully!");
          setIsModalOpen(false);
          fetchCareers();
        }
      }
    } catch (err) {
      showToast("Error saving career.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this job opening?")) return;
    try {
      const res = await API.delete(`/admin/cms/careers/${id}`);
      if (res.data?.success) {
        showToast("Career posting deleted successfully.");
        fetchCareers();
      }
    } catch (err) {
      showToast("Error deleting career.");
    }
  };

  const handleToggleActive = async (job) => {
    try {
      const res = await API.put(`/admin/cms/careers/${job.id}`, {
        ...job,
        active: !job.active,
      });
      if (res.data?.success) {
        showToast(`Job opening ${job.active ? "closed" : "opened"} successfully.`);
        fetchCareers();
      }
    } catch (err) {
      showToast("Error updating job status.");
    }
  };

  // Get distinct departments for filter options
  const departments = ["All", ...new Set(careers.map((c) => c.department).filter(Boolean))];

  const filteredCareers = selectedDept === "All"
    ? careers
    : careers.filter((c) => c.department === selectedDept);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-display">Careers & Job Postings CMS</h2>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="h-9 px-3 border border-slate-200 rounded bg-white text-xs outline-none focus:border-primary text-slate-700 font-semibold"
          >
            {departments.map((dept) => (
              <option key={dept} value={dept}>{dept} Department</option>
            ))}
          </select>
          <button
            onClick={openAddModal}
            className="px-4 h-9 bg-primary text-white text-xs font-semibold rounded hover:bg-primary-dark cursor-pointer transition-colors shadow-sm inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Post New Job
          </button>
        </div>
      </div>

      {/* Careers Table */}
      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-xs uppercase tracking-wider">
              <th className="p-4">Role Title</th>
              <th className="p-4">Department</th>
              <th className="p-4">Location & Type</th>
              <th className="p-4">Experience</th>
              <th className="p-4 text-center">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {filteredCareers.map((job) => (
              <tr key={job.id} className="hover:bg-slate-50/55 transition-colors">
                <td className="p-4">
                  <div className="font-semibold text-slate-900">{job.title}</div>
                  <div className="text-xs text-slate-500">{job.contactEmail}</div>
                </td>
                <td className="p-4 text-slate-600 font-medium">{job.department}</td>
                <td className="p-4">
                  <div className="text-slate-900 text-xs font-semibold">{job.location}</div>
                  <div className="text-slate-500 text-[10px] font-bold uppercase">{job.type}</div>
                </td>
                <td className="p-4 text-slate-600 text-xs">{job.experience}</td>
                <td className="p-4 text-center">
                  <button
                    onClick={() => handleToggleActive(job)}
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer ${
                      job.active
                        ? "bg-indigo-50 text-indigo-700 border border-indigo-100"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {job.active ? "Open" : "Closed"}
                  </button>
                </td>
                <td className="p-4 text-right space-x-2">
                  <button
                    onClick={() => openEditModal(job)}
                    className="p-1.5 text-slate-500 hover:text-primary transition-colors cursor-pointer inline-flex items-center justify-center border border-slate-200 hover:border-primary-light rounded bg-white"
                    title="Edit"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(job.id)}
                    className="p-1.5 text-slate-500 hover:text-red-600 transition-colors cursor-pointer inline-flex items-center justify-center border border-slate-200 hover:border-red-200 rounded bg-white"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900 font-display">
                {editingCareer ? "Edit Job Posting" : "Post New Career Opening"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-semibold text-lg cursor-pointer"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Job Role Title *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full h-10 px-3 border border-slate-200 rounded-lg bg-white text-sm outline-none focus:border-primary text-slate-900"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Department *</label>
                  <input
                    type="text"
                    required
                    value={department}
                    placeholder="e.g. Software Engineering"
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full h-10 px-3 border border-slate-200 rounded-lg bg-white text-sm outline-none focus:border-primary text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Location *</label>
                  <input
                    type="text"
                    required
                    value={location}
                    placeholder="e.g. Remote / Hybrid"
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full h-10 px-3 border border-slate-200 rounded-lg bg-white text-sm outline-none focus:border-primary text-slate-900"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Employment Type *</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full h-10 px-3 border border-slate-200 rounded-lg bg-white text-sm outline-none focus:border-primary text-slate-900"
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Internship">Internship</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Experience Level *</label>
                  <input
                    type="text"
                    required
                    value={experience}
                    placeholder="e.g. 5+ years"
                    onChange={(e) => setExperience(e.target.value)}
                    className="w-full h-10 px-3 border border-slate-200 rounded-lg bg-white text-sm outline-none focus:border-primary text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Candidate Application Email *</label>
                  <input
                    type="email"
                    required
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full h-10 px-3 border border-slate-200 rounded-lg bg-white text-sm outline-none focus:border-primary text-slate-900"
                  />
                </div>
                <div className="flex items-center h-full pt-6">
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={(e) => setActive(e.target.checked)}
                      className="w-4 h-4 rounded text-primary focus:ring-primary"
                    />
                    Active / Open for Applications
                  </label>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Short Job Description *</label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-lg bg-white text-sm outline-none focus:border-primary text-slate-900"
                />
              </div>

              {/* Responsibilities */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Key Responsibilities</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={respInput}
                    onChange={(e) => setRespInput(e.target.value)}
                    placeholder="Add a responsibility bullet..."
                    className="flex-1 h-10 px-3 border border-slate-200 rounded-lg bg-white text-sm outline-none focus:border-primary text-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (respInput.trim() && !responsibilities.includes(respInput.trim())) {
                        setResponsibilities([...responsibilities, respInput.trim()]);
                        setRespInput("");
                      }
                    }}
                    className="px-4 bg-slate-900 text-white rounded-lg text-sm hover:bg-slate-800 cursor-pointer"
                  >
                    Add
                  </button>
                </div>
                <ul className="space-y-1.5 pt-2 list-disc list-inside text-xs text-slate-600">
                  {responsibilities.map((resp, i) => (
                    <li key={i} className="flex items-center justify-between gap-2 p-1.5 bg-slate-50 rounded border border-slate-100">
                      <span>{resp}</span>
                      <button
                        type="button"
                        onClick={() => setResponsibilities(responsibilities.filter((_, idx) => idx !== i))}
                        className="text-red-500 font-bold px-1.5 hover:bg-slate-200 rounded"
                      >
                        Delete
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Requirements */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Candidate Requirements</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={reqInput}
                    onChange={(e) => setReqInput(e.target.value)}
                    placeholder="Add a requirement bullet..."
                    className="flex-1 h-10 px-3 border border-slate-200 rounded-lg bg-white text-sm outline-none focus:border-primary text-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (reqInput.trim() && !requirements.includes(reqInput.trim())) {
                        setRequirements([...requirements, reqInput.trim()]);
                        setReqInput("");
                      }
                    }}
                    className="px-4 bg-slate-900 text-white rounded-lg text-sm hover:bg-slate-800 cursor-pointer"
                  >
                    Add
                  </button>
                </div>
                <ul className="space-y-1.5 pt-2 list-disc list-inside text-xs text-slate-600">
                  {requirements.map((req, i) => (
                    <li key={i} className="flex items-center justify-between gap-2 p-1.5 bg-slate-50 rounded border border-slate-100">
                      <span>{req}</span>
                      <button
                        type="button"
                        onClick={() => setRequirements(requirements.filter((_, idx) => idx !== i))}
                        className="text-red-500 font-bold px-1.5 hover:bg-slate-200 rounded"
                      >
                        Delete
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 h-10 rounded-lg text-slate-700 hover:bg-slate-100 text-sm font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 h-10 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingCareer ? "Save Changes" : "Post Job"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== CORPORATE INFO & ABOUT US PANEL ====================
function AboutPanel({ showToast }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Corporate state values
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [mission, setMission] = useState("");
  const [vision, setVision] = useState("");
  const [coreValues, setCoreValues] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [stats, setStats] = useState([]);

  // Temp values
  const [newValueTitle, setNewValueTitle] = useState("");
  const [newValueDesc, setNewValueDesc] = useState("");
  const [newValueIcon, setNewValueIcon] = useState("Award");

  const [newMileYear, setNewMileYear] = useState("");
  const [newMileTitle, setNewMileTitle] = useState("");
  const [newMileDesc, setNewMileDesc] = useState("");

  const [newStatLabel, setNewStatLabel] = useState("");
  const [newStatValue, setNewStatValue] = useState("");

  const VALUE_ICONS = ["Award", "Users", "ShieldCheck", "Sparkles", "Lightbulb", "Target", "Cpu", "Globe"];

  useEffect(() => {
    fetchAboutUsData();
  }, []);

  const fetchAboutUsData = async () => {
    try {
      setLoading(true);
      const res = await API.get("/public/about");
      if (res.data?.success && res.data.data) {
        const item = res.data.data;
        setTitle(item.title || "");
        setSubtitle(item.subtitle || "");
        setMission(item.mission || "");
        setVision(item.vision || "");
        setCoreValues(item.coreValues || []);
        setMilestones(item.milestones || []);
        setStats(item.stats || []);
      }
    } catch (err) {
      showToast("Error loading corporate details.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!title || !subtitle || !mission || !vision) {
      showToast("Please fill in core corporate details.");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        title,
        subtitle,
        mission,
        vision,
        coreValues,
        milestones,
        stats,
      };

      const res = await API.put("/admin/cms/about", payload);
      if (res.data?.success) {
        showToast("Corporate settings updated successfully!");
        fetchAboutUsData();
      }
    } catch (err) {
      showToast("Error saving corporate about settings.");
    } finally {
      setSaving(false);
    }
  };

  const addCoreValue = () => {
    if (!newValueTitle || !newValueDesc) return;
    setCoreValues([...coreValues, { title: newValueTitle, description: newValueDesc, icon: newValueIcon }]);
    setNewValueTitle("");
    setNewValueDesc("");
    setNewValueIcon("Award");
  };

  const removeCoreValue = (idx) => {
    setCoreValues(coreValues.filter((_, i) => i !== idx));
  };

  const addMilestone = () => {
    if (!newMileYear || !newMileTitle || !newMileDesc) return;
    setMilestones([...milestones, { year: newMileYear, title: newMileTitle, description: newMileDesc }]);
    setNewMileYear("");
    setNewMileTitle("");
    setNewMileDesc("");
  };

  const removeMilestone = (idx) => {
    setMilestones(milestones.filter((_, i) => i !== idx));
  };

  const addStat = () => {
    if (!newStatLabel || !newStatValue) return;
    setStats([...stats, { label: newStatLabel, value: newStatValue }]);
    setNewStatLabel("");
    setNewStatValue("");
  };

  const removeStat = (idx) => {
    setStats(stats.filter((_, i) => i !== idx));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-8 divide-y divide-slate-100">
      {/* 1. Core Corporate Text */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-800 font-display">Corporate Header Copy</h3>
        <div className="grid grid-cols-1 gap-6">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Corporate Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full h-10 px-3 border border-slate-200 rounded bg-white text-sm outline-none focus:border-primary text-slate-900"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Corporate Subtitle *</label>
            <textarea
              required
              rows={2}
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              className="w-full p-3 border border-slate-200 rounded bg-white text-sm outline-none focus:border-primary text-slate-900"
            />
          </div>
        </div>
      </div>

      {/* 2. Mission & Vision */}
      <div className="space-y-4 pt-6">
        <h3 className="text-lg font-bold text-slate-800 font-display">Mission & Vision Statement</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Corporate Mission *</label>
            <textarea
              required
              rows={4}
              value={mission}
              onChange={(e) => setMission(e.target.value)}
              className="w-full p-3 border border-slate-200 rounded bg-white text-sm outline-none focus:border-primary text-slate-900"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Corporate Vision *</label>
            <textarea
              required
              rows={4}
              value={vision}
              onChange={(e) => setVision(e.target.value)}
              className="w-full p-3 border border-slate-200 rounded bg-white text-sm outline-none focus:border-primary text-slate-900"
            />
          </div>
        </div>
      </div>

      {/* 3. Core Values */}
      <div className="space-y-4 pt-6">
        <h3 className="text-lg font-bold text-slate-800 font-display">Core Pillars & Corporate Values</h3>
        <div className="space-y-4">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">Add Core Value</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <input
                  type="text"
                  placeholder="Value Title (e.g. Integrity)"
                  value={newValueTitle}
                  onChange={(e) => setNewValueTitle(e.target.value)}
                  className="w-full h-10 px-3 border border-slate-200 rounded bg-white text-xs outline-none focus:border-primary text-slate-900"
                />
              </div>
              <div>
                <select
                  value={newValueIcon}
                  onChange={(e) => setNewValueIcon(e.target.value)}
                  className="w-full h-10 px-3 border border-slate-200 rounded bg-white text-xs outline-none focus:border-primary text-slate-700"
                >
                  {VALUE_ICONS.map((ic) => (
                    <option key={ic} value={ic}>{ic} Icon</option>
                  ))}
                </select>
              </div>
              <div>
                <button
                  type="button"
                  onClick={addCoreValue}
                  className="w-full h-10 bg-slate-900 text-white rounded text-xs font-bold hover:bg-slate-800 cursor-pointer"
                >
                  Add Value Pillar
                </button>
              </div>
            </div>
            <div>
              <textarea
                placeholder="Pillar Description details..."
                rows={2}
                value={newValueDesc}
                onChange={(e) => setNewValueDesc(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded bg-white text-xs outline-none focus:border-primary text-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {coreValues.map((val, idx) => (
              <div key={idx} className="p-4 border border-slate-200 rounded-xl flex gap-3 items-start justify-between bg-white">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold text-[10px]">{val.icon}</span>
                    <span className="font-bold text-slate-800 text-sm">{val.title}</span>
                  </div>
                  <p className="text-xs text-slate-500">{val.description}</p>
                </div>
                <button
                  type="button"
                  onClick={() => removeCoreValue(idx)}
                  className="text-red-500 hover:bg-red-50 p-1 rounded"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Milestones */}
      <div className="space-y-4 pt-6">
        <h3 className="text-lg font-bold text-slate-800 font-display">Growth Milestones Timeline</h3>
        <div className="space-y-4">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">Add Timeline Milestone</div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <input
                  type="text"
                  placeholder="Year (e.g. 2026)"
                  value={newMileYear}
                  onChange={(e) => setNewMileYear(e.target.value)}
                  className="w-full h-10 px-3 border border-slate-200 rounded bg-white text-xs outline-none focus:border-primary text-slate-900"
                />
              </div>
              <div className="md:col-span-2">
                <input
                  type="text"
                  placeholder="Milestone Title"
                  value={newMileTitle}
                  onChange={(e) => setNewMileTitle(e.target.value)}
                  className="w-full h-10 px-3 border border-slate-200 rounded bg-white text-xs outline-none focus:border-primary text-slate-900"
                />
              </div>
              <div>
                <button
                  type="button"
                  onClick={addMilestone}
                  className="w-full h-10 bg-slate-900 text-white rounded text-xs font-bold hover:bg-slate-800 cursor-pointer"
                >
                  Add Milestone
                </button>
              </div>
            </div>
            <div>
              <textarea
                placeholder="Description of milestone achievement..."
                rows={2}
                value={newMileDesc}
                onChange={(e) => setNewMileDesc(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded bg-white text-xs outline-none focus:border-primary text-slate-900"
              />
            </div>
          </div>

          <div className="space-y-3">
            {milestones.map((mile, idx) => (
              <div key={idx} className="p-3 border border-slate-200 rounded-lg flex items-center justify-between bg-white text-sm">
                <div className="flex gap-4 items-center">
                  <span className="font-bold text-primary font-mono bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded text-xs">
                    {mile.year}
                  </span>
                  <div>
                    <span className="font-bold text-slate-800">{mile.title}: </span>
                    <span className="text-xs text-slate-500">{mile.description}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeMilestone(idx)}
                  className="text-red-500 hover:bg-red-50 p-1.5 rounded"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 5. Stats Counters */}
      <div className="space-y-4 pt-6">
        <h3 className="text-lg font-bold text-slate-800 font-display">Live Stat Counters</h3>
        <div className="space-y-4">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Add Corporate Stat Counter</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <input
                  type="text"
                  placeholder="Label (e.g. Projects Delivered)"
                  value={newStatLabel}
                  onChange={(e) => setNewStatLabel(e.target.value)}
                  className="w-full h-10 px-3 border border-slate-200 rounded bg-white text-xs outline-none focus:border-primary text-slate-900"
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Value Counter (e.g. 250+)"
                  value={newStatValue}
                  onChange={(e) => setNewStatValue(e.target.value)}
                  className="w-full h-10 px-3 border border-slate-200 rounded bg-white text-xs outline-none focus:border-primary text-slate-900"
                />
              </div>
              <div>
                <button
                  type="button"
                  onClick={addStat}
                  className="w-full h-10 bg-slate-900 text-white rounded text-xs font-bold hover:bg-slate-800 cursor-pointer"
                >
                  Add Stat Counter
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((st, idx) => (
              <div key={idx} className="p-4 border border-slate-200 rounded-xl bg-white flex flex-col justify-between items-center text-center relative">
                <button
                  type="button"
                  onClick={() => removeStat(idx)}
                  className="absolute top-2 right-2 text-slate-400 hover:text-red-500 rounded-full"
                >
                  ×
                </button>
                <div className="text-2xl font-black text-primary font-display mt-2">{st.value}</div>
                <div className="text-xs text-slate-500 mt-1 font-semibold">{st.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="pt-6 flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="px-6 h-10 text-sm font-semibold rounded bg-primary text-white hover:bg-primary-dark cursor-pointer transition-colors shadow-sm inline-flex items-center gap-1.5"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Corporate Details
        </button>
      </div>
    </form>
  );
}

// ==================== CASE STUDIES / PROJECTS PANEL ====================
function CaseStudiesPanel({ showToast }) {
  const [caseStudies, setCaseStudies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCaseStudy, setEditingCaseStudy] = useState(null);

  // Form Fields
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [clientName, setClientName] = useState("");
  const [industry, setIndustry] = useState("");
  const [icon, setIcon] = useState("Briefcase");
  const [image, setImage] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [fullDescription, setFullDescription] = useState("");
  const [keyResults, setKeyResults] = useState([]);
  const [technologiesUsed, setTechnologiesUsed] = useState([]);
  const [isActive, setIsActive] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Temp item inputs for list builders
  const [resultInput, setResultInput] = useState("");
  const [techInput, setTechInput] = useState("");

  const AVAILABLE_ICONS = ["Briefcase", "Cloud", "Cpu", "ShieldCheck", "TrendingUp", "Building", "Globe", "Award", "Users", "Sparkles", "Lock", "Settings", "HelpCircle"];

  useEffect(() => {
    fetchCaseStudies();
  }, []);

  const handleUploadImage = async (file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      setUploadingImage(true);
      showToast("Uploading project image...");
      const res = await API.post("/cms/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      if (res.data?.success && res.data.data?.url) {
        setImage(res.data.data.url);
        showToast("Image uploaded successfully!");
      } else {
        showToast(res.data?.message || "Upload failed.");
      }
    } catch (err) {
      showToast("Error uploading image.");
    } finally {
      setUploadingImage(false);
    }
  };

  const fetchCaseStudies = async () => {
    try {
      setLoading(true);
      const res = await API.get("/public/case-studies");
      if (res.data?.success) {
        setCaseStudies(res.data.data);
      }
    } catch (err) {
      showToast("Error fetching case studies.");
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingCaseStudy(null);
    setTitle("");
    setSlug("");
    setSubtitle("");
    setClientName("");
    setIndustry("");
    setIcon("Briefcase");
    setImage("");
    setShortDescription("");
    setFullDescription("");
    setKeyResults([]);
    setTechnologiesUsed([]);
    setIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (cs) => {
    setEditingCaseStudy(cs);
    setTitle(cs.title || "");
    setSlug(cs.slug || "");
    setSubtitle(cs.subtitle || "");
    setClientName(cs.clientName || "");
    setIndustry(cs.industry || "");
    setIcon(cs.icon || "Briefcase");
    setImage(cs.image || "");
    setShortDescription(cs.shortDescription || "");
    setFullDescription(cs.fullDescription || "");
    setKeyResults(cs.keyResults || []);
    setTechnologiesUsed(cs.technologiesUsed || []);
    setIsActive(cs.isActive !== undefined ? cs.isActive : true);
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!title || !slug || !shortDescription || !fullDescription) {
      showToast("Please fill in all required fields.");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        title,
        slug,
        subtitle,
        clientName,
        industry,
        icon,
        image,
        shortDescription,
        fullDescription,
        keyResults,
        technologiesUsed,
        isActive
      };

      if (editingCaseStudy) {
        const res = await API.put(`/admin/cms/case-studies/${editingCaseStudy.id}`, payload);
        if (res.data?.success) {
          showToast("Case study updated successfully!");
          setIsModalOpen(false);
          fetchCaseStudies();
        }
      } else {
        const res = await API.post("/admin/cms/case-studies", payload);
        if (res.data?.success) {
          showToast("Case study created successfully!");
          setIsModalOpen(false);
          fetchCaseStudies();
        }
      }
    } catch (err) {
      showToast("Error saving case study.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this case study?")) return;
    try {
      const res = await API.delete(`/admin/cms/case-studies/${id}`);
      if (res.data?.success) {
        showToast("Case study deleted successfully.");
        fetchCaseStudies();
      }
    } catch (err) {
      showToast("Error deleting case study.");
    }
  };

  const handleToggleActive = async (cs) => {
    try {
      const res = await API.put(`/admin/cms/case-studies/${cs.id}`, {
        ...cs,
        isActive: !cs.isActive,
      });
      if (res.data?.success) {
        showToast(`Case study ${cs.isActive ? "disabled" : "enabled"} successfully.`);
        fetchCaseStudies();
      }
    } catch (err) {
      showToast("Error updating case study status.");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-900 font-display">Case Studies / Projects CMS</h2>
        <button
          onClick={openAddModal}
          className="px-4 h-9 bg-primary text-white text-xs font-semibold rounded hover:bg-primary-dark cursor-pointer transition-colors shadow-sm inline-flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Add Case Study
        </button>
      </div>

      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-xs uppercase tracking-wider">
              <th className="p-4">Project / Client</th>
              <th className="p-4">Slug</th>
              <th className="p-4">Industry</th>
              <th className="p-4">Technologies</th>
              <th className="p-4 text-center">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {caseStudies.map((cs) => (
              <tr key={cs.id} className="hover:bg-slate-50/55 transition-colors">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    {cs.image ? (
                      <img src={cs.image} alt={cs.title} className="w-14 h-9 object-cover rounded-lg border border-slate-200 flex-shrink-0 bg-slate-50" />
                    ) : (
                      <div className="w-14 h-9 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center flex-shrink-0 text-slate-400">
                        <ImageIcon className="w-4 h-4" />
                      </div>
                    )}
                    <div>
                      <div className="font-semibold text-slate-900">{cs.title}</div>
                      <div className="text-xs text-slate-500 line-clamp-1 max-w-[280px]">
                        {cs.clientName ? `${cs.clientName} | ` : ""}{cs.shortDescription}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="p-4 font-mono text-xs text-slate-600">{cs.slug}</td>
                <td className="p-4">
                  <span className="inline-flex items-center px-2 py-1 rounded bg-slate-100 text-xs text-slate-700 font-medium">
                    {cs.industry || "General"}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex flex-wrap gap-1 max-w-xs">
                    {cs.technologiesUsed?.slice(0, 3).map((tech, i) => (
                      <span key={i} className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-50 text-indigo-700 font-medium border border-indigo-100">
                        {tech}
                      </span>
                    ))}
                    {cs.technologiesUsed?.length > 3 && (
                      <span className="text-[10px] text-slate-400 font-medium">+{cs.technologiesUsed.length - 3} more</span>
                    )}
                  </div>
                </td>
                <td className="p-4 text-center">
                  <button
                    onClick={() => handleToggleActive(cs)}
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer ${
                      cs.isActive
                        ? "bg-green-100 text-green-800"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {cs.isActive ? "Active" : "Inactive"}
                  </button>
                </td>
                <td className="p-4 text-right space-x-2 whitespace-nowrap">
                  <button
                    onClick={() => openEditModal(cs)}
                    className="p-1.5 text-slate-500 hover:text-primary transition-colors cursor-pointer inline-flex items-center justify-center border border-slate-200 hover:border-primary-light rounded bg-white"
                    title="Edit"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(cs.id)}
                    className="p-1.5 text-slate-500 hover:text-red-600 transition-colors cursor-pointer inline-flex items-center justify-center border border-slate-200 hover:border-red-200 rounded bg-white"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900 font-display">
                {editingCaseStudy ? "Edit Case Study" : "Create Case Study"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-semibold text-lg cursor-pointer">×</button>
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Project Title *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      if (!editingCaseStudy) {
                        setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""));
                      }
                    }}
                    className="w-full h-10 px-3 border border-slate-200 rounded-lg bg-white text-sm outline-none focus:border-primary text-slate-900"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Slug (URL Keyword) *</label>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="w-full h-10 px-3 border border-slate-200 rounded-lg bg-white text-sm outline-none focus:border-primary text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Subtitle</label>
                  <input
                    type="text"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    className="w-full h-10 px-3 border border-slate-200 rounded-lg bg-white text-sm outline-none focus:border-primary text-slate-900"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Client Name</label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full h-10 px-3 border border-slate-200 rounded-lg bg-white text-sm outline-none focus:border-primary text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Industry</label>
                  <input
                    type="text"
                    value={industry}
                    placeholder="e.g. Healthcare"
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full h-10 px-3 border border-slate-200 rounded-lg bg-white text-sm outline-none focus:border-primary text-slate-900"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Icon *</label>
                  <select
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    className="w-full h-10 px-3 border border-slate-200 rounded-lg bg-white text-sm outline-none focus:border-primary text-slate-900"
                  >
                    {AVAILABLE_ICONS.map((name) => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center h-full pt-6">
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="w-4 h-4 rounded text-primary focus:ring-primary"
                    />
                    Active / Published
                  </label>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Project Cover Image</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Image URL or upload below..."
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    className="flex-1 h-10 px-3 border border-slate-200 rounded-lg bg-white text-sm outline-none focus:border-primary text-slate-900"
                  />
                  <label className="px-4 h-10 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold flex items-center justify-center cursor-pointer border border-slate-200">
                    {uploadingImage ? "Uploading..." : "Upload File"}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleUploadImage(e.target.files[0])}
                      className="hidden"
                      disabled={uploadingImage}
                    />
                  </label>
                </div>
                {image && (
                  <div className="mt-3 relative w-full max-w-[240px] h-[140px] rounded-xl overflow-hidden border border-slate-200 bg-slate-50 shadow-xs flex items-center justify-center p-2 group/preview">
                    <img src={image} alt="Preview" className="w-full h-full object-contain rounded-lg" />
                    <span className="absolute top-2 right-2 px-1.5 py-0.5 bg-indigo-600/90 text-[8px] font-extrabold text-white rounded-md tracking-wider uppercase backdrop-blur-xs">
                      WebP Optimized
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Short Description *</label>
                <textarea
                  required
                  rows={2}
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-lg bg-white text-sm outline-none focus:border-primary text-slate-900"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Full Project Narrative *</label>
                <textarea
                  required
                  rows={4}
                  value={fullDescription}
                  onChange={(e) => setFullDescription(e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-lg bg-white text-sm outline-none focus:border-primary text-slate-900"
                />
              </div>

              {/* Key Results */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Measurable Results & Metrics</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={resultInput}
                    onChange={(e) => setResultInput(e.target.value)}
                    placeholder="Add a result (e.g. 40% cost reduction)..."
                    className="flex-1 h-10 px-3 border border-slate-200 rounded-lg bg-white text-sm outline-none focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (resultInput.trim() && !keyResults.includes(resultInput.trim())) {
                        setKeyResults([...keyResults, resultInput.trim()]);
                        setResultInput("");
                      }
                    }}
                    className="px-4 bg-slate-900 text-white rounded-lg text-sm hover:bg-slate-800"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  {keyResults.map((res, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-medium border border-emerald-100">
                      {res}
                      <button type="button" onClick={() => setKeyResults(keyResults.filter((_, idx) => idx !== i))} className="text-emerald-400 hover:text-emerald-600 font-bold">×</button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Tech Stack */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Technologies Used</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={techInput}
                    onChange={(e) => setTechInput(e.target.value)}
                    placeholder="Add a technology (e.g. React, Kubernetes)..."
                    className="flex-1 h-10 px-3 border border-slate-200 rounded-lg bg-white text-sm outline-none focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (techInput.trim() && !technologiesUsed.includes(techInput.trim())) {
                        setTechnologiesUsed([...technologiesUsed, techInput.trim()]);
                        setTechInput("");
                      }
                    }}
                    className="px-4 bg-slate-900 text-white rounded-lg text-sm hover:bg-slate-800"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  {technologiesUsed.map((tech, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-800 text-xs font-medium border border-indigo-100">
                      {tech}
                      <button type="button" onClick={() => setTechnologiesUsed(technologiesUsed.filter((_, idx) => idx !== i))} className="text-indigo-400 hover:text-indigo-600 font-bold">×</button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 h-10 rounded-lg text-slate-700 hover:bg-slate-100 text-sm font-semibold transition-colors">Cancel</button>
                <button type="submit" disabled={saving} className="px-6 h-10 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition-colors inline-flex items-center gap-1.5">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingCaseStudy ? "Save Changes" : "Create Case Study"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

