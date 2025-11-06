"use client";

import React, { useActionState, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import TextInput from "@/components/ui/TextInput";
import Button from "@/components/ui/Button";
import { FormResponse } from "@/types/FormResponse";
import { FormStatus } from "@/constants/FormStatus";
import Alert from "@/components/ui/Alert";
import Link from "next/link";
import { toastService } from "@/lib/toast-service";
import { passwordResetConfirmAction } from "@/actions/password-reset-confirm";
import Card from "@/components/ui/Card";

export default function ResetPasswordPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    const [password, setPassword] = useState("");
    const [passwordConfirm, setPasswordConfirm] = useState("");

    const [formResponse, formAction, isPending] =
        useActionState<FormResponse, FormData>(passwordResetConfirmAction, { status: FormStatus.INITIALIZED });

    useEffect(() => {
        if (formResponse.status === FormStatus.INITIALIZED) return;

        if (formResponse.message) {
            toastService.toast(formResponse.message.content, formResponse.message.type);
        }

        // Redirect user on success
        if (formResponse.status === FormStatus.SUCCESS) {
            router.push("/login");
        }
    }, [formResponse, router]);

    if (!token) {
        return (
            <div className="flex flex-col min-h-screen items-center justify-center bg-gray-100 px-4 gap-5">
                <Card>
                    <h1 className="mb-6 text-center text-2xl font-semibold">Invalid Reset Link</h1>
                    <p className="mb-6 text-center text-gray-600">
                        The password reset link is invalid or has expired.
                    </p>
                    <div className="text-center">
                        <Link href="/forgot-password" className="text-green-700 hover:underline">
                            Request a new reset link
                        </Link>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen items-center justify-center bg-gray-100 px-4 gap-5">
            <Card>
                <h1 className="mb-6 text-center text-2xl font-semibold">Set New Password</h1>

                {formResponse.status === FormStatus.SUCCESS && (
                    <Alert alertType="success">
                        <h3>Password reset successful!</h3>
                        <p>If you're not redirected, <Link href="/login">click here</Link></p>
                    </Alert>
                )}

                <form action={formAction} className="space-y-4">
                    <input type="hidden" name="token" value={token} />

                    <div>
                        <TextInput
                            inputLabel="New Password"
                            type="password"
                            name="password"
                            required={true}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            validationErrors={formResponse.validationErrors}
                        />
                    </div>

                    <div>
                        <TextInput
                            inputLabel="Confirm New Password"
                            type="password"
                            name="confirm_password"
                            required={true}
                            value={passwordConfirm}
                            onChange={(e) => setPasswordConfirm(e.target.value)}
                            validationErrors={formResponse.validationErrors}
                        />
                    </div>

                    <div className="text-center mt-8">
                        <Button
                            type="submit"
                            showSpinner={isPending || formResponse.status === FormStatus.SUCCESS}
                            buttonSize="lg"
                        >
                            Reset Password
                        </Button>
                    </div>
                </form>
            </Card>

            <p><Link href="/login">Back to login</Link></p>
        </div>
    );
}