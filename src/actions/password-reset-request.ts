"use server";

import { FormResponse } from "@/types/FormResponse";
import { FormStatus } from "@/constants/FormStatus";
import { ForgotPasswordSchema } from "@/schemas/auth-schemas";
import { auth } from "@/lib/auth";
import { APIError } from "better-auth";

export async function passwordResetRequestAction(
    initialState: FormResponse, 
    formData: FormData
): Promise<FormResponse> {
    
    console.log("Password reset request initiated");
    
    // Parse and validate form data
    const parsedFormData = ForgotPasswordSchema.safeParse({
        email: formData.get("email"),
    });

    if (!parsedFormData.success) {
        console.log("Validation failed:", parsedFormData.error.issues);
        return {
            status: FormStatus.ERROR,
            validationErrors: parsedFormData.error.issues,
            message: {
                type: "error",
                content: "One or more validation errors have occurred."
            }
        };
    }

    console.log("Requesting password reset for:", parsedFormData.data.email);

    // Send password reset request using Better Auth
    try {
        await auth.api.forgetPassword({
            body: {
                email: parsedFormData.data.email,
                redirectTo: `${process.env.BETTER_AUTH_URL || process.env.APP_URL}/reset-password`,
            }
        });
        
        console.log("Password reset email sent successfully");
    } catch (error) {
        console.error("Password reset request failed:", error);
        
        // Request failed - but don't reveal if the email exists
        // So return success anyway, but log actual error for debugging
        return {
            status: FormStatus.SUCCESS,
            message: {
                type: "success",
                content: "If an account exists with that email, a password reset link has been sent."
            }
        };
    }

    // Success
    return {
        status: FormStatus.SUCCESS,
        message: {
            type: "success",
            content: "If an account exists with that email, a password reset link has been sent."
        }
    };
}