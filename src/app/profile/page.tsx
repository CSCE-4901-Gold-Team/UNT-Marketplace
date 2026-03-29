import React from "react";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ProfileTabs } from "@/components/ProfileTabs";

export default async function ProfilePage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  const { name, email, image } = session.user;

  return (
    <main className="min-h-screen px-8 py-4 lg:px-20 lg:py-12">
      <div className="w-full max-w-4xl mx-auto">
        <Link href="/market" className="text-green hover:underline mb-4 inline-block">
          ← Back to Marketplace
        </Link>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-4xl font-bold mb-6">My Profile</h1>
          <ProfileTabs initialName={name} initialEmail={email} initialImage={image} />
        </div>
      </div>
    </main>
  );
}
