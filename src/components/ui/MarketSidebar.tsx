"use client"

import React from "react";
import Link from "next/link";
import Image from "next/image";
import {IoMdCloseCircle} from "react-icons/io";
import NavItem from "@/components/ui/NavItem";
import BackgroundToggleButton from "@/components/ui/BackgroundToggleButton";
import { usePathname } from "next/navigation";
import UNTLogo from "@/assets/UNT 16.png";

export default function MarketSidebar({
    showSidebar,
    setShowSidebarAction,
}: {
    showSidebar: boolean;
    setShowSidebarAction: (newVal: boolean) => void;
}) {
    const pathname = usePathname();

    const sidebarClassList = "flex flex-col w-11/12 max-w-[350px] fixed top-0 bottom-0 z-50 transition-all duration-300 ease-in-out " +
        (showSidebar ? "left-0" : "-left-full") +
        " lg:left-0";

    return (
        <div id="marketSidebar" className={sidebarClassList}>
            <div className="h-screen flex flex-col gap-6 py-6 w-full bg-linear-to-b from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 shadow-2xl transition-all">
                <button className="absolute top-2 right-3 text-4xl bg-green text-white rounded-full lg:hidden hover:bg-green-700 transition-colors"
                    onClick={() => setShowSidebarAction(false)}>
                    <IoMdCloseCircle />
                </button>

                {/* Sidebar Logo */}
                <div id="marketSidebarLogo" className="bg-linear-to-r from-green-600 to-green-700 text-white p-5 px-4 shadow-lg -me-2 rounded-r-2xl">
                    <div className="flex justify-center">
                        <Image src={UNTLogo} alt="UNT Logo" width={200} height={200} priority />
                    </div>
                    <div className="text-3xl font-black text-center tracking-tight">UNT Marketplace</div>
                    <div className="text-sm text-end me-4 opacity-90 font-semibold">Buy. Sell. Swap.</div>
                </div>

                {/* MARKETPLACE SECTION */}
                <div className="flex flex-col gap-2 px-4">
                    <div className="flex items-center justify-between px-2 mb-1">
                        <div className="text-base font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider">Marketplace</div>
                        <div className="flex items-center gap-2">
                            {/* Settings */}
                            <Link href="/profile" className="no-underline">
                                <button className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5 text-gray-600 dark:text-gray-400">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                    </svg>
                                </button>
                            </Link>
                            
                            {/* Background Toggle Button (Moon/Sun) */}
                            <BackgroundToggleButton />
                        </div>
                    </div>
                    
                    <div className="flex flex-col gap-2 font-bold text-base text-gray-700 dark:text-gray-200">
                        {/* Browse Listings */}
                        <NavItem
                            link="/market"
                            setShowSidebarAction={(newVal: boolean) => setShowSidebarAction(newVal)}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                 strokeWidth="1.5" stroke="currentColor" className="size-7">
                                <path strokeLinecap="round" strokeLinejoin="round"
                                      d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614" />
                            </svg>
                            <span className="text-base">Browse Listings</span>
                        </NavItem>

                        {/* Create Listing */}
                        <NavItem
                            link="/market/create-listing"
                            setShowSidebarAction={(newVal: boolean) => setShowSidebarAction(newVal)}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                 strokeWidth="1.5" stroke="currentColor" className="size-7">
                                <path strokeLinecap="round" strokeLinejoin="round"
                                      d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                            <span className="text-base">Create Listing</span>
                        </NavItem>

                        {/* Messages */}
                        <NavItem
                            link="/market/messages"
                            setShowSidebarAction={(newVal: boolean) => setShowSidebarAction(newVal)}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                 strokeWidth="1.5" stroke="currentColor" className="size-7">
                                <path strokeLinecap="round" strokeLinejoin="round"
                                      d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                            </svg>
                            <span>My Listings</span>
                        </NavItem>

                        {/* Messages */}
                        <NavItem
                            link="/market/messages"
                            setShowSidebarAction={(newVal: boolean) => setShowSidebarAction(newVal)}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                 strokeWidth="1.5" stroke="currentColor" className="size-7">
                        {/* Favorites */}
                        <NavItem
                            link="/market?filter=favorites"
                            setShowSidebarAction={(newVal: boolean) => setShowSidebarAction(newVal)}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                 strokeWidth="1.5" stroke="currentColor" className="size-6">
                                <path strokeLinecap="round" strokeLinejoin="round"
                                      d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                            </svg>
                            <span className="text-base">Messages</span>
                        </NavItem>
                    </div>
                </div>

                {/* ACCOUNT SECTION */}
                <div id="marketSidebarBottomMenu" className="mt-auto flex flex-col gap-2 px-4 font-bold text-gray-700 dark:text-gray-200">
                    <div className="border-t border-gray-300 dark:border-gray-600 pt-4 pb-2">
                        <div className="text-base font-bold text-gray-500 dark:text-gray-400 px-2 mb-3 uppercase tracking-wider">Account</div>
                        
                        {/* Logout */}
                        <Link href="/logout" className="no-underline">
                            <div className="flex flex-col items-center justify-center gap-1.5 px-2 py-3 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-700 dark:hover:text-red-400 transition-all">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none"
                                     viewBox="0 0 24 24" strokeWidth="1.5"
                                     stroke="currentColor" className="size-7">
                                    <path strokeLinecap="round" strokeLinejoin="round"
                                          d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15m-3 0-3-3m0 0 3-3m-3 3H15" />
                                </svg>
                                <span className="text-sm">Logout</span>
                            </div>
                        </Link>
                    </div>
                </div>

            </div>
        </div>
    );
}
