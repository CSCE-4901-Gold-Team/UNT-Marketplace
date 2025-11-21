"use server";

import { FormResponse } from "@/types/FormResponse";
import * as z from "zod";
import { ZodValidators } from "@/utils/ZodValidators";
import { FormStatus } from "@/constants/FormStatus";
import { APIError } from "better-auth";

// This file is deprecated - email verification is now handled through better-auth's built-in system
// See src/app/verify-email/page.tsx for the current implementation

// Placeholder to avoid breaking imports
export async function sendVerificationOtpAction(
    initialState: FormResponse,
    formData: FormData
): Promise<FormResponse> {
    return {
        status: FormStatus.ERROR,
        message: {
            type: "error",
            content: "This endpoint is deprecated. Please use the standard auth flow.",
        },
    };
}

export async function verifyEmailOtpAction(
    initialState: FormResponse,
    formData: FormData
): Promise<FormResponse> {
    return {
        status: FormStatus.ERROR,
        message: {
            type: "error",
            content: "This endpoint is deprecated. Please use the standard auth flow.",
        },
    };
}
