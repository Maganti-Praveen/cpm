import { useToast } from '../../context/ToastContext';
// Client sign-off hub displaying project files and approval toggles.
// Coordinates adjustment requests.

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Download } from "lucide-react";
import { getProjects } from "../../services/projectService";
import { getDeliverables, updateDeliverable } from "../../services/deliverableService";
import { exportToExcel } from "../../utils/excelExport";
import Pagination from "../../components/common/Pagination";



export default function ClientDeliverables() {
  const { showToast } = useToast();
  const [deliverables, setDeliverables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  // Resolves lists of deliverables assigned across project indices
  const fetchClientDeliverables = useCallback(() => {
    setLoading(true);
    getProjects()
      .then((res) => {
        const clientProjs = res.data.data;
        const promises = clientProjs.map(async (p) => {
          try {
            const delRes = await getDeliverables(p.id);
            return delRes.data.data.map(d => ({
              ...d,
              projectName: p.name
            }));
          } catch (err) {
            console.error(`Error loading deliverables for project ${p.id}:`, err);
            return [];
          }
        });

        Promise.all(promises)
          .then((results) => {
            const flattened = results.flat();
            setDeliverables(flattened);
            setLoading(false);
          });
      })
      .catch((err) => {
        console.error("Error loading projects for deliverables:", err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchClientDeliverables();
  }, [fetchClientDeliverables]);

  const handleStatusChange = useCallback((delId, newStatus) => {
    updateDeliverable(delId, { status: newStatus })
      .then(() => {
        showToast(`Deliverable ${newStatus.toLowerCase()} successfully!`, 'success');
        setDeliverables(prev => prev.map(d => d.id === delId ? { ...d, status: newStatus } : d));
        fetchClientDeliverables();
      })
      .catch((err) => {
        console.error("Error updating deliverable status:", err);
        const msg = err.response?.data?.message || `Failed to update deliverable status.`;
        showToast(msg, 'error');
      });
  }, [fetchClientDeliverables, showToast]);

  const getFileIcon = (status) => {
    if (status === "Approved") {
      return (
        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100/60 shadow-xs">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      );
    }
    if (status === "Rejected") {
      return (
        <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100/60 shadow-xs">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      );
    }
    return (
      <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100/60 shadow-xs">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
    );
  };

  const filteredDeliverables = useMemo(() => {
    return deliverables.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.projectName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "All" || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [deliverables, searchQuery, statusFilter]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(filteredDeliverables.length / ITEMS_PER_PAGE)), [filteredDeliverables.length]);

  const paginatedDeliverables = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredDeliverables.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredDeliverables, currentPage]);

  const handleExport = useCallback(() => {
    try {
      if (filteredDeliverables.length === 0) {
        showToast("No deliverables to export.", "error");
        return;
      }
      const mapped = filteredDeliverables.map(del => ({
        "Deliverable Name": del.name,
        "Project Name": del.projectName,
        "Status": del.status,
        "Phase / Stage": del.stage,
        "File Size": del.size,
        "Uploaded Date": del.createdAt ? new Date(del.createdAt).toLocaleDateString() : "N/A"
      }));
      exportToExcel(mapped, "Client_Deliverables_Export");
    } catch (err) {
      console.error("Failed to export deliverables:", err);
      showToast("Failed to export deliverables data.", "error");
    }
  }, [filteredDeliverables, showToast]);

  return (
    <div className="space-y-6 font-sans">
      {/* Page Header Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-slate-900 text-lg">Project Deliverables</h1>
          <p className="text-slate-500 text-sm mt-1">
            Review, download, and sign off on active project deliverables submitted by the Sai IT Services team.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleExport}
            disabled={filteredDeliverables.length === 0}
            title={filteredDeliverables.length === 0 ? "No data to export" : "Export to Excel"}
            className="inline-flex items-center gap-1.5 px-4 h-9 rounded-lg border border-indigo-200 hover:border-indigo-400 text-[#4F46E5] bg-[#4F46E5]/5 hover:bg-[#4F46E5]/10 text-sm font-medium transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
           aria-label={filteredDeliverables.length === 0 ? "No data to export" : "Export to Excel"}>
            <Download size={15} />
            Export Data
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search deliverables by name or project..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-[2.5rem] pl-10 pr-4 text-xs bg-white border border-slate-200 focus:border-primary focus:ring-primary-light text-slate-900 rounded-xl outline-none focus:ring-4 transition-all placeholder-slate-400 font-medium font-sans"
           aria-label="Search deliverables by name or project..."/>
        </div>
        
        {/* Status Filter Pills */}
        <div className="flex flex-wrap gap-1.5 self-start md:self-center">
          {["All", "Awaiting Review", "Approved", "Rejected"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                statusFilter === status
                  ? "bg-primary text-white shadow-xs"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/50"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Deliverables List */}
      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          [1, 2, 3].map((key) => (
            <div key={key} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs animate-pulse flex items-center gap-4">
              <div className="w-10 h-10 bg-slate-100 rounded-xl shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-3.5 bg-slate-100 rounded-md w-16" />
                  <div className="h-3.5 bg-slate-100 rounded-md w-24" />
                </div>
                <div className="h-4.5 bg-slate-100 rounded-md w-1/3" />
                <div className="h-3.5 bg-slate-100 rounded-md w-1/4" />
              </div>
            </div>
          ))
        ) : filteredDeliverables.length === 0 ? (
          <div className="text-center py-16 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
            <p className="text-xs text-slate-400 italic font-medium">No deliverables found matching the criteria.</p>
          </div>
        ) : (
          paginatedDeliverables.map((item) => {
            const isPending = !item.status || item.status === "Awaiting Review" || item.status.toLowerCase().includes("awaiting") || item.status.toLowerCase().includes("pending");
            return (
              <div
                key={item.id}
                className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  {getFileIcon(item.status)}
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span
                        className={`px-2 py-0.5 text-[11px] font-bold uppercase rounded-md ${
                          item.status === 'Approved' 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                            : item.status === 'Rejected'
                            ? 'bg-rose-50 text-rose-700 border border-rose-100'
                            : 'bg-amber-50 text-amber-700 border border-amber-100'
                        }`}
                      >
                        {item.status}
                      </span>
                      <span className="text-xs text-slate-400 font-semibold truncate max-w-[150px] md:max-w-[200px]" title={item.projectName}>
                        {item.projectName}
                      </span>
                    </div>
                    <h2 className="font-display font-bold text-slate-900 text-base mt-1 truncate" title={item.name}>
                      {item.name}
                    </h2>
                    <p className="text-xs text-slate-500 font-medium">
                      Phase: {item.stage} &bull; Size: {item.size}
                    </p>
                  </div>
                </div>

                {/* Actions block with auto-stretched layout on mobile */}
                <div className="flex items-center gap-2 w-full md:w-auto shrink-0 mt-2 md:mt-0">
                  <a 
                    href={item.url} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex-1 md:flex-initial px-3.5 py-2 text-center border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded-xl cursor-pointer transition-colors"
                  >
                    Download
                  </a>
                  {isPending && (
                    <>
                      <button 
                        onClick={() => handleStatusChange(item.id, "Rejected")}
                        className="flex-1 md:flex-initial px-3.5 py-2 bg-danger-light text-danger hover:bg-danger/10 text-xs font-bold rounded-xl cursor-pointer transition-colors"
                      >
                        Reject
                      </button>
                      <button 
                        onClick={() => handleStatusChange(item.id, "Approved")}
                        className="flex-1 md:flex-initial px-3.5 py-2 bg-success text-white hover:bg-success-dark text-xs font-bold rounded-xl cursor-pointer shadow-xs transition-colors"
                      >
                        Approve
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination Controls */}
      <div className="bg-white px-5 py-4 border border-[#E2E8F0] rounded-2xl shadow-xs">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredDeliverables.length}
          itemsPerPage={ITEMS_PER_PAGE}
          onPageChange={(page) => setCurrentPage(page)}
        />
      </div>
    </div>
  );
}
