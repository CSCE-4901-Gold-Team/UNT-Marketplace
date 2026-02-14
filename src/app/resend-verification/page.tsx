"use client";

import React, { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import TextInput from "@/components/ui/TextInput";
import Button from "@/components/ui/Button";
import { FormResponse } from "@/types/FormResponse";
import { FormStatus } from "@/constants/FormStatus";
import Alert from "@/components/ui/Alert";
import Link from "next/link";
import { toastService } from "@/lib/toast-service";
import { resendVerificationAction } from "@/actions/resend-verification";
import Card from "@/components/ui/Card";
import DarkModeToggle from "@/components/ui/DarkModeToggle";

export default function ResendVerificationPage() {
    const [email, setEmail] = useState("");

    const [formResponse, formAction, isPending] =
        useActionState<FormResponse, FormData>(resendVerificationAction, {
            status: FormStatus.INITIALIZED,
        });

    useEffect(() => {
        if (formResponse.status === FormStatus.INITIALIZED) return;

        if (formResponse.message) {
            toastService.toast(
                formResponse.message.content,
                formResponse.message.type
            );
        }
    }, [formResponse]);

    return (
        <div className="flex flex-col min-h-screen items-center justify-center bg-white dark:bg-gray-900 px-4 gap-5 transition-colors">
            <div className="absolute top-4 right-4">
                <DarkModeToggle />
            </div>
            <Card>
                <h1 className="mb-6 text-center text-2xl font-semibold">
                    Resend Verification Email
                </h1>

                <p className="text-center text-gray-600 dark:text-gray-300 mb-6">
                    Enter your email address and we&#39;ll send you a new verification
                    link.
                </p>

                {formResponse.status === FormStatus.SUCCESS && (
                    <Alert alertType="success">
                        <h3>Email Sent!</h3>
                        <p>{formResponse.message?.content}</p>
                    </Alert>
                )}

                {formResponse.status === FormStatus.ERROR && (
                    <Alert alertType="error">
                        <h3>Error</h3>
                        <p>{formResponse.message?.content}</p>
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
                            showSpinner={isPending}
                            buttonSize="lg"
                            buttonClasses="min-w-[200px]"
                        >
                            Send Verification Email
                        </Button>
                    </div>
                </form>
            </Card>

            <p className="text-gray-700 dark:text-gray-300">
                <Link href="/login" className="text-green-700 dark:text-green-400 hover:underline font-semibold">Back to Login</Link>
            </p>
        </div>
    );
}