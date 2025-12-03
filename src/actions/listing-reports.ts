"use server";

import { auth } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { headers } from "next/headers";
import { CreateReportSchema, CreateReportInput } from "@/schemas/report-schemas";

const prisma = new PrismaClient();

interface SubmitReportResult {
    success: boolean;
    message: string;
    error?: string;
}

/**
 * Submit a report for a listing
 * @param input Report submission data
 * @returns Result of the report submission
 */
export async function submitListingReport(
    input: CreateReportInput
): Promise<SubmitReportResult> {
    try {
        // Validate session
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session || !session.user) {
            return {
                success: false,
                message: "You must be logged in to report a listing",
                error: "NOT_AUTHENTICATED"
            };
        }

        // Validate input
        const validationResult = CreateReportSchema.safeParse(input);
        if (!validationResult.success) {
            return {
                success: false,
                message: "Invalid report data",
                error: validationResult.error.message
            };
        }

        const { listingId, reason, details } = validationResult.data;

        // Check if listing exists
        const listing = await prisma.listing.findUnique({
            where: { id: listingId }
        });

        if (!listing) {
            return {
                success: false,
                message: "Listing not found",
                error: "LISTING_NOT_FOUND"
            };
        }

        // Check if user has already reported this listing
        const existingReport = await prisma.report.findUnique({
            where: {
                listingId_reporterId: {
                    listingId,
                    reporterId: session.user.id
                }
            }
        });

        if (existingReport) {
            return {
                success: false,
                message: "You have already reported this listing",
                error: "DUPLICATE_REPORT"
            };
        }

        // Create the report
        const report = await prisma.report.create({
            data: {
                listingId,
                reporterId: session.user.id,
                reason,
                details: details || null
            }
        });

        return {
            success: true,
            message: "Report submitted successfully. Thank you for helping keep our marketplace safe."
        };
    } catch (error) {
        console.error("Error submitting report:", error);
        return {
            success: false,
            message: "An error occurred while submitting your report",
            error: error instanceof Error ? error.message : "UNKNOWN_ERROR"
        };
    } finally {
        await prisma.$disconnect();
    }
}
