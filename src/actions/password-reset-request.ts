"use server";

import { FormResponse } from "@/types/FormResponse";
import * as z from "zod";
import { ZodValidators } from "@/utils/ZodValidators";
import { FormStatus } from "@/constants/FormStatus";
import { prisma } from "@/lib/auth";
import { sendPasswordResetEmail } from "@/lib/email-service";

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
        // Check if user exists
        const user = await prisma.user.findUnique({
            where: { email: parsedFormData.data.email }
        });

        if (!user) {
            // For security, don't reveal if email exists or not
            return {
                status: FormStatus.SUCCESS,
                message: {
                    type: "success",
                    content: "If an account with that email exists, a password reset link has been sent."
                }
            };
        }

        // Generate reset token and send email
        const resetUrl = `${process.env.APP_URL}/reset-password?email=${encodeURIComponent(user.email)}`;
        await sendPasswordResetEmail(user.email, resetUrl);

    } catch (error) {
        // Request failed
        return {
            status: FormStatus.ERROR,
            message: {
                type: "error",
                content: "An internal service error occurred during password reset request."
            }
        };
    }

    // Success
    return {
        status: FormStatus.SUCCESS,
        message: {
            type: "success",
            content: "If an account with that email exists, a password reset link has been sent."
        }
    };
}