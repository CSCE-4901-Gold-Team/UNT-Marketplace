// actions/account-recovery.ts

"use server";

import {FormResponse} from "@/types/FormResponse";
import {FormStatus} from "@/constants/FormStatus";
import {ForgotPasswordSchema, ResetPasswordSchema} from "@/schemas/auth-schemas";
import {auth} from "@/lib/auth";
import {APIError} from "better-auth";

export async function forgotPasswordAction(initialState: FormResponse, formData: FormData): Promise<FormResponse> {
    const parsedFormData = ForgotPasswordSchema.safeParse({
        email: formData.get("email"),
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

    try {
        await auth.api.requestPasswordReset({
            body: {
                email: parsedFormData.data.email,
                redirectTo: "/reset-password" // This is the URL Better Auth will use to construct the password reset link.
            }
        });
    } catch (error) {
        // Handle API errors
        return {
            status: FormStatus.ERROR,
            message: {
                type: "error",
                content: error instanceof APIError ?
                    error.message : "An internal service error occurred."
            }
        };
    }

    // Success
    return {
        status: FormStatus.SUCCESS,
        message: {
            type: "success",
            content: "A password reset link has been sent to your email."
        }
    };
}

export async function resetPasswordAction(initialState: FormResponse, formData: FormData): Promise<FormResponse> {
    const parsedFormData = ResetPasswordSchema.safeParse({
        password: formData.get("password"),
        confirm_password: formData.get("confirm_password"),
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

    const { token } = (new URL(formData.get("pathname") as string)).searchParams;

    if (!token) {
        return {
            status: FormStatus.ERROR,
            message: {
                type: "error",
                content: "Invalid or missing reset token."
            }
        };
    }

    try {
        await auth.api.resetPassword({
            body: {
                password: parsedFormData.data.password,
                token: token,
            }
        });
    } catch (error) {
        // Handle API errors
        return {
            status: FormStatus.ERROR,
            message: {
                type: "error",
                content: error instanceof APIError ?
                    error.message : "An internal service error occurred."
            }
        };
    }

    // Success
    return {
        status: FormStatus.SUCCESS,
        message: {
            type: "success",
            content: "Your password has been reset successfully."
        }
    };
}