"use client"

import React from "react";

/**
 * Initializes dark mode from localStorage on app load.
 * This component has no UI - it just applies the saved theme preference.
 */
export default function DarkModeInit() {
  React.useEffect(() => {
    // Read persisted preference or media query after mount and apply it
    try {
      const stored = localStorage.getItem("theme");
      const prefersDark = stored === "dark" || (!stored && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
      
      // Apply theme immediately to avoid flash
      const root = document.documentElement;
      if (prefersDark) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    } catch (e) {
      // ignore
    }
  }, []);

  // Also apply immediately on render (blocking script alternative)
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem("theme");
      const prefersDark = stored === "dark" || (!stored && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
      
      const root = document.documentElement;
      if (prefersDark) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    } catch (e) {
      // ignore
    }
  }

  return null; // No UI rendered
}
