"use client"

import React from "react";
import Link from "next/link";
import Image from "next/image";
import {IoMdCloseCircle} from "react-icons/io";
import NavItem from "@/components/ui/NavItem";
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

    const sidebarClassList = "flex flex-col w-11/12 max-w-[350px] fixed top-0 bottom-0 z-50 transition-all duration-600 ease-in-out " +
        (showSidebar ? "left-0" : "-left-full") +
        " lg:left-0";

    return (
        <div id="marketSidebar" className={sidebarClassList}>
            <div className="h-screen flex flex-col gap-6 py-6 w-full bg-gradient-to-b from-gray-50 to-gray-100 shadow-2xl transition-all">
                <button className="absolute top-2 right-3 text-4xl bg-green text-white rounded-full lg:hidden hover:bg-green-700 transition-colors"
                    onClick={() => setShowSidebarAction(false)}>
                    <IoMdCloseCircle />
                </button>

                {/* Sidebar Logo */}
                <div id="marketSidebarLogo" className="bg-gradient-to-r from-green-600 to-green-700 text-white p-5 px-4 shadow-lg -me-2 rounded-r-2xl">
                    <div className="flex justify-center">
                        <Image src={UNTLogo} alt="UNT Logo" width={200} height={200} priority />
                    </div>
                </div>

                {/* TOP MENU */}
                <div id="marketSidebarTopMenu" className="flex flex-col gap-3 px-4 font-black text-gray-700">
                     <div className="flex items-center justify-between px-2 mb-1">
                        <div className="text-base font-black text-gray-500 uppercase tracking-wider">Marketplace</div>
                        <div className="flex items-center gap-2">
                            {/* Settings */}
                            <Link href="/profile" className="no-underline">
                                <button className="p-1.5 rounded-full hover:bg-gray-200 transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5 text-gray-600">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                    </svg>
                                </button>
                            </Link>
                            
                        </div>
                    </div>

                    {/* View Listings */}
                    <NavItem
                        link="/market"
                        setShowSidebarAction={(newVal: boolean) => setShowSidebarAction(newVal)}
                    >
                        <div>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                 strokeWidth="1.5" stroke="currentColor" className="size-6">
                                <path strokeLinecap="round" strokeLinejoin="round"
                                      d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614" />
                            </svg>
                        </div>
                        <div>View Listings</div>
                    </NavItem>

                    {/* Create Listing */}
                    <NavItem
                        link="/market/create-listing"
                        setShowSidebarAction={(newVal: boolean) => setShowSidebarAction(newVal)}
                    >
                        <div>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                 strokeWidth="1.5" stroke="currentColor" className="size-6">
                                <path strokeLinecap="round" strokeLinejoin="round"
                                      d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                        </div>
                        <div>Create Listing</div>
                    </NavItem>

                    {/* My Listings */}
                    <NavItem
                        link="/market?mine=1"
                        setShowSidebarAction={(newVal: boolean) => setShowSidebarAction(newVal)}
                    >
                        <div>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                 strokeWidth="1.5" stroke="currentColor" className="size-6">
                                <path strokeLinecap="round" strokeLinejoin="round"
                                      d="M8.25 6.75h12m-12 5.25h12m-12 5.25h12m-15.75-10.5h.008v.008H4.5V6.75Zm0 5.25h.008v.008H4.5V12Zm0 5.25h.008v.008H4.5v-.008Z" />
                            </svg>
                        </div>
                        <div>My Listings</div>
                    </NavItem>

                    {/* Messages */}
                    <NavItem
                        link="/market/messages"
                        setShowSidebarAction={(newVal: boolean) => setShowSidebarAction(newVal)}
                    >
                        <div>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                 strokeWidth="1.5" stroke="currentColor" className="size-6">
                                <path strokeLinecap="round" strokeLinejoin="round"
                                      d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
                            </svg>
                        </div>
                        <div>Messages</div>
                    </NavItem>

                </div>

                {/* BOTTOM MENU */}
                <div id="marketSidebarBottomMenu" className="mt-auto flex flex-col gap-1 px-4 font-black text-gray-700">
                    <div className="border-t border-gray-300 pt-4 flex flex-col gap-1">

                        {/* Logout */}
                        <Link href="/logout" className="no-underline">
                            <div className="flex flex-col items-center justify-center gap-1.5 px-2 py-3 rounded-xl hover:bg-red-100 hover:text-red-700 transition-all">
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
    );
}
