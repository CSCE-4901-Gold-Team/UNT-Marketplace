import React from "react";
import type {Metadata} from "next";
import "@/styles/globals.css";
import {ToastContainer} from "react-toastify";
import RemoveExtensionAttrs from "@/components/layout/RemoveExtensionAttrs";
import DarkModeToggle from "@/components/ui/DarkModeToggle";

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
            <body className="antialiased font-display" suppressHydrationWarning>
                {/* cleans extension-injected attributes after hydration to avoid client/server mismatches */}
                <RemoveExtensionAttrs />
                <DarkModeToggle />
                <div id="appContainer">
                    {children}
                </div>
                <ToastContainer/>
            </body>
        </html>
    );
}
