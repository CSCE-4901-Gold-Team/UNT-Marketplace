"use client"

import React from "react";

/**
 * Initializes dark mode from localStorage on app load.
 * This component has no UI - it just applies the saved theme preference.
 * Note: The blocking script in layout.tsx handles the initial load,
 * this component ensures consistency after hydration.
 */
export default function DarkModeInit() {
  React.useEffect(() => {
    // Ensure dark mode is applied correctly after hydration
    try {
      const stored = localStorage.getItem("theme");
      const prefersDark = stored === "dark";
      
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

  return null; // No UI rendered
}
