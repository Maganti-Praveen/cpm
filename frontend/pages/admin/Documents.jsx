// File center displaying all shared document uploads.
// Supports file reviews and searches.


import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Plus, 
  Filter, 
  MoreHorizontal, 
  Search, 
  Edit2, 
  Trash2, 
  Download, 
  ExternalLink, 
  X, 
  FolderOpen, 
  FileText, 
  Link as LinkIcon, 
  UploadCloud,
  Eye 
} from "lucide-react";
import { 
  getDocuments, 
  uploadDocument, 
  updateDocument, 
  deleteDocument,
  checkCloudinaryStatus 
} from "../../services/documentService";
import { getProjects } from "../../services/projectService";
import { useToast } from "../../context/ToastContext";
import { exportToExcel } from "../../utils/excelExport";
import Pagination from "../../components/common/Pagination";

// Renders administrative storage files, directories mapping, and upload forms
function AdminDocuments() {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal & Form States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formType, setFormType] = useState("FILE"); // "FILE" or "LINK"
  const [formProjectId, setFormProjectId] = useState("");
  const [formFile, setFormFile] = useState(null);
  const [formLinkUrl, setFormLinkUrl] = useState("");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  // Search & Filters
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [projectFilter, setProjectFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [activeDropdownId, setActiveDropdownId] = useState(null);
  const [deletingDoc, setDeletingDoc] = useState(null);
  const [selectedViewDoc, setSelectedViewDoc] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 15;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, projectFilter, typeFilter]);

  const dropdownRef = useRef(null);

  // Handle Export to Excel
  const handleExport = () => {
    try {
      if (filteredDocuments.length === 0) {
        showToast("No data available to export!", "error");
        return;
      }
      const mapped = filteredDocuments.map(doc => ({
        "Document Name": doc.title || '',
        "Description": doc.description || '',
        "Project": doc.projectName || '',
        "Type": doc.type || '',
        "Created Date": doc.date || '',
        "Uploaded By": doc.uploader || '',
        "URL / Link": doc.type === 'FILE' ? (doc.fileUrl || '') : (doc.linkUrl || '')
      }));
      exportToExcel(mapped, "Documents");
    } catch (err) {
      console.error("Failed to export documents:", err);
      showToast("Failed to export documents data.", "error");
    }
  };

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActiveDropdownId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Retrieves all system documents and projects concurrently on component mount.
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [docsRes, projsRes] = await Promise.all([
        getDocuments(),
        getProjects()
      ]);
      setDocuments(docsRes.data?.data || []);
      setProjects(projsRes.data?.data || []);
    } catch (err) {
      console.error("Error loading documents page data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Loads file catalogs listings dynamically matching selected filters
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filters
  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const matchesSearch =
        (doc.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (doc.description || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (doc.projectName || "").toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesProject =
        projectFilter === "All" || doc.projectId === parseInt(projectFilter);

      const matchesType =
        typeFilter === "All" || doc.type === typeFilter;

      return matchesSearch && matchesProject && matchesType;
    });
  }, [documents, searchQuery, projectFilter, typeFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredDocuments.length / ITEMS_PER_PAGE));

  const paginatedDocuments = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredDocuments.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredDocuments, currentPage]);

  // Open Modal for Create — check Cloudinary first for FILE uploads
  const handleOpenCreateModal = async () => {
    try {
      const res = await checkCloudinaryStatus();
      const enabled = res.data?.data?.enabled;
      if (!enabled) {
        showToast("Cloud storage is not configured. Redirecting to settings...", "error");
        navigate("/admin/settings");
        return;
      }
    } catch (err) {
      // If we can't check, allow the modal to open — backend will enforce
      console.warn("Could not check Cloudinary status:", err);
    }
    setEditingDoc(null);
    setFormTitle("");
    setFormDescription("");
    setFormType("FILE");
    setFormProjectId(projects[0]?.id?.toString() || "");
    setFormFile(null);
    setFormLinkUrl("");
    setFormError("");
    setIsModalOpen(true);
  };

  // Open Modal for Edit
  const handleOpenEditModal = (doc) => {
    setEditingDoc(doc);
    setFormTitle(doc.title);
    setFormDescription(doc.description || "");
    setFormType(doc.type);
    setFormProjectId(doc.projectId?.toString() || "");
    setFormFile(null);
    setFormLinkUrl(doc.linkUrl || "");
    setFormError("");
    setIsModalOpen(true);
    setActiveDropdownId(null);
  };

  // Form Submit Handler
  const handleSaveDocument = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!formTitle.trim()) {
      setFormError("Title is required");
      return;
    }
    if (!formProjectId) {
      setFormError("Please select a project");
      return;
    }
    if (formType === "FILE" && !editingDoc && !formFile) {
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
        setFormError("File type not allowed. Allowed formats: .pdf, .doc, .docx, .xls, .xlsx, .ppt, .pptx, .zip, .png, .jpg, .jpeg");
        showToast("File type not allowed.", "error");
        return;
      }
      if (formFile.size > 25 * 1024 * 1024) {
        setFormError("File size limit exceeded. Maximum allowed size is 25 MB.");
        showToast("File size limit exceeded. Maximum allowed size is 25 MB.", "error");
        return;
      }
    }

    setSaving(true);

    try {
      const formData = new FormData();
      formData.append("title", formTitle.trim());
      formData.append("description", formDescription.trim());
      formData.append("type", formType);
      formData.append("projectId", formProjectId);

      if (formType === "FILE") {
        if (formFile) {
          formData.append("file", formFile);
        }
      } else {
        formData.append("linkUrl", formLinkUrl.trim());
      }

      if (editingDoc) {
        await updateDocument(editingDoc.id, formData);
        showToast("Document updated successfully!", "success");
      } else {
        await uploadDocument(formData);
        showToast("Document uploaded successfully!", "success");
      }

      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      console.error("Error saving document:", err);
      if (err.response?.data?.contactAdmin) {
        showToast("File upload service is not configured. Please contact the administrator.", "error");
        setFormError("File upload service is not configured. Please contact the administrator.");
        return;
      }
      if (err.response?.data?.redirectToSettings) {
        showToast("Cloud storage is not configured. Redirecting to settings...", "error");
        setIsModalOpen(false);
        navigate("/admin/settings");
        return;
      }
      setFormError(err.response?.data?.message || "Failed to save document record");
    } finally {
      setSaving(false);
    }
  };

  // Delete Action
  const handleDeleteClick = (doc) => {
    setDeletingDoc(doc);
    setActiveDropdownId(null);
  };

  // Executes storage delete action to clean target files and tables
  const confirmDelete = async () => {
    if (!deletingDoc) return;
    try {
      await deleteDocument(deletingDoc.id);
      showToast("Document deleted successfully!", "success");
      setDeletingDoc(null);
      fetchData();
    } catch (err) {
      console.error("Error deleting document:", err);
      showToast("Failed to delete document: " + (err.response?.data?.message || err.message), "error");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[1.75rem] font-bold text-[#0F172A] font-display">
            Documents
          </h1>
          <p className="text-sm text-[#64748B] mt-1 font-sans">
            Manage project documents, deliverables, and external links
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto shrink-0">
          {/* Export to Excel */}
          <button
            onClick={handleExport}
            disabled={filteredDocuments.length === 0}
            title={filteredDocuments.length === 0 ? "No data available to export!" : "Export to Excel"}
            className="inline-flex items-center gap-1.5 px-4 h-9 rounded-[--radius-md] border border-indigo-200 hover:border-indigo-400 text-[#4F46E5] bg-[#4F46E5]/5 hover:bg-[#4F46E5]/10 text-sm font-medium transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
           aria-label={filteredDocuments.length === 0 ? "No data available to export!" : "Export to Excel"}>
            <Download size={15} />
            Export Data
          </button>

          {/* Filter Toggle Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-1.5 px-4 h-9 rounded-lg border text-sm font-medium transition-all duration-155 cursor-pointer ${
              showFilters
                ? "bg-slate-100 border-slate-300 text-slate-800"
                : "border-[#CBD5E1] text-[#475569] bg-white hover:bg-[#F1F5F9] hover:border-[#94A3B8]"
            }`}
          >
            <Filter size={15} />
            Filter
          </button>
          
          {/* New Document Button */}
          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center justify-center gap-1.5 px-4 h-9 rounded-lg bg-[#4F46E5] text-sm font-medium text-white hover:bg-[#3730A3] transition-all duration-150 cursor-pointer shadow-sm flex-1 sm:flex-none"
          >
            <Plus size={16} />
            New Document
          </button>
        </div>
      </div>

      {/* Filters Section (Toggled) */}
      {showFilters && (
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 flex flex-col md:flex-row items-center gap-4 shadow-sm transition-all duration-200">
          <div className="relative flex-1 w-full">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <input
              type="text"
              placeholder="Search by title, description, or project..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-[2.375rem] pl-9 pr-4 rounded-lg border border-[#CBD5E1] bg-white text-sm text-[#0F172A] placeholder-[#94A3B8] outline-none focus:border-[#4F46E5] focus:ring-[3px] focus:ring-[#4F46E5]/12 transition-all"
             aria-label="Search by title, description, or project..."/>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-4 w-full md:w-auto shrink-0">
            {/* Project Filter */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Project:</span>
              <select
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
                className="h-[2.375rem] px-3 rounded-lg border border-[#CBD5E1] bg-white text-sm text-[#0F172A] outline-none focus:border-[#4F46E5] focus:ring-[3px] focus:ring-[#4F46E5]/12 transition-all cursor-pointer w-full sm:w-44"
               aria-label="Select h-[2.375rem] px-3 rounded-lg border border-[# c b d5 e1] bg-white text-sm text-[#0 f172 a] outline-none focus:border-[#4 f46 e5] focus:ring-[3px] focus:ring-[#4 f46 e5]/12 transition-all cursor-pointer w-full sm:w-44">
                <option value="All">All Projects</option>
                {projects.map((proj) => (
                  <option key={proj.id} value={proj.id}>{proj.name}</option>
                ))}
              </select>
            </div>

            {/* Type Filter */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Type:</span>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="h-[2.375rem] px-3 rounded-lg border border-[#CBD5E1] bg-white text-sm text-[#0F172A] outline-none focus:border-[#4F46E5] focus:ring-[3px] focus:ring-[#4F46E5]/12 transition-all cursor-pointer w-full sm:w-36"
               aria-label="Select h-[2.375rem] px-3 rounded-lg border border-[# c b d5 e1] bg-white text-sm text-[#0 f172 a] outline-none focus:border-[#4 f46 e5] focus:ring-[3px] focus:ring-[#4 f46 e5]/12 transition-all cursor-pointer w-full sm:w-36">
                <option value="All">All Types</option>
                <option value="FILE">FILE</option>
                <option value="LINK">LINK</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Loading Indicator */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-[#E2E8F0] shadow-sm">
          <svg className="animate-spin h-8 w-8 text-[#4F46E5] mb-3" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-xs text-slate-500 font-semibold">Loading documents...</span>
        </div>
      ) : (
        /* Documents Table */
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden font-sans">
          <div 
            className="overflow-x-auto overflow-y-hidden"
            style={{ paddingBottom: activeDropdownId ? '140px' : '0px' }}
          >
            <table className="w-full min-w-[800px] text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                  <th scope="col" className="py-3.5 px-5 text-[0.6875rem] font-semibold text-[#64748B] uppercase tracking-[0.05em]">
                    Document Name
                  </th>
                  <th scope="col" className="py-3.5 px-4 text-[0.6875rem] font-semibold text-[#64748B] uppercase tracking-[0.05em]">
                    Project
                  </th>
                  <th scope="col" className="py-3.5 px-4 text-[0.6875rem] font-semibold text-[#64748B] uppercase tracking-[0.05em]">
                    Type
                  </th>
                  <th scope="col" className="py-3.5 px-4 text-[0.6875rem] font-semibold text-[#64748B] uppercase tracking-[0.05em]">
                    Created Date
                  </th>
                  <th scope="col" className="py-3.5 px-4 text-[0.6875rem] font-semibold text-[#64748B] uppercase tracking-[0.05em]">
                    Uploaded By
                  </th>
                  <th scope="col" className="text-center py-3.5 px-4 text-[0.6875rem] font-semibold text-[#64748B] uppercase tracking-[0.05em]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedDocuments.map((doc) => {
                  const isFile = doc.type === "FILE";
                  return (
                    <tr
                      key={doc.id}
                      className="border-b border-[#F1F5F9] last:border-b-0 hover:bg-[#F8FAFC]/50 transition-colors"
                    >
                      <td className="py-4 px-5">
                        <div 
                          className="flex items-center gap-3 cursor-pointer group/title"
                          onClick={() => setSelectedViewDoc(doc)}
                        >
                          <div className={`w-8.5 h-8.5 rounded-lg flex items-center justify-center shrink-0 ${
                            isFile ? "bg-rose-50 text-rose-500" : "bg-blue-50 text-blue-500"
                          }`}>
                            {isFile ? <FileText size={16} /> : <LinkIcon size={16} />}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-[#0F172A] truncate max-w-xs md:max-w-md group-hover/title:text-[#4F46E5] group-hover/title:underline transition-colors">
                              {doc.title}
                            </p>
                            {doc.description && (
                              <p className="text-xs text-[#64748B] truncate max-w-xs md:max-w-md font-medium mt-0.5">
                                {doc.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-xs font-semibold text-[#475569]">
                          {doc.projectName}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase border ${
                          isFile 
                            ? "bg-rose-50 text-rose-700 border-rose-100" 
                            : "bg-blue-50 text-blue-700 border-blue-100"
                        }`}>
                          {doc.type}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-xs font-medium text-[#64748B]">
                        {doc.date}
                      </td>
                      <td className="py-4 px-4 text-xs font-medium text-[#475569]">
                        {doc.uploader}
                      </td>
                      <td className="py-4 px-4 text-center relative">
                        <button
                          onClick={() => setActiveDropdownId(activeDropdownId === doc.id ? null : doc.id)}
                          className="p-1.5 rounded-md hover:bg-[#F1F5F9] text-[#94A3B8] hover:text-[#475569] cursor-pointer transition-colors"
                          aria-label="Document actions dropdown"
                        >
                          <MoreHorizontal size={16} />
                        </button>

                        {/* Dropdown Menu */}
                        {activeDropdownId === doc.id && (
                          <div
                            ref={dropdownRef}
                            className="absolute right-4 mt-1 w-40 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 z-30 text-left animate-fade-in"
                          >
                            {/* Download / View action */}
                            {isFile ? (
                              <a
                                href={doc.fileUrl}
                                target="_blank" rel="noopener noreferrer"
                                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2 cursor-pointer"
                                onClick={() => setActiveDropdownId(null)}
                              >
                                <Download size={13} className="text-slate-400" />
                                Download File
                              </a>
                            ) : (
                              <a
                                href={doc.linkUrl}
                                target="_blank" rel="noopener noreferrer"
                                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2 cursor-pointer"
                                onClick={() => setActiveDropdownId(null)}
                              >
                                <ExternalLink size={13} className="text-slate-400" />
                                Open Link
                              </a>
                            )}
                            
                            <button
                              onClick={() => { setSelectedViewDoc(doc); setActiveDropdownId(null); }}
                              className="w-full px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2 cursor-pointer border-t border-slate-50"
                            >
                              <Eye size={13} className="text-slate-400" />
                              View Details
                            </button>
                            <button
                              onClick={() => handleOpenEditModal(doc)}
                              className="w-full px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2 cursor-pointer border-t border-slate-50"
                            >
                              <Edit2 size={13} className="text-slate-400" />
                              Edit Document
                            </button>
                            <button
                              onClick={() => handleDeleteClick(doc)}
                              className="w-full px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50/50 transition-colors flex items-center gap-2 cursor-pointer border-t border-slate-50"
                            >
                              <Trash2 size={13} className="text-rose-400" />
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {filteredDocuments.length === 0 && (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-sm text-[#64748B] font-medium bg-white">
                      No documents match your query and filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Footer stats */}
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
      )}

      {/* New / Edit Document Overlay Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#0f172a]/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in font-sans">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg max-h-[90vh] overflow-y-auto animate-scale-up">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 font-display">
                {editingDoc ? "Edit Document Record" : "Add New Document"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer hover:bg-slate-55 bg-transparent border-none rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSaveDocument} className="p-6 space-y-4 text-left">
              
              {formError && (
                <div className="bg-rose-55/10 border border-rose-200 rounded-lg p-3 text-xs font-semibold text-rose-700">
                  {formError}
                </div>
              )}

              {/* Title input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Document Title</label>
                <input
                  type="text"
                  placeholder="e.g. Project Requirements Spec"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-[#CBD5E1] bg-white text-sm text-[#0F172A] placeholder-[#94A3B8] outline-none focus:border-[#4F46E5] focus:ring-[3px] focus:ring-[#4F46E5]/12 transition-all"
                  required
                 aria-label="e.g. Project Requirements Spec"/>
              </div>

              {/* Project select dropdown */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Assign to Project</label>
                <select
                  value={formProjectId}
                  onChange={(e) => setFormProjectId(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-[#CBD5E1] bg-white text-sm text-[#0F172A] outline-none focus:border-[#4F46E5] focus:ring-[3px] focus:ring-[#4F46E5]/12 transition-all cursor-pointer"
                  required
                 aria-label="Select w-full h-10 px-3 rounded-lg border border-[# c b d5 e1] bg-white text-sm text-[#0 f172 a] outline-none focus:border-[#4 f46 e5] focus:ring-[3px] focus:ring-[#4 f46 e5]/12 transition-all cursor-pointer">
                  <option value="" disabled>Select Project</option>
                  {projects.map((proj) => (
                    <option key={proj.id} value={proj.id}>{proj.name}</option>
                  ))}
                </select>
              </div>

              {/* Type radios */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">Upload Type</label>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 text-sm text-slate-700 font-semibold cursor-pointer">
                    <input
                      type="radio"
                      name="formType"
                      value="FILE"
                      checked={formType === "FILE"}
                      onChange={() => setFormType("FILE")}
                      className="w-4 h-4 text-[#4F46E5] focus:ring-[#4F46E5]"
                     aria-label="Form Type"/>
                    Upload Local File
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-700 font-semibold cursor-pointer">
                    <input
                      type="radio"
                      name="formType"
                      value="LINK"
                      checked={formType === "LINK"}
                      onChange={() => setFormType("LINK")}
                      className="w-4 h-4 text-[#4F46E5] focus:ring-[#4F46E5]"
                     aria-label="Form Type"/>
                    External URL Link
                  </label>
                </div>
              </div>

              {/* Conditionally show File input or Link input */}
              {formType === "FILE" ? (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">File Attachment</label>
                  {editingDoc && (
                    <p className="text-[11px] text-indigo-600 font-medium mb-1">
                      Current: <span className="underline">{editingDoc.fileUrl ? editingDoc.fileUrl.split("/").pop() : "None"}</span> (Upload a new file only to replace it)
                    </p>
                  )}
                  <div className="border border-dashed border-[#CBD5E1] hover:border-[#4F46E5] rounded-lg p-4 flex flex-col items-center justify-center bg-slate-50/50 transition-colors relative">
                    <UploadCloud size={28} className="text-[#94A3B8] mb-2" />
                    <span className="text-xs font-semibold text-slate-600">
                      {formFile ? formFile.name : "Click to select a file"}
                    </span>
                    {!formFile && (
                      <span className="text-[10px] text-slate-400 mt-1">Max allowed size: 30 MB</span>
                    )}
                    <input
                      type="file"
                      onChange={(e) => setFormFile(e.target.files[0])}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">External URL Link</label>
                  <input
                    type="url"
                    placeholder="e.g. https://figma.com/..."
                    value={formLinkUrl}
                    onChange={(e) => setFormLinkUrl(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-[#CBD5E1] bg-white text-sm text-[#0F172A] placeholder-[#94A3B8] outline-none focus:border-[#4F46E5] focus:ring-[3px] focus:ring-[#4F46E5]/12 transition-all"
                    required={formType === "LINK"}
                   aria-label="e.g. https://figma.com/..."/>
                </div>
              )}

              {/* Description field */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Description</label>
                <textarea
                  placeholder="e.g. Initial requirements document for review..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  rows="3"
                  className="w-full p-3 rounded-lg border border-[#CBD5E1] bg-white text-sm text-[#0F172A] placeholder-[#94A3B8] outline-none focus:border-[#4F46E5] focus:ring-[3px] focus:ring-[#4F46E5]/12 transition-all resize-none"
                 aria-label="e.g. Initial requirements document for review..."/>
              </div>

              {/* Actions Footer */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 h-10 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-colors cursor-pointer"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 h-10 rounded-lg bg-[#4F46E5] hover:bg-[#3730A3] text-white text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
                  disabled={saving}
                >
                  {saving && (
                    <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  )}
                  {editingDoc ? "Save Changes" : "Create Document"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingDoc && (
        <div className="fixed inset-0 bg-[#0f172a]/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in font-sans">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-sm overflow-hidden p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 font-display text-left">Confirm Deletion</h3>
            <p className="text-xs text-slate-500 leading-normal text-left">
              Are you sure you want to permanently delete document <strong>{deletingDoc.title}</strong>? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setDeletingDoc(null)}
                className="px-4 h-9 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 h-9 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Details Modal */}
      {selectedViewDoc && (
        <div className="fixed inset-0 bg-[#0f172a]/45 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in font-sans">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md max-h-[90vh] overflow-y-auto animate-scale-up p-6 space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 font-display flex items-center gap-2">
                {selectedViewDoc.type === "FILE" ? <FileText size={18} className="text-rose-500" /> : <LinkIcon size={18} className="text-blue-500" />}
                Document Details
              </h3>
              <button
                onClick={() => setSelectedViewDoc(null)}
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

    </div>
  );
}

export default AdminDocuments;
