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
    // Schema for the "Forgot Password" form (only requires email)
    ForgotPasswordRequest: z.object({
        email: z.string().email("Please enter a valid email address"),
    }),

    // Schema for the "Reset Password" form (requires new password and confirmation)
    ResetPasswordRequest: z.object({
        password: z.string()
            .min(8, "Password must be at least 8 characters")
            .max(32, "Password cannot be longer than 32 characters"),
        confirm_password: z.string()
            .min(8, "Password must be at least 8 characters")
            .max(32, "Password cannot be longer than 32 characters"),
    }).refine(
        (data) => data.password === data.confirm_password, 
        {
            message: "Passwords do not match",
            path: ["confirm_password"],
        }
    )
};
