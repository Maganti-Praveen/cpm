// Modal popup offering profile picture modification pathways: in-app camera snapshot, file upload picker, or image removal.

import { Camera, Upload, Trash2, X } from "lucide-react";

export default function AvatarSelectionModal({ isOpen, onClose, onTakeActive, onChooseFile, onRemove, hasPhoto }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#0f172a]/60 backdrop-blur-xs flex items-center justify-center z-[9998] p-4 font-sans">
      <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-xs overflow-hidden shadow-2xl animate-scale-up relative">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Change Profile Picture</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Options */}
        <div className="p-4 flex flex-col gap-2.5">
          {/* Take Photo Option */}
          <button
            type="button"
            onClick={() => {
              onTakeActive();
              onClose();
            }}
            className="w-full h-11 px-4 rounded-xl border border-slate-200 hover:border-indigo-400 text-slate-700 bg-white hover:bg-slate-50 text-xs font-bold transition-all flex items-center gap-3 cursor-pointer text-left"
          >
            <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Camera size={15} />
            </div>
            Take Photo with Camera
          </button>

          {/* Upload Option */}
          <button
            type="button"
            onClick={() => {
              onChooseFile();
              onClose();
            }}
            className="w-full h-11 px-4 rounded-xl border border-slate-200 hover:border-indigo-400 text-slate-700 bg-white hover:bg-slate-50 text-xs font-bold transition-all flex items-center gap-3 cursor-pointer text-left"
          >
            <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Upload size={15} />
            </div>
            Choose from Files
          </button>

          {/* Remove Option */}
          {hasPhoto && (
            <button
              type="button"
              onClick={() => {
                onRemove();
                onClose();
              }}
              className="w-full h-11 px-4 rounded-xl border border-rose-100 hover:border-rose-350 text-rose-600 bg-rose-50/30 hover:bg-rose-50/80 text-xs font-bold transition-all flex items-center gap-3 cursor-pointer text-left"
            >
              <div className="w-7 h-7 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
                <Trash2 size={15} />
              </div>
              Remove Current Photo
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
