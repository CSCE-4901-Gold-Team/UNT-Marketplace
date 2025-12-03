"use server";

import {FormResponse} from "@/types/FormResponse";
import {FormStatus} from "@/constants/FormStatus";
import {auth} from "@/lib/auth";
import {headers} from "next/headers";
import {PrismaClient} from "@/generated/prisma";
import {redirect} from "next/navigation";

export async function deleteListingAction(listingId: string): Promise<FormResponse> {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session?.user) {
        return {
            status: FormStatus.ERROR,
            message: {
                type: "error",
                content: "You must be logged in to delete a listing."
            }
        };
    }

    const prisma = new PrismaClient();

    try {
        // Verify the listing exists and belongs to the user
        const listing = await prisma.listing.findUnique({
            where: { id: listingId },
            select: { ownerId: true }
        });

        if (!listing) {
            await prisma.$disconnect();
            return {
                status: FormStatus.ERROR,
                message: {
                    type: "error",
                    content: "Listing not found."
                }
            };
        }

        if (listing.ownerId !== session.user.id) {
            await prisma.$disconnect();
            return {
                status: FormStatus.ERROR,
                message: {
                    type: "error",
                    content: "You don't have permission to delete this listing."
                }
            };
        }

        // Delete associated images first
        await prisma.image.deleteMany({
            where: { listingId: listingId }
        });

        // Delete the listing
        await prisma.listing.delete({
            where: { id: listingId }
        });

        await prisma.$disconnect();
    } catch (error) {
        await prisma.$disconnect();
        console.error("Error deleting listing:", error);
        return {
            status: FormStatus.ERROR,
            message: {
                type: "error",
                content: `Failed to delete listing: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
        };
    }

    // Redirect to market page after successful deletion
    redirect("/market");
}
