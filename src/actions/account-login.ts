"use server";

import {FormResponse} from "@/types/FormResponse";
import * as z from "zod";
import {ZodValidators} from "@/utils/ZodValidators";
import {FormStatus} from "@/constants/FormStatus";
import {auth} from "@/lib/auth";
import {APIError} from "better-auth";

const LoginRequest = z.object({
    email: ZodValidators.email,
    password: z.string(),
});

export async function loginAction(initialState: FormResponse, formData: FormData): Promise<FormResponse> {

    // Parse and validate form data
    const parsedFormData = LoginRequest.safeParse({
        email: formData.get("email"),
        password: formData.get("password")
    });

    if (!parsedFormData.success) {
        return {
            status: FormStatus.ERROR,
            validationErrors: parsedFormData.error.issues,
            message: {
                type: "error",
                content: "One or more validation errors have occurred."
            }
        };
    }

    // Send login request
    try {
        await auth.api.signInEmail({
            body: {
                email: parsedFormData.data.email,
                password: parsedFormData.data.password,
            }
        });
    } catch (error) {
        // Login failed
        if (error instanceof APIError && error.statusCode === 403) {
            // This might be an unverified email
            return {
                status: FormStatus.ERROR,
                message: {
                    type: "error",
                    content: "Please verify your email before logging in. Check your spam or request a new verification email."
                },
                // Add a flag to show the resend option
                requiresVerification: true
            };
        }
        
        return {
            status: FormStatus.ERROR,
            message: {
                type: "error",
                content: error instanceof APIError ?
                    error.message : "An internal service error occurred during login."
            }
        };
    }

    // Success    
    return {
        status: FormStatus.SUCCESS
    };
}