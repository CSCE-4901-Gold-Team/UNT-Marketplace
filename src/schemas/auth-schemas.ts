<<<<<<< Updated upstream
import { z } from "zod";

export const ForgotPasswordSchema = z.object({
    email: z
        .string()
        .min(1, "Email is required")
        .email("Please enter a valid email address"),
});

export const ResetPasswordSchema = z.object({
    password: z
        .string()
        .min(8, "Password must be at least 8 characters long")
        .regex(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/,
            "Password must contain at least one uppercase letter, one lowercase letter, and one number"
        ),
    confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});

export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;
=======
import * as z from "zod";
import { ZodValidators } from "@/utils/ZodValidators";

export const ForgotPasswordSchema = z.object({
    email: ZodValidators.email,
});

export const ResetPasswordSchema = z.object({
    password: ZodValidators.password,
    confirm_password: ZodValidators.password,
}).refine(
    ZodValidators.passwordConfirmation.check, 
    ZodValidators.passwordConfirmation.params
);
>>>>>>> Stashed changes
