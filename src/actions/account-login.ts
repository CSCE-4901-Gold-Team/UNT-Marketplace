"use server";

import {FormResponse} from "@/types/FormResponse";
import * as z from "zod";
import {ZodValidators} from "@/utils/ZodValidators";
import {FormStatus} from "@/constants/FormStatus";
import {auth, prisma} from "@/lib/auth";
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
                content: "One or more validation errors have occured."
            }
        };
    }

    // Check if email is verified before allowing login
    const user = await prisma.user.findUnique({
        where: { email: parsedFormData.data.email },
        select: { emailVerified: true },
    });

    if (user && !user.emailVerified) {
        return {
            status: FormStatus.ERROR,
            message: {
                type: "error",
                content: "Please verify your email before logging in. Check your inbox for a verification link, or visit the resend verification page.",
            },
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
        return {
            status: FormStatus.ERROR,
            message: {
                type: "error",
                content: error instanceof APIError ?
                    error.message : "An internal service error occured during login."
            }
        };
    }

    // Success    
    return {
        status: FormStatus.SUCCESS
    };
}