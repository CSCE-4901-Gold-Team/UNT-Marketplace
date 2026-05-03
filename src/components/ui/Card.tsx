"use client"

import React from "react";

export default function Card({
    children,
}: {
    children?: React.ReactNode;
}) {
    
    return (
        <div className="w-full max-w-md rounded-2xl bg-gray-50 p-6 shadow-md">
            {children}
        </div>
    );
}
