import { useToast } from '../../context/ToastContext';
// Client file archive housing documents shared within their workspace.
// Handles secure file retrievals.

import { useState, useEffect, useCallback, useMemo } from "react";
import { 
  Search, 
  FileText, 
  Link as LinkIcon, 
  Download, 
  ExternalLink,
  Plus,
  UploadCloud,
  Loader2,
  X 
} from "lucide-react";
import { getDocuments, uploadDocument } from "../../services/documentService";
import { getProjects } from "../../services/projectService";
import { exportToExcel } from "../../utils/excelExport";
import Pagination from "../../components/common/Pagination";

export default function ClientDocuments() {
  const { showToast } = useToast();
  const [documents, setDocuments] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedViewDoc, setSelectedViewDoc] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 15;

  // Upload Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formType, setFormType] = useState("FILE");
  const [formProjectId, setFormProjectId] = useState("");
  const [formFile, setFormFile] = useState(null);
  const [formLinkUrl, setFormLinkUrl] = useState("");
  const [formError, setFormError] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const fetchClientDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getDocuments();
      setDocuments(res.data?.data || []);
    } catch (err) {
      console.error("Error loading client documents:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProjects = useCallback(async () => {
    try {
      const res = await getProjects();
      setProjects(res.data?.data || []);
    } catch (err) {
      console.error("Error loading projects:", err);
    }
  }, []);

  useEffect(() => {
    fetchClientDocuments();
    fetchProjects();
  }, [fetchClientDocuments, fetchProjects]);

  const resetForm = () => {
    setFormTitle("");
    setFormDescription("");
    setFormType("FILE");
    setFormProjectId("");
    setFormFile(null);
    setFormLinkUrl("");
    setFormError("");
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!formTitle.trim()) {
      setFormError("Document title is required");
      return;
    }
    if (!formProjectId) {
      setFormError("Please select a project");
      return;
    }
    if (formType === "FILE" && !formFile) {
      setFormError("Please select a file to upload");
      return;
    }
    if (formType === "LINK" && !formLinkUrl.trim()) {
      setFormError("Please enter an external link URL");
      return;
    }

    const allowedExtensions = [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".zip", ".png", ".jpg", ".jpeg"];
    if (formType === "FILE" && formFile) {
      const ext = formFile.name.includes(".") ? formFile.name.substring(formFile.name.lastIndexOf(".")).toLowerCase() : "";
      if (!allowedExtensions.includes(ext)) {
        const msg = "File type not allowed. Allowed formats: .pdf, .doc, .docx, .xls, .xlsx, .ppt, .pptx, .zip, .png, .jpg, .jpeg";
        setFormError(msg);
        showToast(msg, "error");
        return;
      }
      if (formFile.size > 25 * 1024 * 1024) {
        const msg = "File size limit exceeded. Maximum allowed size is 25 MB.";
        setFormError(msg);
        showToast(msg, "error");
        return;
      }
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("title", formTitle.trim());
      formData.append("description", formDescription.trim());
      formData.append("type", formType);
      formData.append("projectId", formProjectId);

      if (formType === "FILE") {
        formData.append("file", formFile);
      } else {
        formData.append("linkUrl", formLinkUrl.trim());
      }

      await uploadDocument(formData);
      showToast("Document uploaded successfully!", "success");
      setIsModalOpen(false);
      resetForm();
      fetchClientDocuments();
    } catch (err) {
      console.error("Error uploading document:", err);
      const msg = err.response?.data?.message || "Failed to upload document.";
      setFormError(msg);
      showToast(msg, "error");
    } finally {
      setUploading(false);
    }
  };

  // Search filter
  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      return (
        (doc.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (doc.description || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (doc.projectName || "").toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [documents, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredDocuments.length / ITEMS_PER_PAGE));

  const paginatedDocuments = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredDocuments.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredDocuments, currentPage]);

  const handleExport = () => {
    try {
      if (filteredDocuments.length === 0) {
        showToast("No documents to export.", "error");
        return;
      }
      const mapped = filteredDocuments.map(doc => ({
        "Document Name": doc.title,
        "Project": doc.projectName,
        "Type": doc.type,
        "Date Added": doc.date,
        "Uploaded By": doc.uploader,
        "Description": doc.description || "N/A"
      }));
      exportToExcel(mapped, "Client_Documents_Export");
    } catch (err) {
      console.error("Failed to export documents:", err);
      showToast("Failed to export documents data.", "error");
    }
  };

  if (loading) {

    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center font-sans text-slate-500">
        <svg className="animate-spin h-8 w-8 text-[#4F46E5] mb-3" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <span className="text-sm font-semibold">Loading documents...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans text-left">
      
      {/* Title Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-slate-900 text-lg">Documents Vault</h1>
          <p className="text-slate-500 text-sm mt-1">
            Access and download project sign-offs, wireframe drafts, design assets, and shared links.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => { resetForm(); setIsModalOpen(true); }}
            className="inline-flex items-center gap-1.5 px-4 h-9 rounded-lg bg-[#4F46E5] hover:bg-[#3730A3] text-white text-sm font-semibold transition-all duration-150 cursor-pointer shadow-sm"
          >
            <Plus size={15} />
            Upload Document
          </button>
          <button
            onClick={handleExport}
            disabled={filteredDocuments.length === 0}
            title={filteredDocuments.length === 0 ? "No data to export" : "Export to Excel"}
            className="inline-flex items-center gap-1.5 px-4 h-9 rounded-lg border border-indigo-200 hover:border-indigo-400 text-[#4F46E5] bg-[#4F46E5]/5 hover:bg-[#4F46E5]/10 text-sm font-medium transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
           aria-label={filteredDocuments.length === 0 ? "No data to export" : "Export to Excel"}>
            <Download size={15} />
            Export Data
          </button>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="relative w-full max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
        <input
          type="text"
          placeholder="Search by title, description, or project..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-10 pl-9 pr-4 rounded-lg border border-[#CBD5E1] bg-white text-sm text-[#0F172A] placeholder-[#94A3B8] outline-none focus:border-[#4F46E5] focus:ring-[3px] focus:ring-[#4F46E5]/12 transition-all"
         aria-label="Search by title, description, or project..."/>
      </div>

      {/* Documents Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto overflow-y-hidden">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                <th className="p-4 text-xs uppercase tracking-wider text-slate-400">Name</th>
                <th className="p-4 text-xs uppercase tracking-wider text-slate-400">Project</th>
                <th className="p-4 text-xs uppercase tracking-wider text-slate-400">Type</th>
                <th className="p-4 text-xs uppercase tracking-wider text-slate-400">Date Added</th>
                <th className="p-4 text-xs uppercase tracking-wider text-slate-400">Uploaded By</th>
                <th className="p-4 text-right text-xs uppercase tracking-wider text-slate-400">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedDocuments.map((doc) => {
                const isFile = doc.type === "FILE";
                return (
                  <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-semibold text-slate-800">
                      <div 
                        className="flex items-center gap-2 cursor-pointer group/title"
                        role="button"
                        tabIndex={0}
                        aria-label={`View details of ${doc.title}`}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setSelectedViewDoc(doc);
                          }
                        }}
                        onClick={() => setSelectedViewDoc(doc)}
                      >
                        {isFile ? (
                          <FileText size={16} className="text-rose-500" />
                        ) : (
                          <LinkIcon size={16} className="text-blue-500" />
                        )}
                        <div>
                          <span className="block group-hover/title:text-[#4F46E5] group-hover/title:underline transition-colors">{doc.title}</span>
                          {doc.description && (
                            <span className="block text-xs font-normal text-slate-400 mt-0.5">
                              {doc.description}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-slate-600 font-medium">{doc.projectName}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase border ${
                        isFile 
                          ? "bg-rose-50 text-rose-700 border-rose-100" 
                          : "bg-blue-50 text-blue-700 border-blue-100"
                      }`}>
                        {doc.type}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500">{doc.date}</td>
                    <td className="p-4 text-slate-500 font-medium">{doc.uploader}</td>
                    <td className="p-4 text-right">
                      {isFile ? (
                        <a
                          href={doc.fileUrl}
                          target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[#4F46E5] hover:text-[#3730A3] hover:underline cursor-pointer"
                        >
                          <Download size={13} />
                          Download File
                        </a>
                      ) : (
                        <a
                          href={doc.linkUrl}
                          target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[#4F46E5] hover:text-[#3730A3] hover:underline cursor-pointer"
                        >
                          <ExternalLink size={13} />
                          Open Link
                        </a>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredDocuments.length === 0 && (
                <tr>
                  <td colSpan="6" className="p-12 text-center text-xs text-slate-400 italic">
                    No documents found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-4 border-t border-[#E2E8F0] bg-[#F8FAFC]/30">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredDocuments.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={(page) => setCurrentPage(page)}
          />
        </div>
      </div>

      {/* Document Details Modal */}
      {selectedViewDoc && (
        <div className="fixed inset-0 bg-[#0f172a]/45 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in font-sans">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md max-h-[90vh] overflow-y-auto animate-scale-up p-6 space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 font-display flex items-center gap-2">
                {selectedViewDoc.type === "FILE" ? <FileText size={18} className="text-rose-500" /> : <LinkIcon size={18} className="text-blue-500" />}
                Document Details
              </h2>
              <button
                onClick={() => setSelectedViewDoc(null)}
                aria-label="Close document details modal"
                className="p-1 rounded-md text-slate-400 hover:text-slate-655 hover:bg-slate-50 transition-colors cursor-pointer bg-transparent border-none"
              >
                <X size={18} />
              </button>
            </div>

            {/* Details list */}
            <div className="space-y-3.5 text-left max-h-[55vh] overflow-y-auto pr-1">
              <div>
                <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Document Name</span>
                <span className="text-sm font-semibold text-slate-800">{selectedViewDoc.title}</span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Project</span>
                  <span className="block text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-1 rounded-md mt-1 w-max">{selectedViewDoc.projectName}</span>
                </div>
                <div>
                  <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Client</span>
                  <span className="block text-xs font-semibold text-slate-700 mt-1">{selectedViewDoc.clientName || "N/A"}</span>
                </div>
              </div>

              <div>
                <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Assigned Team (Staff)</span>
                <span className="block text-xs font-medium text-slate-700 mt-1 leading-normal">{selectedViewDoc.staffMembers || "None"}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Type</span>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase border mt-1 ${
                    selectedViewDoc.type === "FILE" 
                      ? "bg-rose-50 text-rose-700 border-rose-100" 
                      : "bg-blue-50 text-blue-700 border-blue-100"
                  }`}>
                    {selectedViewDoc.type}
                  </span>
                </div>
                <div>
                  <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Date Added</span>
                  <span className="text-xs font-medium text-slate-600 block mt-1">{selectedViewDoc.date}</span>
                </div>
              </div>

              <div>
                <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Uploaded By</span>
                <span className="text-xs font-semibold text-slate-750 block mt-1">{selectedViewDoc.uploader}</span>
              </div>

              <div>
                <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Description</span>
                <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 leading-relaxed mt-1.5 whitespace-pre-wrap">
                  {selectedViewDoc.description || "No description provided."}
                </p>
              </div>
            </div>

            {/* Action footer */}
            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 mt-6">
              <button
                onClick={() => setSelectedViewDoc(null)}
                className="px-4.5 h-9 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-colors cursor-pointer bg-white"
              >
                Close
              </button>
              {selectedViewDoc.type === "FILE" ? (
                <a
                  href={selectedViewDoc.fileUrl}
                  target="_blank" rel="noopener noreferrer"
                  className="px-4.5 h-9 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Download size={13} />
                  Download File
                </a>
              ) : (
                <a
                  href={selectedViewDoc.linkUrl}
                  target="_blank" rel="noopener noreferrer"
                  className="px-4.5 h-9 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <ExternalLink size={13} />
                  Open Link
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Upload Document Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-lg overflow-hidden font-sans">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h3 className="font-display font-bold text-slate-900 text-base">
                Upload New Document
              </h3>
              <button
                type="button"
                onClick={() => { setIsModalOpen(false); resetForm(); }}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Project *</label>
                <select
                  required
                  value={formProjectId}
                  onChange={(e) => setFormProjectId(e.target.value)}
                  className="w-full h-10 px-3 border border-slate-200 rounded-xl outline-none focus:border-[#4F46E5] text-sm bg-white cursor-pointer"
                >
                  <option value="">Select a project</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Document Title *</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Design Wireframes Spec"
                  className="w-full h-10 px-3 border border-slate-200 rounded-xl outline-none focus:border-[#4F46E5] text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  rows={2}
                  placeholder="Optional details or instructions..."
                  className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-[#4F46E5] text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Type</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="type"
                      value="FILE"
                      checked={formType === "FILE"}
                      onChange={() => setFormType("FILE")}
                    />
                    File Upload (Max 25MB)
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="type"
                      value="LINK"
                      checked={formType === "LINK"}
                      onChange={() => setFormType("LINK")}
                    />
                    External Link
                  </label>
                </div>
              </div>

              {formType === "FILE" ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Choose File (Max 25MB: .pdf, .doc, .docx, .xls, .xlsx, .ppt, .pptx, .zip, .png, .jpg, .jpeg) *
                  </label>
                  <input
                    type="file"
                    onChange={(e) => setFormFile(e.target.files[0] || null)}
                    className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">External Link URL *</label>
                  <input
                    type="url"
                    required
                    value={formLinkUrl}
                    onChange={(e) => setFormLinkUrl(e.target.value)}
                    placeholder="https://figma.com/file/..."
                    className="w-full h-10 px-3 border border-slate-200 rounded-xl outline-none focus:border-[#4F46E5] text-sm"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setIsModalOpen(false); resetForm(); }}
                  className="px-4 h-9 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-5 h-9 rounded-xl bg-[#4F46E5] hover:bg-[#3730A3] text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {uploading ? <Loader2 size={14} className="animate-spin" /> : <UploadCloud size={14} />}
                  {uploading ? "Uploading..." : "Submit Document"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
