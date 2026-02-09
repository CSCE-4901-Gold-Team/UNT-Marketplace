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
        <Link
            href={link}
            onClick={() => setShowSidebarAction(false)}
            className="no-underline"
        >
            <div className="flex gap-3 px-3 py-4 rounded-xl hover:bg-gray-300">
                {children}
            </div>
        </Link>
    );
}
