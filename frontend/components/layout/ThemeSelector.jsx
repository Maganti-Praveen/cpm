// Renders choice switches for selecting light or dark themes.
// Triggers visual variations instantly.


import React, { useState, useRef, useEffect } from "react";
import { useSelector } from "react-redux";
import { useTheme } from "../../context/ThemeContext";
import { Palette, Check } from "lucide-react";

export default function ThemeSelector({ portal = "public" }) {
  const { themes, activeTheme, applyTheme, saveTheme } = useTheme();
  const user = useSelector((state) => state.auth.user);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectTheme = async (theme) => {
    applyTheme(theme);
    if (user && saveTheme) {
      try {
        await saveTheme(theme.id);
      } catch (err) {
        console.warn("Failed to save theme preference:", err);
      }
    }
    setIsOpen(false);
  };

  if (!themes || themes.length === 0) return null;

  const buttonClass =
    portal === "public"
      ? "p-2.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all cursor-pointer bg-transparent border-none flex items-center justify-center min-w-[48px] min-h-[48px]"
      : "p-2.5 rounded-lg text-[var(--sai-navbar-font,#475569)] hover:bg-slate-500/10 transition-all cursor-pointer bg-transparent border-none flex items-center justify-center min-w-[48px] min-h-[48px]";

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={buttonClass}
        title="Select Theme"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
       aria-label="Select Theme">
        <Palette className="w-5 h-5 shrink-0" />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-64 rounded-xl border shadow-xl z-50 p-2 origin-top-right focus:outline-none text-left"
          style={{
            backgroundColor: "var(--card-bg, #FFFFFF)",
            borderColor: "var(--border-color, #E2E8F0)",
            boxShadow: "0 20px 50px rgba(0,0,0,0.15)",
          }}
        >
          {/* Header */}
          <div
            className="px-3 py-2 border-b mb-1.5"
            style={{ borderColor: "var(--border-color, #F1F5F9)" }}
          >
            <span
              className="text-[10px] font-bold uppercase tracking-widest block"
              style={{ color: "var(--text-tertiary, #94A3B8)" }}
            >
              Theme Preferences
            </span>
          </div>

          {/* Theme list */}
          <div className="space-y-0.5" role="listbox">
            {themes.map((theme) => {
              const isActive = activeTheme?.id === theme.id;
              return (
                <button
                  key={theme.id}
                  onClick={() => handleSelectTheme(theme)}
                  role="option"
                  aria-selected={isActive}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold cursor-pointer transition-all duration-150 border-none text-left group"
                  style={{
                    backgroundColor: isActive
                      ? "rgba(var(--primary-btn-rgb, 79, 70, 229), 0.1)"
                      : "transparent",
                    color: isActive
                      ? "var(--card-text, #0F172A)"
                      : "var(--text-secondary, #475569)",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor =
                        "var(--page-bg, #F8FAFC)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }
                  }}
                >
                  {/* Color swatch bar — shows sidebar, primary, navbar */}
                  <div
                    className="flex rounded-md overflow-hidden shrink-0 border"
                    style={{
                      width: "28px",
                      height: "20px",
                      borderColor: "var(--border-color, #E2E8F0)",
                    }}
                  >
                    <div
                      style={{
                        backgroundColor: theme.sidebarBg || "#1E1B4B",
                        width: "33.33%",
                      }}
                    />
                    <div
                      style={{
                        backgroundColor:
                          theme.primaryButtonBg || "#4F46E5",
                        width: "33.33%",
                      }}
                    />
                    <div
                      style={{
                        backgroundColor: theme.mainCanvasBg || "#F8FAFC",
                        width: "33.33%",
                      }}
                    />
                  </div>

                  {/* Theme name */}
                  <span className="flex-1 truncate">{theme.name}</span>

                  {/* Checkmark for active */}
                  {isActive && (
                    <Check
                      className="w-4 h-4 shrink-0"
                      style={{ color: "var(--primary-btn, #4F46E5)" }}
                      strokeWidth={2.5}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
