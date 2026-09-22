import React from 'react';

function Pagination({ currentPage, totalPages, totalItems, itemsPerPage, onPageChange }) {
  if (totalPages <= 0) return null;

  const start = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const end = Math.min(currentPage * itemsPerPage, totalItems);

  // Generate page numbers to display
  const pages = [];
  
  // Basic sliding window for page numbers to handle large number of pages cleanly
  const maxPageButtons = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxPageButtons / 2));
  let endPage = Math.min(totalPages, startPage + maxPageButtons - 1);
  
  if (endPage - startPage + 1 < maxPageButtons) {
    startPage = Math.max(1, endPage - maxPageButtons + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return (
    <div className="flex items-center justify-between pt-4 pb-2 border-t border-slate-100 bg-transparent w-full">
      {/* Left info label */}
      <p className="text-sm text-slate-500 font-medium">
        Showing <span className="font-semibold text-slate-800">{start}</span> to{' '}
        <span className="font-semibold text-slate-800">{end}</span> of{' '}
        <span className="font-semibold text-slate-800">{totalItems}</span> entries
      </p>

      {/* Right buttons control panel */}
      <div className="flex items-center gap-1.5">
        {/* Prev Button */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3.5 h-8 flex items-center justify-center border border-slate-200 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shrink-0"
        >
          Prev
        </button>

        {/* Page Buttons */}
        {startPage > 1 && (
          <>
            <button
              onClick={() => onPageChange(1)}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors cursor-pointer ${
                currentPage === 1
                  ? 'bg-[var(--pagination-bg,#4F46E5)] text-[var(--pagination-font,#FFFFFF)] font-bold shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              1
            </button>
            {startPage > 2 && <span className="text-slate-400 px-1 text-sm font-semibold select-none">...</span>}
          </>
        )}

        {pages.map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors cursor-pointer shrink-0 ${
              page === currentPage
                ? 'bg-[var(--pagination-bg,#4F46E5)] text-[var(--pagination-font,#FFFFFF)] font-bold shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {page}
          </button>
        ))}

        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="text-slate-400 px-1 text-sm font-semibold select-none">...</span>}
            <button
              onClick={() => onPageChange(totalPages)}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors cursor-pointer ${
                currentPage === totalPages
                  ? 'bg-[var(--pagination-bg,#4F46E5)] text-[var(--pagination-font,#FFFFFF)] font-bold shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {totalPages}
            </button>
          </>
        )}

        {/* Next Button */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3.5 h-8 flex items-center justify-center border border-slate-200 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shrink-0"
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default Pagination;
