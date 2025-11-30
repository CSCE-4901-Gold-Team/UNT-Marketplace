"use server";

import React from "react";
import "@/styles/globals.css";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";

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
        <div id="marketContainer" className="flex min-h-screen items-stretch bg-white">

            {/* Sidebar */}
            <div id="marketSidebar" className="flex flex-col w-xs">
                <div className="h-screen fixed flex flex-col gap-8 py-6 w-xs bg-gray-100 shadow-2xl">

                    {/* Sidebar Logo */}
                    <div id="marketSidebarLogo" className="bg-green text-white p-4 px-1.5 shadow me-[-.5rem]">
                        <div className="text-3xl font-black text-center">UNT Marketplace</div>
                        <div className="text-md text-end me-6">Buy. Sell. Swap.</div>
                    </div>

                    {/* TOP MENU */}
                    <div id="marketSidebarTopMenu" className="flex flex-col gap-1 px-4 font-black text-gray-700">

                        {/* View Listings */}
                        <Link href="/market">
                            <div className="flex gap-2 px-1.5 py-3 rounded-xl hover:bg-gray-300">
                                <div>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                        strokeWidth="1.5" stroke="currentColor" className="size-6">
                                        <path strokeLinecap="round" strokeLinejoin="round"
                                            d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614" />
                                    </svg>
                                </div>
                                <div>View Listings</div>
                            </div>
                        </Link>

                        {/* Create Listing */}
                        <Link href="/market/create-listing">
                            <div className="flex gap-2 px-1.5 py-3 rounded-xl hover:bg-gray-300">
                                <div>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                        strokeWidth="1.5" stroke="currentColor" className="size-6">
                                        <path strokeLinecap="round" strokeLinejoin="round"
                                            d="M12 4.5v15m7.5-7.5h-15" />
                                    </svg>
                                </div>
                                <div>Create Listing</div>
                            </div>
                        </Link>

                        {/* You can replace these with real menu items later */}
                        <div className="flex gap-2 px-1.5 py-3 rounded-xl">
                            <div>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none"
                                    viewBox="0 0 24 24" strokeWidth="1.5"
                                    stroke="currentColor" className="size-6">
                                    <path strokeLinecap="round" strokeLinejoin="round"
                                        d="m12.75 15 3-3m0 0-3-3m3 3h-7.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                </svg>
                            </div>
                            <div>Menu Item Label</div>
                        </div>

                    </div>

                    {/* BOTTOM MENU */}
                    <div id="marketSidebarBottomMenu" className="mt-auto flex flex-col gap-1 px-4 font-black text-gray-700">
                        <div id="marketPersonalizedMessage" className="text-gray-400 text-xs text-center mb-3">
                            <p>Welcome back, {session.user.name}</p>
                        </div>

                        <div className="border-t border-gray-300 pt-4 flex flex-col gap-1">

                            {/* Logout */}
                            <Link href="/logout" className="flex-1">
                                <div className="flex items-center justify-center gap-2 px-1.5 py-3 rounded-xl hover:bg-gray-300">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none"
                                        viewBox="0 0 24 24" strokeWidth="1.5"
                                        stroke="currentColor" className="size-6">
                                        <path strokeLinecap="round" strokeLinejoin="round"
                                            d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15m-3 0-3-3m0 0 3-3m-3 3H15" />
                                    </svg>
                                    <span>Logout</span>
                                </div>
                            </Link>

                            {/* Account */}
                            <Link href="/profile" className="flex-1">
                                <div className="flex items-center justify-center gap-2 px-1.5 py-3 rounded-xl hover:bg-gray-300">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none"
                                        viewBox="0 0 24 24" strokeWidth="1.5"
                                        stroke="currentColor" className="size-6">
                                        <path strokeLinecap="round" strokeLinejoin="round"
                                            d="M12 14c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                                    </svg>
                                    <span>Account</span>
                                </div>
                            </Link>

                        </div>
                    </div>

                </div>
            </div>

            {/* Main Content */}
            <div id="marketContent" className="flex flex-col grow">
                {children}
            </div>
        </div>
    );
}
