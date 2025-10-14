import React from "react";
import type { Metadata } from "next";
import "@/styles/globals.css";
import {ToastContainer} from "react-toastify";

export const metadata: Metadata = {
  title: "UNT Marketplace",
  description: "Future home of the UNT Marketplace app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased font-display">
        <div id="appContainer">
            {children}
        </div>
        <ToastContainer />
      </body>
    </html>
  );
}
