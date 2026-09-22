// Renders a floating toolbar for executing bulk actions (e.g. status changes, staff assignments) on selected projects.
// Visualizes selections count and triggers corresponding bulk modification drawers.

import { Edit, Trash2, X } from 'lucide-react';

function BulkActionBar({ selectedCount = 0, onClear, onBulkEdit, onBulkDelete }) {
  if (selectedCount === 0) return null;

  return (
    <div 
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-xl px-4 animate-slide-up"
      style={{ fontFamily: 'var(--sai-font-family, sans-serif)' }}
    >
      <div 
        className="shadow-2xl rounded-2xl px-6 py-3.5 flex items-center justify-between gap-4 backdrop-blur-lg"
        style={{ 
          backgroundColor: 'var(--sai-sidebar-bg, #0F172A)', 
          border: '1px solid rgba(255, 255, 255, 0.1)', 
          color: 'var(--sai-sidebar-font, #FFFFFF)' 
        }}
      >
        <div className="flex items-center gap-3">
          <div 
            className="flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold shadow-sm"
            style={{ 
              backgroundColor: 'var(--sai-active-tab-bg, #4F46E5)',
              color: 'var(--sai-active-tab-color, #FFFFFF)'
            }}
          >
            {selectedCount}
          </div>
          <div className="text-left">
            <span 
              className="text-sm font-semibold block"
              style={{ color: 'var(--sai-sidebar-font, #FFFFFF)' }}
            >
              {selectedCount === 1 ? 'Project' : 'Projects'} selected
            </span>
            <p 
              className="text-[10px] hidden sm:block mt-0.5"
              style={{ color: 'var(--sai-sidebar-font, #FFFFFF)', opacity: 0.7 }}
            >
              Actions will apply to all selected items
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Bulk Edit Button */}
          <button
            onClick={onBulkEdit}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-white/10 text-xs font-bold transition-all cursor-pointer border bg-transparent shadow-none"
            style={{ 
              color: 'var(--sai-sidebar-font, #FFFFFF)', 
              borderColor: 'rgba(255, 255, 255, 0.15)' 
            }}
            title="Bulk Edit selected projects"
           aria-label="Bulk Edit selected projects">
            <Edit size={14} style={{ color: 'var(--sai-active-tab-bg, #4F46E5)' }} />
            Bulk Edit
          </button>

          {/* Bulk Delete Button */}
          <button
            onClick={onBulkDelete}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-red-500/10 text-xs font-bold transition-all cursor-pointer border bg-transparent shadow-none"
            style={{ 
              color: 'var(--danger-color, #EF4444)', 
              borderColor: 'rgba(239, 68, 68, 0.2)' 
            }}
            title="Bulk Delete selected projects"
           aria-label="Bulk Delete selected projects">
            <Trash2 size={14} style={{ color: 'var(--danger-color, #EF4444)' }} />
            Bulk Delete
          </button>

          <div 
            className="w-px h-5 mx-1" 
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)' }}
          />

          {/* Close / Clear Button */}
          <button
            onClick={onClear}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-all cursor-pointer bg-transparent border-none shadow-none flex items-center justify-center"
            style={{ color: 'var(--sai-sidebar-font, #FFFFFF)', opacity: 0.8 }}
            title="Clear Selection"
           aria-label="Clear Selection">
            <X size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default BulkActionBar;

