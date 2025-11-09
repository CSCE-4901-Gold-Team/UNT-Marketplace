"use server"

import {auth} from "@/lib/auth";
import {headers} from "next/headers";
import Link from "next/link";

export default async function Home() {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    return (
        <main className="flex min-h-screen items-center justify-center bg-gray-100">
            <div className="container mx-auto max-w-2xl rounded-2xl bg-white p-8 shadow-lg text-center">
                
                <div className="flex gap-4 justify-center">
                    <Link className="text-lg font-black px-3 py-1.5 bg-green-600 rounded text-white no-underline" href="/register">Register</Link>
                    <Link className="text-lg font-black px-3 py-1.5 bg-blue-500 rounded text-white no-underline" href="/login">Login</Link>
                    <Link className="text-lg font-black px-3 py-1.5 bg-amber-500 rounded text-white no-underline" href="/logout">Logout</Link>
                    <Link className="text-lg font-black px-3 py-1.5 bg-teal-600 rounded text-white no-underline" href="/market">Market</Link>
                </div>
                
                <p className="mt-5">
                    Session Info:<br/>{ session?.user.name ?? "No session found" }
                </p>
                
                {session && !session.user.emailVerified && (
                    <div className="mt-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
                        <p>Your email is not verified.</p>
                        <Link href="/resend-verification" className="text-blue-600 hover:underline">
                            Resend verification email
                        </Link>
                    </div>
                )}
            </div>
        </main>
    );
}