"use client"

import React from "react";

export default function Card({
    children,
}: {
    children?: React.ReactNode;
}) {
    
    return (
        <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-md transition-colors">
            {children}
        </div>
    );
}
