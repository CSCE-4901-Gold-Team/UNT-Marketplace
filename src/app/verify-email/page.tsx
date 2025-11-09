"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { auth } from "@/lib/auth";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import Link from "next/link";
import Card from "@/components/ui/Card";

export default function VerifyEmailPage() {
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [message, setMessage] = useState("");
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get("token");

    useEffect(() => {
        const verifyEmail = async () => {
            if (!token) {
                setStatus("error");
                setMessage("Invalid verification link.");
                return;
            }

            try {
                await auth.api.verifyEmail({
                    query: {
                        token
                    }
                });
                setStatus("success");
                setMessage("Your email has been verified successfully!");
            } catch (error) {
                setStatus("error");
                setMessage("Email verification failed. The link may have expired.");
            }
        };

        verifyEmail();
    }, [token]);

    return (
        <div className="flex flex-col min-h-screen items-center justify-center bg-gray-100 px-4 gap-5">
            <Card>
                <h1 className="mb-6 text-center text-2xl font-semibold">Email Verification</h1>

                {status === "loading" && (
                    <div className="text-center py-8">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                        <p className="mt-4">Verifying your email...</p>
                    </div>
                )}

                {status === "success" && (
                    <div>
                        <Alert alertType="success">
                            <h3>Verification Successful!</h3>
                            <p>{message}</p>
                        </Alert>
                        <div className="text-center mt-6">
                            <Button 
                                onClick={() => router.push("/login")}
                                buttonSize="lg"
                            >
                                Go to Login
                            </Button>
                        </div>
                    </div>
                )}

                {status === "error" && (
                    <div>
                        <Alert alertType="error">
                            <h3>Verification Failed</h3>
                            <p>{message}</p>
                        </Alert>
                        <div className="text-center mt-6">
                            <Link href="/login">
                                <Button buttonSize="lg">
                                    Back to Login
                                </Button>
                            </Link>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
}