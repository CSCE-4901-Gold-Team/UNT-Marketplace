"use client"

import React from "react";
import Link from "next/link";
import {IoMdCloseCircle} from "react-icons/io";
import NavItem from "@/components/ui/NavItem";

export default function MarketSidebar({
    showSidebar,
    setShowSidebarAction,
}: {
    showSidebar: boolean;
    setShowSidebarAction: (newVal: boolean) => void;
}) {

    const sidebarClassList = "flex flex-col w-11/12 max-w-[350px] fixed top-0 bottom-5 z-50 transition-all duration-600 ease-in-out " +
        (showSidebar ? "left-0" : "-left-full") +
        " lg:left-0";

    return (
        <div id="marketSidebar" className={sidebarClassList}>
            <div className="h-screen flex mb-5 flex-col top-0 gap-8 py-0 w-full bg-gray-100 shadow-2xl">
                <button className="absolute top-2 right-3 text-4xl bg-green text-white rounded-full lg:hidden"
                    onClick={() => setShowSidebarAction(false)}>
                    <IoMdCloseCircle />
                </button>

                
                <img src="/images/UNT.png" alt="UNT Logo" className="w-50 h-auto mx-auto mb-2 mt-8 " />

                

                {/* TOP MENU */}
                <div id="marketSidebarTopMenu" className="flex flex-col gap-1 px-4 font-extrabold text-black">
                    <div className="flex  justify-center items-center gap-3 mb-2">
                        <p className=" px-3 font-extrabold montserrat text-2xl">UNT Marketplace</p>
                        <Link href="/profile" className="flex-1 cursor-pointer overflow-hidden p-0  rounded-full border-0">
                            <div className="flex items-center justify-center  rounded-xl ">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" strokeWidth="1.5" stroke="currentColor" className="size-7 border-0 rounded-full p-0" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 14c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                                </svg>
                            </div>
                        </Link>
                        
                    </div>
                    <input
                            id="sidebar-search-2"
                            type="text"
                            placeholder="Search UNT Marketplace"
                            className="px-10 ml-0 py-2 rounded-full bg-gray-200 border border-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                        />

                    {/* View Listings */}
                    <NavItem
                        link="/market"
                        setShowSidebarAction={(newVal: boolean) => setShowSidebarAction(newVal)}
                    >
                        <div className="text-black gap-5 item-center flex justify-center text-decoration-line:none ">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                 strokeWidth="1.5" stroke="currentColor" className="size-8">
                                <path strokeLinecap="round" strokeLinejoin="round"
                                      d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614" />
                            </svg>
                        </div>
                        <div className="text-black mt-2 ml-4 gap-5 text-lg text-decoration-line:none">View Listings</div>
                    </NavItem>

                    {/* Create Listing */}
                    <NavItem className="text-decoration:none"
                        link="/market/create-listing"
                        setShowSidebarAction={(newVal: boolean) => setShowSidebarAction(newVal)}
                    >
                        <div className="flex gap-5 text-black px-1.5 py-3 rounded-xl hover:bg-gray-300">
                            <div>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                     strokeWidth="1.5" stroke="currentColor" className="size-6 text-decoration:none">
                                    <path strokeLinecap="round" strokeLinejoin="round"
                                          d="M12 4.5v15m7.5-7.5h-15" />
                                </svg>
                            </div>
                            <div className="col text-decoration:none text-lg text-black">Create Listing</div>
                        </div>
                    </NavItem>

                    {/* You can replace these with real menu items later */}
                    <div className="flex gap-5 px-1.5 py-3 rounded-xl">
                        <div>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none"
                                 viewBox="0 0 24 24" strokeWidth="1.5"
                                 stroke="currentColor" className="size-6">
                                <path strokeLinecap="round" strokeLinejoin="round"
                                      d="m12.75 15 3-3m0 0-3-3m3 3h-7.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                            </svg>
                        </div>
                        <div className="text-lg ml-2">Messages</div>
                    </div>

                    

                </div>

                {/* BOTTOM MENU */}
                <div id="marketSidebarBottomMenu" className="mt-auto mb-0 flex flex-col gap-1 px-4 font-black text-black">
                    <div id="marketPersonalizedMessage" className="text-gray-400 text-xs text-center mb-3">
                        <p>Welcome Back!</p>
                    </div>

                    <div className="border-t mb-2.5 border-gray-300 pt-4 flex flex-col gap-1">

                        {/* Logout */}
                        <Link href="/logout" className="flex-1 ">
                            <div className="flex text-black items-center justify-center gap-2 px-1.5 py-3 rounded-xl hover:bg-gray-300">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none"
                                     viewBox="0 0 24 24" strokeWidth="1.5"
                                     stroke="currentColor" className="size-6">
                                    <path strokeLinecap="round" strokeLinejoin="round"
                                          d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15m-3 0-3-3m0 0 3-3m-3 3H15" />
                                </svg>
                                <span >Logout</span>
                            </div>
                        </Link>

                    </div>
                </div>

            </div>
        </div>
    );
}
