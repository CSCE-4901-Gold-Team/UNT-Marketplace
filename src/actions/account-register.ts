"use server";

import {FormResponse} from "@/types/FormResponse";
import * as z from "zod";
import {ZodValidators} from "@/utils/ZodValidators";
import {FormStatus} from "@/constants/FormStatus";
import {auth} from "@/lib/auth";
import {APIError} from "better-auth";

const RegisterRequest = z.object({
        email: ZodValidators.email,
        password: ZodValidators.password,
        confirm_password: ZodValidators.password,
        first_name: z.string(),
        last_name: z.string()
    })
    .refine(ZodValidators.passwordConfirmation.check, ZodValidators.passwordConfirmation.params);

export async function registerAction(initialState: FormResponse, formData: FormData): Promise<FormResponse> {

    // Parse and validate form data
    const parsedFormData = RegisterRequest.safeParse({
        email: formData.get("email"),
        password: formData.get("password"),
        confirm_password: formData.get("confirm_password"),
        first_name: formData.get("first_name"),
        last_name: formData.get("last_name"),
    });
    
    if (!parsedFormData.success) {
        return {
            status: FormStatus.ERROR,
            validationErrors: parsedFormData.error.issues,
            message: {
                type: "error",
                content: "One or more validation errors have occured."
            }
        };
    }
    
    // Send registration request
    try {
        await auth.api.signUpEmail({
            body: {
                email: parsedFormData.data.email,
                password: parsedFormData.data.password,
                name: parsedFormData.data.first_name + " " + parsedFormData.data.last_name,
            }
        });
    } catch (error) {
        // Registration failed
        return {
            status: FormStatus.ERROR,
            message: {
                type: "error",
                content: error instanceof APIError ?
                    error.message : "An internal service error occured during registration."
            }
        };
    }

    // Success    
    return {
        status: FormStatus.SUCCESS
    };
}
