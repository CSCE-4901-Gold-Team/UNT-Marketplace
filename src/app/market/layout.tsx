"use server"

import React from "react";
import "@/styles/globals.css";
import {auth} from "@/lib/auth";
import {headers} from "next/headers";
import {redirect} from "next/navigation";
import Link from "next/link";
import MarketSidebar from "@/components/ui/MarketSidebar";

export default async function MarketLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    
    const session = await auth.api.getSession({
        headers: await headers()
    });

    // Market route protection logic can be extended here
    if(!session) {
        redirect("/login");
    }
    
    return (
        <div id="marketContainer" className="flex min-h-screen items-stretch bg-white">
            <MarketSidebar userName={session.user.name} />
            
            <div id="marketContent" className="flex flex-col grow">
                {children}
            </div>
        </div>
    );
}
