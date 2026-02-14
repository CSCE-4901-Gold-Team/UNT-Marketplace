import React from "react";
import type {Metadata} from "next";
import "@/styles/globals.css";
import {ToastContainer} from "react-toastify";
import RemoveExtensionAttrs from "@/components/layout/RemoveExtensionAttrs";
import DarkModeInit from "@/components/ui/DarkModeInit";

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
        <html lang="en" suppressHydrationWarning>
            <head>
                <script
                    dangerouslySetInnerHTML={{
                        __html: `
                            try {
                                const stored = localStorage.getItem('theme');
                                const prefersDark = stored === 'dark';
                                if (prefersDark) {
                                    document.documentElement.classList.add('dark');
                                } else {
                                    document.documentElement.classList.remove('dark');
                                }
                            } catch (e) {}
                        `,
                    }}
                />
            </head>
            <body className="antialiased font-display" suppressHydrationWarning>
                {/* cleans extension-injected attributes after hydration to avoid client/server mismatches */}
                <RemoveExtensionAttrs />
                <DarkModeInit />
                <div id="appContainer">
                    {children}
                </div>
                <ToastContainer/>
            </body>
        </html>
    );
}
