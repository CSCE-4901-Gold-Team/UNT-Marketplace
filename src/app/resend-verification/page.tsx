"use client";

import React, { useActionState, useEffect, useState } from "react";
import TextInput from "@/components/ui/TextInput";
import Button from "@/components/ui/Button";
import { FormResponse } from "@/types/FormResponse";
import { FormStatus } from "@/constants/FormStatus";
import Alert from "@/components/ui/Alert";
import Link from "next/link";
import { toastService } from "@/lib/toast-service";
import Card from "@/components/ui/Card";
import { auth } from "@/lib/auth";

// Create this action in a new file
export async function resendVerificationAction(initialState: FormResponse, formData: FormData): Promise<FormResponse> {
    const email = formData.get("email") as string;

    if (!email) {
        return {
            status: FormStatus.ERROR,
            message: {
                type: "error",
                content: "Email is required."
            }
        };
    }

    try {
        await auth.api.sendVerificationEmail({
            body: {
                email
            }
        });
    } catch (error) {
        return {
            status: FormStatus.ERROR,
            message: {
                type: "error",
                content: "Failed to send verification email. Please check your email address."
            }
        };
    }

    return {
        status: FormStatus.SUCCESS,
        message: {
            type: "success",
            content: "Verification email sent. Please check your inbox."
        }
    };
}

export default function ResendVerificationPage() {
    const [email, setEmail] = useState("");

    const [formResponse, formAction, isPending] =
        useActionState<FormResponse, FormData>(resendVerificationAction, { status: FormStatus.INITIALIZED });

    useEffect(() => {
        if (formResponse.status === FormStatus.INITIALIZED) return;

        if (formResponse.message) {
            toastService.toast(formResponse.message.content, formResponse.message.type);
        }
    }, [formResponse]);

    return (
        <div className="flex flex-col min-h-screen items-center justify-center bg-gray-100 px-4 gap-5">
            <Card>
                <h1 className="mb-6 text-center text-2xl font-semibold">Resend Verification Email</h1>
                <p className="mb-6 text-center text-gray-600">
                    Enter your email address and we'll send you a new verification link.
                </p>

                {formResponse.status === FormStatus.SUCCESS && (
                    <Alert alertType="success">
                        <h3>Email Sent!</h3>
                        <p>Check your inbox for the verification link.</p>
                    </Alert>
                )}

                <form action={formAction} className="space-y-4">
                    <div>
                        <TextInput
                            inputLabel="Email"
                            type="email"
                            name="email"
                            required={true}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            validationErrors={formResponse.validationErrors}
                        />
                    </div>

                    <div className="text-center mt-8">
                        <Button
                            type="submit"
                            showSpinner={isPending || formResponse.status === FormStatus.SUCCESS}
                            buttonSize="lg"
                        >
                            Send Verification Email
                        </Button>
                    </div>
                </form>
            </Card>

            <p><Link href="/login">Back to login</Link></p>
        </div>
    );
}