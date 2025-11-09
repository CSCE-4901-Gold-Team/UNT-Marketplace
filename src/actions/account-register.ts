"use server";
import { FormResponse } from "@/types/FormResponse";
import * as z from "zod";
import { ZodValidators } from "@/utils/ZodValidators";
import { FormStatus } from "@/constants/FormStatus";
import { auth, ALLOWED_UNT_DOMAINS } from "@/lib/auth";
import { APIError } from "better-auth";

const RegisterRequest = z.object({
    email: ZodValidators.email,
    password: ZodValidators.password,
    confirm_password: ZodValidators.password,
    first_name: z.string(),
    last_name: z.string()
})
    .refine(ZodValidators.passwordConfirmation.check, ZodValidators.passwordConfirmation.params);

export async function registerAction(initialState: FormResponse, formData: FormData): Promise<FormResponse> {
<<<<<<< Updated upstream
=======

    console.log("Registration attempt started");
    
>>>>>>> Stashed changes
    // Parse and validate form data
    const parsedFormData = RegisterRequest.safeParse({
        email: formData.get("email"),
        password: formData.get("password"),
        confirm_password: formData.get("confirm_password"),
        first_name: formData.get("first_name"),
        last_name: formData.get("last_name"),
    });
<<<<<<< Updated upstream

=======
    
    console.log("Form data parsed:", parsedFormData.success ? "Success" : "Failed");
    
>>>>>>> Stashed changes
    if (!parsedFormData.success) {
        console.log("Validation errors:", parsedFormData.error.issues);
        return {
            status: FormStatus.ERROR,
            validationErrors: parsedFormData.error.issues,
            message: {
                type: "error",
                content: "One or more validation errors have occurred."
            }
        };
    }
<<<<<<< Updated upstream

    // Validate email domain for UNT emails only
    const email = parsedFormData.data.email;
    const emailDomain = email.split("@")[1]?.toLowerCase();

    if (!emailDomain || !ALLOWED_UNT_DOMAINS.includes(emailDomain)) {
        return {
            status: FormStatus.ERROR,
            message: {
                type: "error",
                content: `Only UNT email addresses (@${ALLOWED_UNT_DOMAINS.join(", @")}) are allowed for registration.`,
            },
        };
    }

=======
    
    console.log("Attempting to create user:", parsedFormData.data.email);
    
>>>>>>> Stashed changes
    // Send registration request
    try {
        await auth.api.signUpEmail({
            body: {
                email: parsedFormData.data.email,
                password: parsedFormData.data.password,
                name: parsedFormData.data.first_name + " " + parsedFormData.data.last_name,
            }
        });
        
        console.log("User created successfully");
    } catch (error) {
        // Log the actual error for debugging
        console.error("Registration error details:", {
            error,
            message: error instanceof Error ? error.message : "Unknown error",
            stack: error instanceof Error ? error.stack : undefined,
            apiError: error instanceof APIError ? {
                message: error.message,
                statusCode: error.statusCode,
                body: error.body
            } : "Not an APIError"
        });
        
        // Registration failed
        return {
            status: FormStatus.ERROR,
            message: {
                type: "error",
                content: error instanceof APIError ?
                    error.message : `Registration failed: ${error instanceof Error ? error.message : "Unknown error"}`
            }
        };
    }

    // Success    
    return {
        status: FormStatus.SUCCESS,
        message: {
            type: "success",
<<<<<<< Updated upstream
            content: "Account created successfully! Please check your email for verification code."
=======
            content: "Registration successful! Please check your email to verify your account."
>>>>>>> Stashed changes
        }
    };
}