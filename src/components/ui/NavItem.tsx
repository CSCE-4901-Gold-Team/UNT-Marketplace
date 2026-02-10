"use client"

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavItem({
    children,
    link,
    setShowSidebarAction,
}: {
    children?: React.ReactNode;
    link: string;
    setShowSidebarAction: (newVal: boolean) => void;
}) {
    const pathname = usePathname();
    const isActive = pathname === link || (link.includes('?') && pathname === link.split('?')[0]);
    const containerClasses = [ 
        isActive ? "bg-green-600 flex gap-3 px-3 py-4 rounded-xl dark:hover:bg-gray-700 transition-colors text-white hover:bg-gray-300 dark:bg-green-700" 
        : "flex gap-3 px-3 py-4 rounded-xl dark:hover:bg-gray-700 transition-colors hover:bg-gray-300",
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
