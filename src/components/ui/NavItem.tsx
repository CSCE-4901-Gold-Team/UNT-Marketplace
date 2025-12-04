"use client"

import React from "react";
import Link from "next/link";

export default function NavItem({
    children,
    link,
    setShowSidebarAction,
}: {
    children?: React.ReactNode;
    link: string;
    setShowSidebarAction: (newVal: boolean) => void;
}) {

    return (
        <Link href={link} onClick={() => setShowSidebarAction(false)}>
            <div className="flex gap-2 px-1.5 py-3 rounded-xl hover:bg-gray-300">
                {children}
            </div>
        </Link>
    );
}
