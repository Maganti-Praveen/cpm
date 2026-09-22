// Exposes methods to trigger temporary status banners (success, warning, error) from any component.
// Manages animated notification popups.


import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, X } from 'lucide-react';

const ToastContext = createContext(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  // Enqueues dynamic status banners with auto-clear timeout intervals
  const showToast = useCallback((message, type = 'success', duration = 3000, action = null) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type, action }]);
    
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const updateToast = useCallback((id, message, type = 'success', action = null) => {
    setToasts((prev) => prev.map((t) => t.id === id ? { ...t, message, type, action } : t));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, removeToast, updateToast }}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg animate-slide-in transition-all duration-300 bg-white ${
              toast.type === 'success' 
                ? 'border-emerald-100 bg-emerald-50/90 text-emerald-900' 
                : toast.type === 'error'
                ? 'border-rose-100 bg-rose-50/90 text-rose-900'
                : 'border-slate-100 text-slate-800'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {toast.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              ) : toast.type === 'error' ? (
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              ) : null}
            </div>
            
            <div className="flex-1 text-xs font-semibold leading-relaxed flex items-center justify-between gap-4">
              <span>{toast.message}</span>
              {toast.action && (
                <button
                  type="button"
                  onClick={() => {
                    toast.action.onClick();
                    removeToast(toast.id);
                  }}
                  className="text-indigo-600 hover:text-indigo-800 underline font-bold cursor-pointer bg-transparent border-none text-xs shrink-0"
                >
                  {toast.action.label}
                </button>
              )}
            </div>
            
            <button
              onClick={() => removeToast(toast.id)}
              className="shrink-0 text-slate-400 hover:text-slate-655 p-0.5 rounded-md hover:bg-slate-100/50 transition-colors cursor-pointer bg-transparent border-none"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
