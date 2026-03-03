"use server"

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import Link from "next/link";
import DarkModeToggle from "@/components/ui/DarkModeToggle";

export default async function Home() {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    return (
        <main className="flex min-h-screen items-center justify-center bg-white dark:bg-gray-900 px-4">
            <div className="absolute top-2 right-2 sm:top-4 sm:right-4">
                <DarkModeToggle />
            </div>
            <div className="container mx-auto max-w-2xl rounded-xl sm:rounded-2xl bg-white dark:bg-gray-800 p-4 sm:p-8 shadow-lg text-center">

                <div className="flex flex-wrap gap-2 sm:gap-4 justify-center">
                    <Link className="text-sm sm:text-lg font-black px-2 sm:px-3 py-1 sm:py-1.5 bg-green-600 rounded text-white no-underline" href="/register">Register</Link>
                    <Link className="text-sm sm:text-lg font-black px-2 sm:px-3 py-1 sm:py-1.5 bg-blue-500 rounded text-white no-underline" href="/login">Login</Link>
                    <Link className="text-sm sm:text-lg font-black px-2 sm:px-3 py-1 sm:py-1.5 bg-amber-500 rounded text-white no-underline" href="/logout">Logout</Link>
                    <Link className="text-sm sm:text-lg font-black px-2 sm:px-3 py-1 sm:py-1.5 bg-teal-600 rounded text-white no-underline" href="/market">Market</Link>
                    <Link className="text-sm sm:text-lg font-black px-2 sm:px-3 py-1 sm:py-1.5 bg-red-300 rounded text-white no-underline" href="/admin">Admin</Link>
                </div>

                <p className="mt-4 sm:mt-5 text-sm sm:text-base">
                    Session Info:<br />{session?.user.name ?? "No session found"}
                </p>
            </div>
        </main>
    );
}
