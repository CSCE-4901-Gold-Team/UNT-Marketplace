"use server";

import {FormResponse} from "@/types/FormResponse";
import {authClient} from "@/lib/auth-client";
import * as z from "zod";
import {ZodValidators} from "@/utils/ZodValidators";
import {FormStatus} from "@/constants/FormStatus";

const RegisterRequest = z.object({
        email: z.email(),
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
            validationErrors: parsedFormData.error.issues
        };
    }
    
    // Send registration request
    const { error } = await authClient.signUp.email({
        email: parsedFormData.data.email,
        password: parsedFormData.data.password,
        name: parsedFormData.data.last_name + " " + parsedFormData.data.last_name,
    });
    
    // Registration failed
    if (error) {
        return {
            status: FormStatus.ERROR,
            message: {
                type: "error",
                content: error.message ?? "An internal service error occured during registration."
            }
        };
    }
    
    return {
        status: FormStatus.SUCCESS
    };
}
