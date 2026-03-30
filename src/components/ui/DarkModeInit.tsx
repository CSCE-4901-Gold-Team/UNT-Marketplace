"use client"

import { ThemeProvider } from "@/components/ui/ThemeProvider";

/**
 * Initializes dark mode theme provider.
 * Wraps the app with theme context for global dark mode management.
 */
export default function DarkModeInit({ children }: { children: React.ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}
