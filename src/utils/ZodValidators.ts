import * as z from "zod";

export const ZodValidators = {
    // Static validators
    password: z.string()
        .min(8, "Password must be at least 8 characters")
        .max(32, "Password cannot be longer than 32 characters"),
    email: z.email("Please enter a valid email address"),
    
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
