"use client"

import React, {useState} from "react";
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

            <div className="flex justify-between items-center lg:justify-end">
                <button
                    className="p-4 text-4xl lg:hidden"
                    onClick={() => { setShowSidebar(!showSidebar); }}
                >
                    <RiMenu3Fill />
                </button>
            </div>

            <MarketSidebar
                showSidebar={showSidebar}
                setShowSidebarAction={(newVal: boolean) => setShowSidebar(newVal)}
            />
        </div>
    );
}
