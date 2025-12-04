"use client"

import React from "react";

export default function DarkModeToggle() {
  // Start with light to match server-rendered markup and avoid hydration mismatch.
  const [isDark, setIsDark] = React.useState<boolean>(false);

  React.useEffect(() => {
    // Read persisted preference or media query after mount and apply it
    try {
      const stored = localStorage.getItem("theme");
      const prefersDark = stored === "dark" || (!stored && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
      setIsDark(prefersDark);
      
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

  React.useEffect(() => {
    try {
      const root = document.documentElement;
      if (isDark) {
        root.classList.add("dark");
        localStorage.setItem("theme", "dark");
      } else {
        root.classList.remove("dark");
        localStorage.setItem("theme", "light");
      }
    } catch (e) {
      // ignore
    }
  }, [isDark]);

  const toggle = () => setIsDark((s) => !s);

  return (
    <button
      type="button"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={toggle}
      className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
    >
      {isDark ? (
        // Sun icon (light)
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5 text-yellow-400">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.364-6.364-1.414 1.414M7.05 16.95l-1.414 1.414M18.364 18.364l-1.414-1.414M7.05 7.05L5.636 5.636" />
        </svg>
      ) : (
        // Moon icon (dark)
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5 text-gray-900">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
        </svg>
      )}
    </button>
  );
}
