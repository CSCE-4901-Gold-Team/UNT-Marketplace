"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function SignUpPage() {
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage(null);
        setLoading(true);

        await authClient.signUp.email({
            email, // user email address
            password, // user password -> min 8 characters by default
            name, // user display name
        }, {
            onRequest: () => {
                setLoading(true);
            },
            onSuccess: () => {
                router.push("/");
            },
            onError: (ctx: any) => {
                setErrorMessage(ctx.error.message);
            },
        });
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-md">
                <h1 className="mb-6 text-center text-2xl font-semibold">Sign Up</h1>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium">Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="mt-1 w-full rounded-md border px-3 py-2"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="mt-1 w-full rounded-md border px-3 py-2"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            minLength={8}
                            required
                            className="mt-1 w-full rounded-md border px-3 py-2"
                        />
                    </div>

                    {errorMessage && (
                        <p className="text-sm text-red-500">{errorMessage}</p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? "Signing up..." : "Sign Up"}
                    </button>
                </form>
            </div>
        </div>
    );
}