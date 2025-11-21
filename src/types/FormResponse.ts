import {FormStatusType} from "@/constants/FormStatus";
import * as z from "zod";

export interface FormResponse {
    status: FormStatusType;

    // Message to be displayed as a toast
    message?: {
        type: "success" | "info" | "error" | "warn";
        content: string;
        delay?: number;
        duration?: number;
    };

    // Error fields
    validationErrors?: z.core.$ZodIssue[];
}
