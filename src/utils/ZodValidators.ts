﻿import * as z from "zod";
import { ALLOWED_EMAIL_DOMAINS } from "@/constants/AuthConfig";

export const ZodValidators = {
    // Static validators
    password: z.string()
        .min(8, "Password must be at least 8 characters")
        .max(32, "Password cannot be longer than 32 characters"),
    
    email: z.string()
        .email("Please enter a valid email address")
        .refine(
            (email) => {
                const domain = email.split('@')[1];
                return ALLOWED_EMAIL_DOMAINS.includes(domain);
            },
            {
                message: `Only ${ALLOWED_EMAIL_DOMAINS.join(" or ")} email addresses are allowed`
            }
        ),
    
    // Refinement functions
    passwordConfirmation: {
        check: (data: {password: string, confirm_password: string}) => 
            data.password === data.confirm_password, 
        params: {
            message: "Passwords do not match",
            path: ["password"],
        }
    }
}