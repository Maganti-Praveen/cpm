// This file provides unit and integration tests for the ThemeSelector React component.
// It verifies rendering and dropdown selection interactions using Vitest and React Testing Library.

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import ThemeSelector from "../../components/layout/ThemeSelector";
import React from "react";

// Mock react-redux store selectors
vi.mock("react-redux", () => ({
  useSelector: vi.fn((selector) => selector({ auth: { user: { id: 1, fullName: "Test User" } } })),
}));

// Mock useTheme hook options data and selection event callbacks
const mockApplyTheme = vi.fn();
const mockSaveTheme = vi.fn();
vi.mock("../../context/ThemeContext", () => ({
  useTheme: () => ({
    themes: [
      { id: "light", name: "Light Mode", sidebarBg: "#ffffff", primaryButtonBg: "#4f46e5", mainCanvasBg: "#f8fafc" },
      { id: "dark", name: "Dark Mode", sidebarBg: "#0f172a", primaryButtonBg: "#4f46e5", mainCanvasBg: "#0f172a" },
    ],
    activeTheme: { id: "light" },
    applyTheme: mockApplyTheme,
    saveTheme: mockSaveTheme,
  }),
}));

describe("ThemeSelector Component", () => {
  it("renders the palette button trigger", () => {
    // Render selector trigger component
    render(<ThemeSelector portal="public" />);
    
    // Resolve button item element
    const button = screen.getByTitle("Select Theme");
    expect(button).toBeInTheDocument();
  });

  it("opens the dropdown menu on click", () => {
    // Render selector trigger component
    render(<ThemeSelector portal="public" />);
    
    // Find trigger button and dispatch click event
    const button = screen.getByTitle("Select Theme");
    fireEvent.click(button);
    
    // Assert dropdown options and labels render successfully
    expect(screen.getByText("Theme Preferences")).toBeInTheDocument();
    expect(screen.getByText("Light Mode")).toBeInTheDocument();
    expect(screen.getByText("Dark Mode")).toBeInTheDocument();
  });
});
