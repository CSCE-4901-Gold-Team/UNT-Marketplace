"use client"

import React from "react";
import Link from "next/link";

export default function NavItem({
    children,
    link,
    setShowSidebarAction,
    className,
}: {
    children?: React.ReactNode;
    link: string;
    setShowSidebarAction: (newVal: boolean) => void;
    className?: string;
}) {

    const containerClasses = [
        "flex gap-3 px-3 py-4 rounded-xl dark:hover:bg-gray-700 transition-colors hover:bg-gray-300",
        className,
    ].filter(Boolean).join(" ");

    return (
        <Link
            href={link}
            onClick={() => setShowSidebarAction(false)}
            className="no-underline "
        >
            <div className={containerClasses}>
                {children}
            </div>
        </Link>
    );
}
