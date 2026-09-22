// Provides file import inputs and field mapping tables for uploading multiple new project profiles in bulk.
// Handles mapping headers to database attributes like budgets, scopes, and client links.

import { useState, useRef } from 'react';
import { X, Upload, FileSpreadsheet, Download, AlertCircle, CheckCircle2, AlertTriangle, FileWarning } from 'lucide-react';
import { importProjects, downloadImportTemplate } from '../../services/projectService';
import { saveAs } from 'file-saver';

function ImportProjectsModal({ isOpen, onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState(null);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const validateFile = (selectedFile) => {
    setError('');
    setSummary(null);

    if (!selectedFile) return false;

    // Check size limit (5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('File size exceeds the 5MB limit. Please upload a smaller file.');
      setFile(null);
      return false;
    }

    // Check file type
    const fileName = selectedFile.name.toLowerCase();
    if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.csv')) {
      setError('Unsupported file type. Only .xlsx and .csv files are supported.');
      setFile(null);
      return false;
    }

    setFile(selectedFile);
    return true;
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateFile(e.target.files[0]);
    }
  };

  const handleDownload = async () => {
    try {
      setError('');
      const res = await downloadImportTemplate();
      // res.data is a blob because responseType: 'blob' is set in projectService
      saveAs(res.data, 'Project_Import_Template.xlsx');
    } catch (err) {
      setError('Failed to download the template file.');
      console.error(err);
    }
  };

  const handleUploadSubmit = async () => {
    if (!file) return;

    setImporting(true);
    setError('');
    setSummary(null);

    try {
      const res = await importProjects(file);
      setImporting(false);
      
      if (res.data.success) {
        setSummary(res.data.data);
        if (res.data.data.imported > 0 && onSuccess) {
          onSuccess(); // Refresh projects table
        }
      } else {
        setError(res.data.message || 'Import failed');
      }
    } catch (err) {
      setImporting(false);
      setError(err.response?.data?.message || 'Server error occurred during project import.');
      console.error(err);
    }
  };

  const handleClose = () => {
    // Reset states
    setFile(null);
    setError('');
    setSummary(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in font-sans">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-2xl overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 font-display">
              Import Projects
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Upload an Excel template or CSV file to add multiple projects at once
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-slate-650 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-xl text-rose-650 text-xs font-semibold flex items-start gap-2.5">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Import Summary Results */}
          {summary && (
            <div className="space-y-5">
              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3.5 text-center">
                  <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Imported</span>
                  <span className="text-2xl font-extrabold text-emerald-700 block mt-1">{summary.imported}</span>
                </div>
                <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-3.5 text-center">
                  <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">Duplicates</span>
                  <span className="text-2xl font-extrabold text-amber-700 block mt-1">{summary.duplicate}</span>
                </div>
                <div className="bg-rose-50/50 border border-rose-100 rounded-xl p-3.5 text-center">
                  <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider block">Failed Rows</span>
                  <span className="text-2xl font-extrabold text-rose-700 block mt-1">{summary.failed}</span>
                </div>
              </div>

              {/* Row-Level Errors */}
              {summary.errors && summary.errors.length > 0 ? (
                <div className="border border-slate-100 rounded-xl overflow-hidden">
                  <div className="bg-slate-50 px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">Detailed Import Logs</span>
                    <span className="bg-rose-100 text-rose-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                      {summary.errors.length} {summary.errors.length === 1 ? 'Error' : 'Errors'}
                    </span>
                  </div>
                  <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto text-xs">
                    {summary.errors.map((err, idx) => (
                      <div key={idx} className="p-3 flex items-start gap-2.5 bg-white hover:bg-slate-50/50 transition-colors">
                        <FileWarning size={14} className="text-rose-500 shrink-0 mt-0.5" />
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-800">Row {err.row}</span>
                          <p className="text-slate-500 leading-normal">{err.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-emerald-50/30 border border-emerald-100/50 rounded-xl flex items-center gap-3">
                  <CheckCircle2 className="text-emerald-500 shrink-0" size={20} />
                  <div>
                    <h4 className="text-xs font-bold text-emerald-800">All Rows Imported Successfully!</h4>
                    <p className="text-[11px] text-emerald-600 mt-0.5">No validation errors or duplicates found in your template.</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Upload and Drag Zone */}
          {!summary && (
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-150 group ${
                dragActive
                  ? 'border-[#4F46E5] bg-[#4F46E5]/5'
                  : 'border-slate-200 hover:border-slate-350 hover:bg-slate-50/30'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.csv"
                onChange={handleFileSelect}
                className="hidden"
              />

              {file ? (
                <div className="space-y-3.5">
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-650 mx-auto group-hover:scale-105 transition-transform">
                    <FileSpreadsheet size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{file.name}</p>
                    <p className="text-xs text-slate-400 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                    }}
                    className="text-xs font-semibold text-rose-500 hover:text-rose-600 transition-colors"
                  >
                    Remove File
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-450 mx-auto group-hover:scale-105 transition-transform">
                    <Upload size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-700">
                      Drag and drop your project template here, or <span className="text-[#4F46E5] hover:text-[#3730A3]">browse</span>
                    </p>
                    <p className="text-xs text-slate-400 mt-1.5">
                      Supports .xlsx and .csv files up to 5MB
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Template Download Prompt */}
          {!summary && (
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex gap-3">
                <FileSpreadsheet size={20} className="text-slate-500 shrink-0 mt-0.5 sm:mt-0" />
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Need the correct template layout?</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Download our pre-structured spreadsheet template to avoid import formatting errors.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleDownload}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-750 transition-colors cursor-pointer shrink-0"
              >
                <Download size={13} />
                Download Template
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/60 flex justify-between items-center gap-3">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            {summary ? 'Import complete' : file ? 'Ready to process' : 'Select a file'}
          </span>

          <div className="flex gap-3">
            <button
              type="button"
              disabled={importing}
              onClick={handleClose}
              className="px-4 h-10 rounded-lg border border-slate-300 text-slate-650 hover:bg-slate-50 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
            >
              {summary ? 'Close' : 'Cancel'}
            </button>
            {!summary && (
              <button
                type="button"
                onClick={handleUploadSubmit}
                disabled={!file || importing}
                className="inline-flex items-center justify-center gap-1.5 px-5 h-10 rounded-lg bg-[#4F46E5] text-xs font-semibold text-white hover:bg-[#3730A3] transition-all duration-150 cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {importing ? (
                  <>
                    <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Processing...
                  </>
                ) : (
                  'Import Projects'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ImportProjectsModal;
