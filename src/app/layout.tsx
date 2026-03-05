import React from "react";
import type {Metadata, Viewport} from "next";
import "@/styles/globals.css";
import {ToastContainer} from "react-toastify";
import RemoveExtensionAttrs from "@/components/layout/RemoveExtensionAttrs";
import DarkModeInit from "@/components/ui/DarkModeInit";

export const metadata: Metadata = {
    title: "UNT Marketplace",
    description: "Buy and sell items within the UNT community",
    manifest: "/manifest.json",
    appleWebApp: {
        capable: true,
        statusBarStyle: "default",
        title: "UNT Marketplace",
    },
};

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-status-bar-style" content="default" />
                <meta name="theme-color" content="#00853e" />
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
                <script
                    dangerouslySetInnerHTML={{
                        __html: `
                            if ('serviceWorker' in navigator) {
                                window.addEventListener('load', function() {
                                    navigator.serviceWorker.register('/sw.js').then(
                                        function(registration) {
                                            console.log('ServiceWorker registration successful');
                                        },
                                        function(err) {
                                            console.log('ServiceWorker registration failed: ', err);
                                        }
                                    );
                                });
                            }
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
