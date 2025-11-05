"use client";

import React, {useActionState, useEffect, useState} from "react";
import { useRouter } from "next/navigation";
import TextInput from "@/components/ui/TextInput";
import Button from "@/components/ui/Button";
import {registerAction} from "@/actions/account-register";
import {FormResponse} from "@/types/FormResponse";
import {FormStatus} from "@/constants/FormStatus";
import Alert from "@/components/ui/Alert";
import Link from "next/link";
import {toastService} from "@/lib/toast-service";
import Card from "@/components/ui/Card";

export default function SignUpPage() {
    const router = useRouter();

    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [passwordConfirm, setPasswordConfirm] = useState("");
    
    const [registerFormResponse, registerFormAction, isPending] =
        useActionState<FormResponse, FormData>(registerAction, { status: FormStatus.INITIALIZED });

    useEffect(() => {
        if (registerFormResponse.status === FormStatus.INITIALIZED) return;
        
        // Display any passed message
        if (registerFormResponse.message) {
            toastService.toast(registerFormResponse.message.content, registerFormResponse.message.type);
        }
        
        // Redirect user on success
        if (registerFormResponse.status === FormStatus.SUCCESS) {
            router.push("/market");
        }
    }, [registerFormResponse, router]);
    
    return (
        <div className="flex flex-col min-h-screen items-center justify-center bg-gray-100 px-4 gap-5">
            <Card>
                <h1 className="mb-6 text-center">Create Your Account</h1>

                {registerFormResponse.status === FormStatus.SUCCESS &&
                    <Alert alertType="success">
                        <h3>Registration success!</h3>
                        <p>If you&#39;re not redirected <Link href="/">click here</Link></p>
                    </Alert>
                }

                <form action={registerFormAction} className="space-y-4">

                    <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                            <TextInput
                                inputLabel="First Name"
                                type="text"
                                name="first_name"
                                required={true}
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                validationErrors={registerFormResponse.validationErrors}
                            />
                        </div>

                        <div>
                            <TextInput
                                inputLabel="Last Name"
                                type="text"
                                name="last_name"
                                required={true}
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                validationErrors={registerFormResponse.validationErrors}
                            />
                        </div>
                    </div>

                    <div>
                        <TextInput
                            inputLabel="Email"
                            type="email"
                            name="email"
                            required={true}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            validationErrors={registerFormResponse.validationErrors}
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
                            validationErrors={registerFormResponse.validationErrors}
                        />
                    </div>

                    <div>
                        <TextInput
                            inputLabel="Confirm Password"
                            type="password"
                            name="confirm_password"
                            required={true}
                            value={passwordConfirm}
                            onChange={(e) => setPasswordConfirm(e.target.value)}
                        />
                    </div>

                    <div className="text-center mt-8">
                        <Button
                            type="submit"
                            showSpinner={isPending || registerFormResponse.status === FormStatus.SUCCESS}
                            buttonSize="lg"
                            buttonClasses="min-w-[200px]"
                        >
                            Register
                        </Button>
                    </div>
                </form>
            </Card>

            <p><Link href="/login">Already have an account?</Link></p>
        </div>
    );
}
