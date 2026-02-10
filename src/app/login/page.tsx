"use client";

import React, {useActionState, useEffect, useState} from "react";
import { useRouter } from "next/navigation";
import TextInput from "@/components/ui/TextInput";
import Button from "@/components/ui/Button";
import {FormResponse} from "@/types/FormResponse";
import {FormStatus} from "@/constants/FormStatus";
import Alert from "@/components/ui/Alert";
import Link from "next/link";
import {toastService} from "@/lib/toast-service";
import {loginAction} from "@/actions/account-login";
import Card from "@/components/ui/Card";
import DarkModeToggle from "@/components/ui/DarkModeToggle";

export default function LoginPage() {
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [loginFormResponse, loginFormAction, isPending] =
        useActionState<FormResponse, FormData>(loginAction, { status: FormStatus.INITIALIZED });

    useEffect(() => {
        if (loginFormResponse.status === FormStatus.INITIALIZED) return;

        // Display any passed message
        if (loginFormResponse.message) {
            toastService.toast(loginFormResponse.message.content, loginFormResponse.message.type);
        }

        // Redirect user on success
        if (loginFormResponse.status === FormStatus.SUCCESS) {
            router.push("/market");
        }
    }, [loginFormResponse, router]);

    return (
        <div className="flex flex-col min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900 px-4 gap-5 transition-colors">
            <div className="absolute top-4 right-4">
                <DarkModeToggle />
            </div>
            <Card>
                <h1 className="mb-6 text-center text-2xl font-semibold">Login</h1>

                { loginFormResponse.status === FormStatus.SUCCESS &&
                    <Alert alertType="success">
                        <h3>Login success!</h3>
                        <p>If you&#39;re not redirected <Link href="/">click here</Link></p>
                    </Alert>
                }

                { loginFormResponse.status === FormStatus.ERROR && loginFormResponse.message?.content.includes("verify your email") &&
                    <Alert alertType="error">
                        <h3>Email Not Verified</h3>
                        <p>You must verify your email before logging in.</p>
                        <p className="mt-2">
                            <Link href="/resend-verification" className="text-green-700 font-semibold hover:underline">
                                Resend Verification Email
                            </Link>
                        </p>
                    </Alert>
                }

                <form action={loginFormAction} className="space-y-4">

                    <div>
                        <TextInput
                            inputLabel="Email"
                            type="email"
                            name="email"
                            required={true}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            validationErrors={loginFormResponse.validationErrors}
                        />
                    </div>

                    <div>
                        <TextInput
                            inputLabel="Password"
                            type="password"
                            name="password"
                            required={true}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            validationErrors={loginFormResponse.validationErrors}
                        />
                        <p className="text-end text-sm mt-1"><Link href="/forgot-password" className="text-green-700 dark:text-green-400 hover:underline">Forgot password</Link>
                        </p>
                    </div>

                    <div className="text-center mt-8">
                        <Button
                            type="submit"
                            showSpinner={isPending || loginFormResponse.status === FormStatus.SUCCESS}
                            buttonSize="lg"
                            buttonClasses="min-w-[200px]"
                        >
                            Login
                        </Button>
                    </div>
                </form>
            </Card>

            <p><Link href="/register">Don&#39;t have an account?</Link></p>
        </div>
    );
}
