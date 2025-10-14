import * as z from "zod";

export const ZodValidators = {
    // Static validators
    password: z.string().min(8).max(32),
    
    // Refinement functions
    passwordConfirmation: {
        check: (data: {password: string, confirm_password: string}) => 
            data.password === data.confirm_password, 
        params: {
            message: "Passwords do not match",
            path: ["confirm_password"],
        }
    }
}
