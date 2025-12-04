"use client"

import React, {useState} from "react";
import DarkModeToggle from "@/components/ui/DarkModeToggle";
import MarketSidebar from "@/components/ui/MarketSidebar";
import {RiMenu3Fill} from "react-icons/ri";

export default function MarketHeader({
    children,
}: {
    children?: React.ReactNode;
}) {
    const [showSidebar, setShowSidebar] = useState(false);

    return (
        <div id="marketHeader">

            <div className="flex items-center justify-between">
                <div className="text-right lg:hidden">
                    <button
                        className="p-4 text-4xl"
                        onClick={() => { setShowSidebar(!showSidebar); }}
                    >
                        <RiMenu3Fill />
                    </button>
                </div>
                <div className="pr-4">
                    <DarkModeToggle />
                </div>
            </div>

            <MarketSidebar
                showSidebar={showSidebar}
                setShowSidebarAction={(newVal: boolean) => setShowSidebar(newVal)}
            />
        </div>
    );
}
