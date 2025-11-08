"use server";

import { FormResponse } from "@/types/FormResponse";
import * as z from "zod";
import { ZodValidators } from "@/utils/ZodValidators";
import { FormStatus } from "@/constants/FormStatus";
import { auth } from "@/lib/auth";
import { APIError } from "better-auth";

const PasswordResetConfirm = z.object({
    password: ZodValidators.password,
    confirm_password: ZodValidators.password,
})
    .refine(ZodValidators.passwordConfirmation.check, ZodValidators.passwordConfirmation.params);

export async function passwordResetConfirmAction(initialState: FormResponse, formData: FormData): Promise<FormResponse> {
    // Parse and validate form data
    const parsedFormData = PasswordResetConfirm.safeParse({
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

    // Get token from URL
    const token = formData.get("token") as string;

    if (!token) {
        return {
            status: FormStatus.ERROR,
            message: {
                type: "error",
                content: "Invalid or missing reset token."
            }
        };
    }

    // Reset password
    try {
        await auth.api.resetPassword({
            body: {
                newPassword: parsedFormData.data.password,
                token: token,
            }
        });
    } catch (error) {
        // Reset failed
        return {
            status: FormStatus.ERROR,
            message: {
                type: "error",
                content: error instanceof APIError ?
                    error.message : "An internal service error occurred during password reset."
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