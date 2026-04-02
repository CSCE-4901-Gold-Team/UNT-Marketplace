"use server";

import React from "react";
import "@/styles/globals.css";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import MarketHeader from "@/components/ui/MarketHeader";

export default async function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  return (
    <div
      id="marketContainer"
      className="flex flex-col lg:flex-row min-h-screen items-stretch bg-white"
    >
      {/* Sidebar - same as market */}
      <div className="flex-100 lg:flex-[0_0_auto] lg:w-[350px]">
        <MarketHeader />
      </div>

      {/* Main Content */}
      <div id="marketContent" className="flex flex-col w-full">
        {children}
      </div>
    </div>
  );
}
