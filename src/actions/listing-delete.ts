"use server";

import {FormResponse} from "@/types/FormResponse";
import {FormStatus} from "@/constants/FormStatus";
import {auth} from "@/lib/auth";
import {headers} from "next/headers";
import {redirect} from "next/navigation";
import { prisma } from "@/lib/prisma";

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

    try {
        // Verify the listing exists and belongs to the user
        const listing = await prisma.listing.findUnique({
            where: { id: listingId },
            select: { ownerId: true }
        });

        if (!listing) {
            return {
                status: FormStatus.ERROR,
                message: {
                    type: "error",
                    content: "Listing not found."
                }
            };
        }

        if (listing.ownerId !== session.user.id) {
            return {
                status: FormStatus.ERROR,
                message: {
                    type: "error",
                    content: "You don't have permission to delete this listing."
                }
            };
        }

        await prisma.$transaction(async (tx) => {
            await tx.listingEvent.deleteMany({
                where: { listingId: listingId }
            });

            await tx.image.deleteMany({
                where: { listingId: listingId }
            });

            await tx.listing.delete({
                where: { id: listingId }
            });
        });

    } catch (error) {
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
    redirect("/market?deleted=true");
}
