"use client";

import React, {useActionState, useEffect, useState} from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import TextInput from "@/components/ui/TextInput";
import Button from "@/components/ui/Button";
import {registerAction} from "@/actions/account-register";
import {FormResponse} from "@/types/FormResponse";
import {FormStatus} from "@/constants/FormStatus";

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
        console.log(registerFormResponse);
        
    }, [registerFormResponse])
    
    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-md">
                <h1 className="mb-6 text-center text-2xl font-semibold">Sign Up</h1>
                
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
                            validationErrors={registerFormResponse.validationErrors}
                        />
                    </div>

                    <div className="text-center">
                        <Button
                            type="submit"
                            showSpinner={isPending}
                            buttonSize="lg"
                        >
                            Register
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
