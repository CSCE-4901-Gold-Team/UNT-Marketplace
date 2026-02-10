"use client"

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

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
    const pathname = usePathname();
    const isActive = pathname === link || (link.includes('?') && pathname === link.split('?')[0]);

    const containerClasses = [
        "flex gap-3 px-3 py-4 rounded-xl hover:bg-gray-300",
        className,
    ].filter(Boolean).join(" ");

    return (
        <Link href={link} onClick={() => setShowSidebarAction(false)} className="no-underline">
            <div className={`flex items-center gap-3 px-3 py-3.5 rounded-xl transition-colors ${
                isActive 
                    ? "bg-green-600 text-white dark:bg-green-700" 
                    : "hover:bg-gray-300 dark:hover:bg-gray-700"
            }`}>
                {children}
            </div>
        </Link>
    );
}
