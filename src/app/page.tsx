"use client"

import { authClient } from "@/lib/auth-client"
import {useEffect, useState} from "react";

export default function Home() {
    const [session, setSession] = useState<null | typeof authClient.$Infer.Session>(null);

    useEffect(() => {
        const fetchSession = async () => {
            const { data: session, error } = await authClient.getSession();

            if (!error) {
                setSession(session);
            }

            return !!error;
        }

        fetchSession().then(errorOcurred => {
            if (errorOcurred) {
                console.log("Error occured during session call");
            }
        });
    }, []);

    return (
        <main className="flex min-h-screen items-center justify-center bg-gray-100">
            <div className="container mx-auto max-w-2xl rounded-2xl bg-white p-8 shadow-lg text-center">
                <p>
                    Session Info:<br/>{ session?.user.name ?? "No session found" }
                </p>
            </div>
        </main>
    );
}
