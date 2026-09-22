// Form template designer for custom registration notifications and billing templates.
// Binds variables.


import { useState, useEffect, useCallback } from "react";
import {
  FileText,
  Plus,
  Trash2,
  Edit2,
  Eye,
  ArrowLeft,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  getTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  previewTemplate,
  seedDefaultTemplates,
} from "../../../services/emailTemplateService";

// custom toggle switch component
function Toggle({ enabled, onChange, ...props }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 cursor-pointer focus:outline-none ${
        enabled ? "bg-[#4F46E5]" : "bg-[#CBD5E1]"
      }`}
      {...props}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transform transition-transform duration-200 ${
          enabled ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

// toast notification component
function Toast({ message, type = "success", onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className="fixed top-6 right-6 z-50 animate-[fadeIn_0.2s_ease-out]">
      <div className={`flex items-center gap-2.5 px-4 py-3 rounded-lg shadow-lg border text-sm font-medium ${
        type === "success"
          ? "bg-emerald-50 border-emerald-200 text-emerald-700"
          : "bg-rose-50 border-rose-200 text-rose-700"
      }`}>
        {type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
        {message}
      </div>
    </div>
  );
}

const TYPE_BADGES = {
  invoice: { bg: "bg-blue-50", text: "text-blue-700", label: "Invoice" },
  welcome: { bg: "bg-emerald-50", text: "text-emerald-700", label: "Welcome" },
  project: { bg: "bg-indigo-50", text: "text-indigo-700", label: "Project" },
  password: { bg: "bg-amber-50", text: "text-amber-700", label: "Password" },
  support: { bg: "bg-rose-50", text: "text-rose-700", label: "Support" },
  task: { bg: "bg-purple-50", text: "text-purple-700", label: "Task" },
};

const TYPES = ["invoice", "welcome", "project", "password", "support", "task"];

const emptyForm = {
  name: "",
  slug: "",
  subject: "",
  htmlContent: "",
  variables: [],
  type: "invoice",
  isActive: true,
};

export default function EmailTemplates({ embedded = false }) {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [seeding, setSeeding] = useState(false);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [variableInput, setVariableInput] = useState("");

  // Preview
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);

  // Delete
  const [deleteId, setDeleteId] = useState(null);

  const showToast = (message, type = "success") => setToast({ message, type });

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getTemplates();
      setTemplates(res.data.data || []);
    } catch {
      showToast("Failed to load templates", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  // Auto-generate slug from name
  const handleNameChange = (name) => {
    setForm((p) => ({
      ...p,
      name,
      slug: editingId ? p.slug : name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
    }));
  };

  const addVariable = () => {
    const v = variableInput.trim();
    if (v && !form.variables.includes(v)) {
      setForm((p) => ({ ...p, variables: [...p.variables, v] }));
      setVariableInput("");
    }
  };

  const removeVariable = (v) => {
    setForm((p) => ({ ...p, variables: p.variables.filter((x) => x !== v) }));
  };

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm });
    setVariableInput("");
    setModalOpen(true);
  };

  const openEdit = (tpl) => {
    setEditingId(tpl.id);
    setForm({
      name: tpl.name,
      slug: tpl.slug,
      subject: tpl.subject,
      htmlContent: tpl.htmlContent,
      variables: tpl.variables || [],
      type: tpl.type,
      isActive: tpl.isActive,
    });
    setVariableInput("");
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.slug || !form.subject || !form.htmlContent) {
      showToast("Please fill all required fields", "error");
      return;
    }
    try {
      setSaving(true);
      if (editingId) {
        await updateTemplate(editingId, form);
        showToast("Template updated");
      } else {
        await createTemplate(form);
        showToast("Template created");
      }
      setModalOpen(false);
      fetchTemplates();
    } catch (err) {
      showToast(err.response?.data?.message || "Save failed", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteTemplate(deleteId);
      showToast("Template deleted");
      setDeleteId(null);
      fetchTemplates();
    } catch {
      showToast("Delete failed", "error");
    }
  };

  const handleToggleActive = async (tpl) => {
    try {
      await updateTemplate(tpl.id, { ...tpl, isActive: !tpl.isActive });
      fetchTemplates();
    } catch {
      showToast("Toggle failed", "error");
    }
  };

  const handlePreview = async (tpl) => {
    try {
      setPreviewLoading(true);
      setPreviewOpen(true);
      const res = await previewTemplate(tpl.id, {});
      setPreviewHtml(res.data.data.html);
    } catch {
      setPreviewHtml("<p>Preview failed</p>");
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleSeedDefaults = async () => {
    try {
      setSeeding(true);
      const res = await seedDefaultTemplates();
      showToast(res.data.message || "Default templates seeded");
      fetchTemplates();
    } catch {
      showToast("Seeding failed", "error");
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        {!embedded && (
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/admin/settings")}
            className="flex items-center justify-center w-9 h-9 rounded-lg border border-[#CBD5E1] hover:bg-[#F1F5F9] transition-colors cursor-pointer shrink-0">
            <ArrowLeft size={16} className="text-[#64748B]" />
          </button>
          <div>
            <h1 className="text-[1.75rem] font-bold text-[#0F172A] font-display">Email Templates</h1>
            <p className="text-sm text-[#64748B] mt-1">Manage and customize email templates</p>
          </div>
        </div>
        )}
        <div className={`flex items-center gap-2.5 ${embedded ? 'sm:ml-auto w-full sm:w-auto justify-end' : 'w-full sm:w-auto'}`}>
          <button onClick={handleSeedDefaults} disabled={seeding}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 h-9 px-4 rounded-lg border border-[#CBD5E1] text-[#334155] hover:bg-[#F1F5F9] text-sm font-medium cursor-pointer transition-colors disabled:opacity-50">
            {seeding ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
            Seed Defaults
          </button>
          <button onClick={openCreate}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 h-9 px-4 rounded-lg bg-[#4F46E5] hover:bg-[#3730A3] text-white text-sm font-medium cursor-pointer transition-colors shadow-sm">
            <Plus size={15} /> New Template
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="bg-white rounded-xl shadow-sm border border-[#E2E8F0] flex items-center justify-center py-24">
          <Loader2 size={24} className="animate-spin text-[#4F46E5]" />
        </div>
      ) : templates.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-[#E2E8F0] flex flex-col items-center justify-center py-24 gap-3">
          <FileText size={40} className="text-[#CBD5E1]" />
          <p className="text-sm text-[#94A3B8]">No templates yet. Seed defaults or create one.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-[#E2E8F0] overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                <th className="text-left text-xs font-semibold text-[#64748B] uppercase tracking-wider px-5 py-3">Name</th>
                <th className="text-left text-xs font-semibold text-[#64748B] uppercase tracking-wider px-5 py-3">Type</th>
                <th className="text-left text-xs font-semibold text-[#64748B] uppercase tracking-wider px-5 py-3">Subject</th>
                <th className="text-center text-xs font-semibold text-[#64748B] uppercase tracking-wider px-5 py-3">Active</th>
                <th className="text-center text-xs font-semibold text-[#64748B] uppercase tracking-wider px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {templates.map((tpl) => {
                const badge = TYPE_BADGES[tpl.type] || TYPE_BADGES.invoice;
                return (
                  <tr key={tpl.id} className="border-b border-[#F1F5F9] hover:bg-[#F8FAFC]/60 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-medium text-[#0F172A]">{tpl.name}</p>
                      <p className="text-xs text-[#94A3B8] mt-0.5">{tpl.slug}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-[#475569] max-w-[250px] truncate">{tpl.subject}</td>
                    <td className="px-5 py-3.5 text-center">
                      <Toggle enabled={tpl.isActive} onChange={() => handleToggleActive(tpl)} aria-label="Toggle template active status" />
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-center gap-1.5">
                        <button onClick={() => handlePreview(tpl)} className="p-1.5 rounded-lg hover:bg-[#EEF2FF] text-[#64748B] hover:text-[#4F46E5] transition-colors cursor-pointer" title="Preview" aria-label="Preview">
                          <Eye size={15} />
                        </button>
                        <button onClick={() => openEdit(tpl)} className="p-1.5 rounded-lg hover:bg-[#EEF2FF] text-[#64748B] hover:text-[#4F46E5] transition-colors cursor-pointer" title="Edit" aria-label="Edit">
                          <Edit2 size={15} />
                        </button>
                        <button onClick={() => setDeleteId(tpl.id)} className="p-1.5 rounded-lg hover:bg-[#FEF2F2] text-[#64748B] hover:text-[#DC2626] transition-colors cursor-pointer" title="Delete" aria-label="Delete">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setModalOpen(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0]">
              <h3 className="text-lg font-semibold text-[#0F172A]">{editingId ? "Edit Template" : "New Template"}</h3>
              <button onClick={() => setModalOpen(false)} className="p-1 rounded-lg hover:bg-[#F1F5F9] cursor-pointer"><X size={18} className="text-[#64748B]" /></button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#64748B] mb-1.5">Template Name *</label>
                  <input value={form.name} onChange={(e) => handleNameChange(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-[#CBD5E1] bg-white text-sm text-[#334155] outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5]/20"
                    placeholder="Invoice Created"  aria-label="Invoice Created"/>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#64748B] mb-1.5">Slug *</label>
                  <input value={form.slug} onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
                    className="w-full h-9 px-3 rounded-lg border border-[#CBD5E1] bg-white text-sm text-[#334155] outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5]/20 font-mono"
                    placeholder="invoice-created"  aria-label="invoice-created"/>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#64748B] mb-1.5">Subject *</label>
                <input value={form.subject} onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
                  className="w-full h-9 px-3 rounded-lg border border-[#CBD5E1] bg-white text-sm text-[#334155] outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5]/20"
                  placeholder="Invoice #{{invoiceNumber}} from Sai IT Services"  aria-label="Invoice #{{invoiceNumber}} from Sai IT Services"/>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#64748B] mb-1.5">Type</label>
                <select value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
                  className="w-full h-9 px-3 rounded-lg border border-[#CBD5E1] bg-white text-sm text-[#334155] outline-none focus:border-[#4F46E5] cursor-pointer" aria-label="Select w-full h-9 px-3 rounded-lg border border-[# c b d5 e1] bg-white text-sm text-[#334155] outline-none focus:border-[#4 f46 e5] cursor-pointer">
                  {TYPES.map((t) => <option key={t} value={t}>{TYPE_BADGES[t]?.label || t}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#64748B] mb-1.5">Template Content (Plain Text) *</label>
                <textarea value={form.htmlContent} onChange={(e) => setForm((p) => ({ ...p, htmlContent: e.target.value }))}
                  rows={10}
                  className="w-full px-3 py-2 rounded-lg border border-[#CBD5E1] bg-white text-sm text-[#334155] outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5]/20 resize-y"
                  placeholder="Enter template body in plain text. (e.g. Hi {{clientName}}, new invoice created...)"  aria-label="Enter template body in plain text. (e.g. Hi {{clientName}}, new invoice created...)"/>
                <p className="text-xs text-[#94A3B8] mt-1.5">
                  Do not write HTML code. The system automatically formats your plain text message paragraphs and appends appropriate tables, highlights, or buttons according to the template type.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#64748B] mb-1.5">Variables</label>
                <div className="flex gap-2">
                  <input value={variableInput} onChange={(e) => setVariableInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addVariable())}
                    className="flex-1 h-9 px-3 rounded-lg border border-[#CBD5E1] bg-white text-sm text-[#334155] outline-none focus:border-[#4F46E5]"
                    placeholder="variableName"  aria-label="variableName"/>
                  <button onClick={addVariable} className="h-9 px-3 rounded-lg border border-[#CBD5E1] text-sm text-[#334155] hover:bg-[#F1F5F9] cursor-pointer">Add</button>
                </div>
                {form.variables.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {form.variables.map((v) => (
                      <span key={v} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#EEF2FF] text-xs font-medium text-[#4F46E5]">
                        {"{{" + v + "}}"}
                        <button onClick={() => removeVariable(v)} className="hover:text-[#DC2626] cursor-pointer"><X size={12} /></button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2.5">
                  <Toggle enabled={form.isActive} onChange={(v) => setForm((p) => ({ ...p, isActive: v }))} aria-label="Toggle active state" />
                  <span className="text-sm text-[#475569]">Active</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setModalOpen(false)}
                    className="h-9 px-4 rounded-lg border border-[#CBD5E1] text-sm font-medium text-[#334155] hover:bg-[#F1F5F9] cursor-pointer transition-colors">Cancel</button>
                  <button onClick={handleSave} disabled={saving}
                    className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-[#4F46E5] hover:bg-[#3730A3] text-white text-sm font-medium cursor-pointer transition-colors shadow-sm disabled:opacity-50">
                    {saving && <Loader2 size={14} className="animate-spin" />}
                    {editingId ? "Update" : "Create"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setPreviewOpen(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0]">
              <h3 className="text-lg font-semibold text-[#0F172A]">Template Preview</h3>
              <button onClick={() => setPreviewOpen(false)} className="p-1 rounded-lg hover:bg-[#F1F5F9] cursor-pointer"><X size={18} className="text-[#64748B]" /></button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[75vh]">
              {previewLoading ? (
                <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-[#4F46E5]" /></div>
              ) : (
                <iframe
                  srcDoc={previewHtml}
                  title="Email Preview"
                  className="w-full border border-[#E2E8F0] rounded-lg"
                  style={{ minHeight: 500 }}
                  sandbox=""
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setDeleteId(null)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-[#0F172A] mb-2">Delete Template?</h3>
            <p className="text-sm text-[#64748B] mb-5">This action cannot be undone.</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeleteId(null)}
                className="h-9 px-4 rounded-lg border border-[#CBD5E1] text-sm font-medium text-[#334155] hover:bg-[#F1F5F9] cursor-pointer">Cancel</button>
              <button onClick={handleDelete}
                className="h-9 px-4 rounded-lg bg-[#DC2626] hover:bg-[#B91C1C] text-white text-sm font-medium cursor-pointer transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
