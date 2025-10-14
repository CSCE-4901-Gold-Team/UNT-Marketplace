import * as z from "zod";

export const ErrorHelper = {
    // Extracts matching ZodIssues for a single input by path
    //
    getZodIssuesByPath: (issues: z.core.$ZodIssue[], path: string): z.core.$ZodIssue[] => {
        return issues?.filter((issue: z.core.$ZodIssue) => issue["path"].includes(path));
    }
}
