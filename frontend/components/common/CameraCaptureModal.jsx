// Modal interface invoking navigator.mediaDevices.getUserMedia to stream live camera and capture snaps.
// Returns base64 images to settings state controllers.

import { useEffect, useRef, useState } from "react";
import { Camera, X, RefreshCw } from "lucide-react";

export default function CameraCaptureModal({ isOpen, onClose, onCapture }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);
    setError("");

    // Request client camera stream access
    navigator.mediaDevices
      .getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 480 },
          height: { ideal: 480 }
        },
        audio: false
      })
      .then((stream) => {
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Camera access failed:", err);
        setError("Could not access camera. Please verify camera permissions are granted.");
        setLoading(false);
      });

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const handleCapture = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    
    // Create a 1:1 square aspect ratio crop based on the smaller dimension
    const size = Math.min(video.videoWidth, video.videoHeight) || 300;
    canvas.width = size;
    canvas.height = size;
    
    const ctx = canvas.getContext("2d");
    if (ctx) {
      // Crop center of the video frame
      const sx = (video.videoWidth - size) / 2;
      const sy = (video.videoHeight - size) / 2;
      
      ctx.drawImage(video, sx, sy, size, size, 0, 0, size, size);
      const base64Image = canvas.toDataURL("image/jpeg", 0.85);
      onCapture(base64Image);
      stopCamera();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#0f172a]/60 backdrop-blur-xs flex items-center justify-center z-[9999] p-4 font-sans">
      <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-sm overflow-hidden shadow-2xl animate-scale-up relative">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Camera className="w-4 h-4 text-primary" /> Take Profile Photo
          </h3>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Area */}
        <div className="p-5 flex flex-col items-center">
          <div className="w-64 h-64 bg-slate-950 rounded-2xl overflow-hidden border border-slate-200 shadow-inner relative flex items-center justify-center">
            {loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 gap-2.5">
                <RefreshCw size={24} className="animate-spin text-primary" />
                <span className="text-xs font-semibold">Starting camera...</span>
              </div>
            )}
            
            {error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 text-rose-500 gap-2">
                <span className="text-xs font-bold">{error}</span>
              </div>
            )}

            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover transform -scale-x-100 ${
                loading || error ? "hidden" : "block"
              }`}
            />
          </div>
        </div>

        {/* Action Panel */}
        <div className="px-5 pb-5 pt-1 flex justify-center gap-3">
          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50 cursor-pointer transition-colors"
          >
            Cancel
          </button>
          
          <button
            type="button"
            onClick={handleCapture}
            disabled={loading || !!error}
            className="px-5 py-2 bg-primary hover:bg-primary-dark disabled:bg-slate-350 text-white text-xs font-bold rounded-xl cursor-pointer transition-colors flex items-center gap-1.5 border-none"
          >
            <Camera size={14} />
            Capture Photo
          </button>
        </div>
      </div>
    </div>
  );
}
