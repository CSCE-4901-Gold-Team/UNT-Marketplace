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