"use server";
import { FormResponse } from "@/types/FormResponse";
import * as z from "zod";
import { ZodValidators } from "@/utils/ZodValidators";
import { FormStatus } from "@/constants/FormStatus";
import { auth } from "@/lib/auth";
import { APIError } from "better-auth";

const SendVerificationOtpRequest = z.object({
    email: ZodValidators.email,
});

const VerifyEmailOtpRequest = z.object({
    email: ZodValidators.email,
    otp: z.string().min(6, "OTP must be at least 6 characters").max(8, "OTP cannot be longer than 8 characters"),
});

export async function sendVerificationOtpAction(initialState: FormResponse, formData: FormData): Promise<FormResponse> {
    // Parse and validate form data
    const parsedFormData = SendVerificationOtpRequest.safeParse({
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

    // Send verification OTP using the emailOTP plugin
    try {
        // Use sendVerificationEmail from the emailOTP plugin
        await auth.api.sendVerificationEmail({
            body: {
                email: parsedFormData.data.email,
            }
        });
    } catch (error) {
        // Request failed
        return {
            status: FormStatus.ERROR,
            message: {
                type: "error",
                content: error instanceof APIError ?
                    error.message : "An internal service error occurred while sending verification code."
            }
        };
    }

    // Success
    return {
        status: FormStatus.SUCCESS,
        message: {
            type: "success",
            content: "Verification code has been sent to your email."
        }
    };
}

export async function verifyEmailOtpAction(initialState: FormResponse, formData: FormData): Promise<FormResponse> {
    // Parse and validate form data
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
                content: "One or more validation errors have occurred."
            }
        };
    }

    // Verify email with OTP
    try {
        await auth.api.verifyEmail({
            body: {
                email: parsedFormData.data.email,
                otp: parsedFormData.data.otp,
            }
        });
    } catch (error) {
        // Verification failed
        return {
            status: FormStatus.ERROR,
            message: {
                type: "error",
                content: error instanceof APIError ?
                    error.message : "Invalid verification code. Please try again."
            }
        };
    }

    // Success
    return {
        status: FormStatus.SUCCESS,
        message: {
            type: "success",
            content: "Email verified successfully!"
        }
    };
}
