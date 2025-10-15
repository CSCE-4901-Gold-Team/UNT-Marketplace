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
        <div className="flex flex-col min-h-screen items-center justify-center bg-gray-100 px-4 gap-5">
            <Card>
                <h1 className="mb-6 text-center text-2xl font-semibold">Login</h1>

                { loginFormResponse.status === FormStatus.SUCCESS &&
                    <Alert alertType="success">
                        <h3>Login success!</h3>
                        <p>If you&#39;re not redirected <Link href="/">click here</Link></p>
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
                        <p className="text-end text-sm text-gray-50 mt-1"><Link href="/#">Forgot password</Link></p>
                    </div>

                    <div className="text-center mt-8">
                        <Button
                            type="submit"
                            showSpinner={isPending || loginFormResponse.status === FormStatus.SUCCESS}
                            buttonSize="lg"
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
