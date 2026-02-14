"use server";

import { FormResponse } from "@/types/FormResponse";
import * as z from "zod";
import { ZodValidators } from "@/utils/ZodValidators";
import { FormStatus } from "@/constants/FormStatus";
import { auth, prisma } from "@/lib/auth";

const ResendVerificationRequest = z.object({
    email: ZodValidators.email,
});

export async function resendVerificationAction(
    initialState: FormResponse,
    formData: FormData
): Promise<FormResponse> {
    // Parse and validate form data
    const parsedFormData = ResendVerificationRequest.safeParse({
        email: formData.get("email"),
    });

    if (!parsedFormData.success) {
        return {
            status: FormStatus.ERROR,
            validationErrors: parsedFormData.error.issues,
            message: {
                type: "error",
                content: "Please enter a valid email address.",
            },
        };
    }

    const email = parsedFormData.data.email;

    try {
        // Check if user exists and is not already verified
        const user = await prisma.user.findUnique({
            where: { email },
            select: { emailVerified: true },
        });

        if (!user) {
            // Don't reveal whether the email exists - show a generic success message
            return {
                status: FormStatus.SUCCESS,
                message: {
                    type: "success",
                    content:
                        "If an account with that email exists and is not yet verified, a verification email has been sent.",
                },
            };
        }

        if (user.emailVerified) {
            return {
                status: FormStatus.SUCCESS,
                message: {
                    type: "success",
                    content:
                        "Your email is already verified. You can log in.",
                },
            };
        }

        // Use better-auth's API to send verification email
        await auth.api.sendVerificationEmail({
            body: {
                email,
                callbackURL: "/verify-email",
            },
        });

        return {
            status: FormStatus.SUCCESS,
            message: {
                type: "success",
                content:
                    "A verification email has been sent. Please check your inbox and click the verification link.",
            },
        };
    } catch (error) {
        console.error("Resend verification error:", error);
        return {
            status: FormStatus.ERROR,
            message: {
                type: "error",
                content: "Failed to send verification email. Please try again later.",
            },
        };
    }
}