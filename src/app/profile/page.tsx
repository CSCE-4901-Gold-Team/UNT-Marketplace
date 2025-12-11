"use server"

import React from "react";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import ProfileEditor from "@/components/profile/ProfileEditor";
import Link from "next/link";

export default async function ProfilePage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  const { name, email, image } = session.user;

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="container mx-auto max-w-2xl rounded-2xl bg-white p-8 shadow-lg block relative" >
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">My Profile</h1>
          <Link href="/market" className="text-green-600 hover:text-green-800 font-bold bottom-1.5 right-10 absolute">
            Back to Marketplace &rarr;
          </Link>
        </div>

        <ProfileEditor initialName={name} initialEmail={email} initialImage={image} />
      </div>
    </main>
  );
}
