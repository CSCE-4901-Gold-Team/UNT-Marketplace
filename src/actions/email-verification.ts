"use server";

import { FormResponse } from "@/types/FormResponse";
import * as z from "zod";
import { ZodValidators } from "@/utils/ZodValidators";
import { FormStatus } from "@/constants/FormStatus";
import { auth } from "@/lib/auth";
import { APIError } from "better-auth";
import { headers } from "next/headers";

// -----------------------------
// Request Schemas
// -----------------------------
const SendVerificationOtpRequest = z.object({
    email: ZodValidators.email,
});

const VerifyEmailOtpRequest = z.object({
    email: ZodValidators.email,
    otp: z
        .string()
        .min(6, "OTP must be at least 6 characters")
        .max(8, "OTP cannot be longer than 8 characters"),
});

// -----------------------------
// Send Verification OTP
// -----------------------------
export async function sendVerificationOtpAction(
    initialState: FormResponse,
    formData: FormData
): Promise<FormResponse> {
    const parsedFormData = SendVerificationOtpRequest.safeParse({
        email: formData.get("email"),
    });

    if (!parsedFormData.success) {
        return {
            status: FormStatus.ERROR,
            validationErrors: parsedFormData.error.issues,
            message: {
                type: "error",
                content: "One or more validation errors have occurred.",
            },
        };
    }

    try {
        const result = await auth.api.sendVerificationOTP({
            headers: await headers(),
            body: {
                email: parsedFormData.data.email,
            },
        });

        console.log("[OTP Send] Success:", result);
    } catch (error: any) {
        console.error("[OTP Send] Error Details:", {
            error,
            message: error?.message,
            stack: error?.stack,
            name: error?.name,
        });

        let errorMessage = "An internal service error occurred while sending verification code.";

        if (error instanceof APIError) errorMessage = error.message;
        else if (error?.message) errorMessage = error.message;
        else if (typeof error === "string") errorMessage = error;

        return {
            status: FormStatus.ERROR,
            message: { type: "error", content: errorMessage },
        };
    }

    return {
        status: FormStatus.SUCCESS,
        message: {
            type: "success",
            content:
                "Verification code has been sent to your email. Please check your email inbox.",
        },
    };
}

// -----------------------------
// Verify Email OTP
// -----------------------------
export async function verifyEmailOtpAction(
    initialState: FormResponse,
    formData: FormData
): Promise<FormResponse> {
    const parsedFormData = VerifyEmailOtpRequest.safeParse({
        email: formData.get("email"),
        otp: formData.get("otp"),
    });

    if (!parsedFormData.success) {
        return {
            status: FormStatus.ERROR,
            validationErrors: parsedFormData.error.issues,
            message: {
                type: "error",
                content: "One or more validation errors have occurred.",
            },
        };
    }

    try {
        const result = await auth.api.verifyEmailOTP({
            headers: await headers(),
            body: {
                email: parsedFormData.data.email,
                otp: parsedFormData.data.otp,
            },
        });

        console.log("[OTP Verify] Success:", result);
    } catch (error: any) {
        console.error("[OTP Verify] Error Details:", {
            error,
            message: error?.message,
            stack: error?.stack,
            name: error?.name,
        });

        let errorMessage = "Invalid verification code. Please try again.";

        if (error instanceof APIError) errorMessage = error.message;
        else if (error?.message) errorMessage = error.message;
        else if (typeof error === "string") errorMessage = error;

        return {
            status: FormStatus.ERROR,
            message: { type: "error", content: errorMessage },
        };
    }

    return {
        status: FormStatus.SUCCESS,
        message: {
            type: "success",
            content: "Email verified successfully!",
        },
    };
}
