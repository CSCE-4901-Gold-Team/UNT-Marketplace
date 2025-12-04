"use server";

import React from "react";
import "@/styles/globals.css";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import MarketSidebar from "@/components/ui/MarketSidebar";
import MarketHeader from "@/components/ui/MarketHeader";

export default async function MarketLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    // Redirect if not logged in
    if (!session) {
        redirect("/login");
    }

    // ...existing code...

    return (
        <div id="marketContainer" className="flex flex-col lg:flex-row min-h-screen items-stretch bg-white">

            {/* Sidebar */}
            <div className="flex-100 lg:flex-[0_0_auto] lg:w-[350px]">
                <MarketHeader />
            </div>

            {/* Main Content */}
            <div id="marketContent" className="flex flex-col">
                {children}
            </div>
        </div>
    );
}
