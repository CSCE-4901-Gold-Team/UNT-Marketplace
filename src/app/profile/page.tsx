"use server"

import React from "react";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import ProfileEditor from "@/components/profile/ProfileEditor";
import Link from "next/link";
import DarkModeToggle from "@/components/ui/DarkModeToggle";

export default async function ProfilePage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  const { name, email, image } = session.user;

  return (
    <main className="min-h-screen px-8 py-4 lg:px-20 lg:py-12 dark:bg-gray-900 transition-colors">
      <div className="absolute top-4 right-4">
        <DarkModeToggle />
      </div>
      <div className="w-full max-w-4xl mx-auto dark:bg-gray-800 transition-colors">
        <Link href="/market" className="text-green hover:underline mb-4 inline-block dark:text-green-400">
          ← Back to Marketplace
        </Link>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-4xl font-bold mb-6">My Profile</h1>
          <ProfileEditor initialName={name} initialEmail={email} initialImage={image} />
        </div>
      </div>
    </main>
  );
}
