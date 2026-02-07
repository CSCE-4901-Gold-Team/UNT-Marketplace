"use server";

import { FormResponse } from "@/types/FormResponse";
import * as z from "zod";
import { ZodValidators } from "@/utils/ZodValidators";
import { FormStatus } from "@/constants/FormStatus";
import { auth } from "@/lib/auth";
import { APIError } from "better-auth";

const PasswordResetRequest = z.object({
    email: ZodValidators.email,
});

export async function passwordResetRequestAction(initialState: FormResponse, formData: FormData): Promise<FormResponse> {
    // Parse and validate form data
    const parsedFormData = PasswordResetRequest.safeParse({
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

    // Send password reset request
    try {
        await auth.api.forgetPassword({
            body: {
                email: parsedFormData.data.email,
                redirectTo: `${process.env.APP_URL}/reset-password`,
            }
        });
    } catch (error) {
        // Request failed
        return {
            status: FormStatus.ERROR,
            message: {
                type: "error",
                content: error instanceof APIError ?
                    error.message : "An internal service error occurred during password reset request."
            }
        };
    }

    // Success
    return {
        status: FormStatus.SUCCESS,
        message: {
            type: "success",
            content: "Password reset link has been sent to your email."
        }
    };
}