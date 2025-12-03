import * as z from "zod";

export const CreateReportSchema = z.object({
    listingId: z.string().min(1, "Listing ID is required"),
    reason: z.enum([
        "FRAUDULENT",
        "OFFENSIVE_CONTENT",
        "INAPPROPRIATE",
        "INCORRECT_DESCRIPTION",
        "DUPLICATE_LISTING",
        "NOT_AVAILABLE",
        "SCAM",
        "OTHER",
    ]),
    details: z.string().max(1000, "Details must be less than 1000 characters").optional(),
});

export type CreateReportInput = z.infer<typeof CreateReportSchema>;
