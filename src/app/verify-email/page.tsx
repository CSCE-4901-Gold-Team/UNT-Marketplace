"use client";

import React, { useActionState, useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import TextInput from "@/components/ui/TextInput";
import Button from "@/components/ui/Button";
import { sendVerificationOtpAction, verifyEmailOtpAction } from "@/actions/email-verification";
import { FormResponse } from "@/types/FormResponse";
import { FormStatus } from "@/constants/FormStatus";
import Alert from "@/components/ui/Alert";
import Link from "next/link";
import { toastService } from "@/lib/toast-service";
import Card from "@/components/ui/Card";

function VerifyEmailContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const emailFromQuery = searchParams.get("email") || "";

    const [email, setEmail] = useState(emailFromQuery);
    const [otp, setOtp] = useState("");
    const [otpSent, setOtpSent] = useState(false);

    const [sendOtpResponse, sendOtpAction, isSendingOtp] =
        useActionState<FormResponse, FormData>(sendVerificationOtpAction, { status: FormStatus.INITIALIZED });

    const [verifyOtpResponse, verifyOtpAction, isVerifyingOtp] =
        useActionState<FormResponse, FormData>(verifyEmailOtpAction, { status: FormStatus.INITIALIZED });

    // Auto-send OTP if email is provided from registration
    useEffect(() => {
        if (emailFromQuery && !otpSent && sendOtpResponse.status === FormStatus.INITIALIZED) {
            const formData = new FormData();
            formData.append("email", emailFromQuery);
            sendOtpAction(formData);
            // Don't set otpSent here - wait for success response
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Only run once on mount

    useEffect(() => {
        if (sendOtpResponse.status === FormStatus.INITIALIZED) return;

        if (sendOtpResponse.message) {
            toastService.toast(sendOtpResponse.message.content, sendOtpResponse.message.type);
            if (sendOtpResponse.status === FormStatus.SUCCESS) {
                setOtpSent(true);
            } else if (sendOtpResponse.status === FormStatus.ERROR) {
                // Reset otpSent on error so user can retry
                setOtpSent(false);
            }
        }
    }, [sendOtpResponse]);

    useEffect(() => {
        if (verifyOtpResponse.status === FormStatus.INITIALIZED) return;

        if (verifyOtpResponse.message) {
            toastService.toast(verifyOtpResponse.message.content, verifyOtpResponse.message.type);
        }

        // Redirect user on successful verification
        if (verifyOtpResponse.status === FormStatus.SUCCESS) {
            setTimeout(() => {
                router.push("/market");
            }, 1500);
        }
    }, [verifyOtpResponse, router]);

    const handleSendOtp = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append("email", email);
        sendOtpAction(formData);
    };

    const handleVerifyOtp = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append("email", email);
        formData.append("otp", otp);
        verifyOtpAction(formData);
    };

    return (
        <div className="flex flex-col min-h-screen items-center justify-center bg-gray-100 px-4 gap-5">
            <Card>
                <h1 className="mb-6 text-center text-2xl font-semibold">Verify Your Email</h1>
                <p className="mb-6 text-center text-gray-600">
                    Please verify your email address to continue. A verification code has been sent to your email.
                </p>

                {verifyOtpResponse.status === FormStatus.SUCCESS && (
                    <Alert alertType="success">
                        <h3>Email Verified!</h3>
                        <p>Your email has been verified successfully. Redirecting you...</p>
                    </Alert>
                )}

                {!otpSent ? (
                    <form onSubmit={handleSendOtp} className="space-y-4">
                        <div>
                            <TextInput
                                inputLabel="Email"
                                type="email"
                                name="email"
                                required={true}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                validationErrors={sendOtpResponse.validationErrors}
                                placeholder="Enter your email address"
                            />
                        </div>

                        <div className="text-center mt-8">
                            <Button
                                type="submit"
                                showSpinner={isSendingOtp || sendOtpResponse.status === FormStatus.SUCCESS}
                                buttonSize="lg"
                            >
                                Send Verification Code
                            </Button>
                        </div>
                    </form>
                ) : (
                    <form onSubmit={handleVerifyOtp} className="space-y-4">
                        <div>
                            <TextInput
                                inputLabel="Email"
                                type="email"
                                name="email"
                                required={true}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={true}
                            />
                            <p className="text-sm text-gray-500 mt-1">
                                A verification code has been sent to this email address.
                            </p>
                        </div>

                        <div>
                            <TextInput
                                inputLabel="Verification Code"
                                type="text"
                                name="otp"
                                required={true}
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                                validationErrors={verifyOtpResponse.validationErrors}
                                placeholder="Enter 6-digit code"
                                maxLength={8}
                            />
                            <p className="text-sm text-gray-500 mt-1">
                                Enter the verification code sent to your email.
                            </p>
                        </div>

                        <div className="text-center mt-8">
                            <Button
                                type="submit"
                                showSpinner={isVerifyingOtp || verifyOtpResponse.status === FormStatus.SUCCESS}
                                buttonSize="lg"
                            >
                                Verify Email
                            </Button>
                        </div>

                        <div className="text-center">
                            <button
                                type="button"
                                onClick={() => {
                                    setOtpSent(false);
                                    setOtp("");
                                }}
                                className="text-sm text-blue-600 hover:text-blue-800 underline"
                            >
                                Resend verification code
                            </button>
                        </div>
                    </form>
                )}
            </Card>

            <p><Link href="/login">Back to login</Link></p>
        </div>
    );
}

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={
            <div className="flex min-h-screen items-center justify-center bg-gray-100">
                <div className="text-center">Loading...</div>
            </div>
        }>
            <VerifyEmailContent />
        </Suspense>
    );
}
