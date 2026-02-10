"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { auth } from "@/lib/auth";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import Link from "next/link";
import Card from "@/components/ui/Card";
import DarkModeToggle from "@/components/ui/DarkModeToggle";

function VerifyEmailContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    const [status, setStatus] = useState<"success" | "error" | "info">("info");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    useEffect(() => {
        const verifyEmail = async () => {
            if (!token) {
                setStatus("info");
                setMessage("A verification link has been sent to your email. Please visit the link to verify your account and complete registration.");
                return;
            }

            try {
                setLoading(true);
                const response = await fetch(
                    `/api/auth/verify-email?token=${encodeURIComponent(token)}`,
                    {
                        method: "GET",
                    }
                );

                if (!response.ok) {
                    setStatus("error");
                    setMessage("Email verification failed. The link may have expired.");
                    return;
                }

                setStatus("success");
                setMessage("Your email has been verified successfully!");
            } catch (error) {
                setStatus("error");
                setMessage("Email verification failed. The link may have expired.");
            }
            setLoading(false);
        };

        verifyEmail();
    }, [token]);

    return (
        <div className="flex flex-col min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900 px-4 gap-5 transition-colors">
            <div className="absolute top-4 right-4">
                <DarkModeToggle />
            </div>
            <Card>
                <h1 className="mb-6 text-center text-2xl font-semibold">Email Verification</h1>

                {loading && (
                    <div className="text-center py-8">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                        <p className="mt-4">Verifying your email...</p>
                    </div>
                )}

                <div>
                    <Alert alertType={status}>
                        <p>{message}</p>
                    </Alert>
                    <div className="text-center mt-6">
                        <Button buttonSize="lg" onClick={() => router.push("/login")}>
                            Go to Login
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
}

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={
            <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900 transition-colors">
                <div className="text-center">Loading...</div>
            </div>
        }>
            <VerifyEmailContent />
        </Suspense>
    );
}
