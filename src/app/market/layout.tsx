"use server"

import React from "react";
import "@/styles/globals.css";
import {auth} from "@/lib/auth";
import {headers} from "next/headers";
import {redirect} from "next/navigation";
import Link from "next/link";

export default async function MarketLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    
    const session = await auth.api.getSession({
        headers: await headers()
    });

    // Market route protection logic can be extended here
    if(!session) {
        redirect("/login");
    }
    
    // Check if email is verified
    if(!session.user.emailVerified) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-100">
                <div className="max-w-md rounded-2xl bg-white p-8 shadow-lg text-center">
                    <h1 className="text-2xl font-semibold mb-4">Email Verification Required</h1>
                    <p className="mb-6">Please verify your email to access the marketplace.</p>
                    <Link href="/resend-verification" className="text-lg font-black px-3 py-1.5 bg-green-600 rounded text-white no-underline">
                        Resend Verification Email
                    </Link>
                </div>
            </div>
        );
    }
    
    return (
        <div id="marketContainer" className="flex min-h-screen items-stretch bg-white">
            
            <div id="marketSidebar" className="flex flex-col w-xs">

                    <div className="h-screen fixed flex flex-col gap-8 py-6 w-xs bg-gray-100 shadow-2xl">
                    
                    <div id="marketSidebarLogo" className="bg-green text-white p-4 px-1.5 shadow me-[-.5rem]">
                        <div className="text-3xl font-black text-center">UNT Marketplace</div>
                        <div className="text-md text-end me-6">Buy. Sell. Swap.</div>
                    </div>
                        
                    <div id="marketSidebarTopMenu" className="flex flex-col gap-1 px-4 font-black text-gray-700">
    
                        <div className="flex gap-2 text-green-700 bg-gray-200 px-1.5 py-3 rounded-xl">
                            <div>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5"
                                     stroke="currentColor" className="size-6">
                                    <path strokeLinecap="round" strokeLinejoin="round"
                                          d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z"/>
                                </svg>
                            </div>
                            <div>
                                View Listings
                            </div>
                        </div>
    
                        <div className="flex gap-2 px-1.5 py-3 rounded-xl">
                            <div>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5"
                                     stroke="currentColor" className="size-6">
                                    <path strokeLinecap="round" strokeLinejoin="round"
                                          d="m12.75 15 3-3m0 0-3-3m3 3h-7.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
                                </svg>
                            </div>
                            <div>
                                Menu Item Label
                            </div>
                        </div>
    
                        <div className="flex gap-2 px-1.5 py-3 rounded-xl">
                            <div>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5"
                                     stroke="currentColor" className="size-6">
                                    <path strokeLinecap="round" strokeLinejoin="round"
                                          d="m12.75 15 3-3m0 0-3-3m3 3h-7.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
                                </svg>
                            </div>
                            <div>
                                Menu Item Label
                            </div>
                        </div>
    
                        <div className="flex gap-2 px-1.5 py-3 rounded-xl">
                            <div>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5"
                                     stroke="currentColor" className="size-6">
                                    <path strokeLinecap="round" strokeLinejoin="round"
                                          d="m12.75 15 3-3m0 0-3-3m3 3h-7.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
                                </svg>
                            </div>
                            <div>
                                Menu Item Label
                            </div>
                        </div>
    
                    </div>

                        <div id="marketSidebarBottomMenu"
                             className="mt-auto flex flex-col gap-1 px-4 font-black text-gray-700">
                            <div id="marketPersonalizedMessage" className="text-gray-400 text-xs text-center mb-3">
                                <p>Welcome back, {session.user.name}</p>
                                {!session.user.emailVerified && (
                                    <p className="text-yellow-600 mt-1">Email not verified</p>
                                )}
                            </div>

                            <Link href="/logout">
                                <div className="flex gap-2 px-1.5 py-3 rounded-xl hover:bg-gray-300">
                                    <div>
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                             strokeWidth="1.5"
                                             stroke="currentColor" className="size-6">
                                            <path strokeLinecap="round" strokeLinejoin="round"
                                                  d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15m-3 0-3-3m0 0 3-3m-3 3H15"/>
                                        </svg>
                                    </div>
                                    <div>
                                        Logout
                                    </div>
                                </div>
                            </Link>
                        </div>

                    </div>

            </div>

            <div id="marketContent" className="flex flex-col grow">
                {children}
            </div>

        </div>
    );
}