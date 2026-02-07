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

    // Email not verified → block marketplace
    if (!session.user.emailVerified) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-100">
                <div className="max-w-md rounded-2xl bg-white p-8 shadow-lg text-center">
                    <h1 className="text-2xl font-semibold mb-4">Email Verification Required</h1>
                    <p className="mb-6">Please verify your email to access the marketplace.</p>
                    <Link
                        href="/resend-verification"
                        className="text-lg font-black px-3 py-1.5 bg-green-600 rounded text-white no-underline"
                    >
                        Resend Verification Email
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div id="marketContainer" className="flex flex-col lg:flex-row min-h-screen items-stretch bg-white">

            {/* Sidebar */}
            <div className="flex-100 lg:flex-[0_0_auto] lg:w-[350px]">
                <MarketHeader />
            </div>

            {/* Main Content */}
            <div id="marketContent" className="flex flex-col w-full">
                {children}
            </div>
        </div>
    );
}
