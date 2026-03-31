"use server";

import { FormResponse } from "@/types/FormResponse";
import * as z from "zod";
import { FormStatus } from "@/constants/FormStatus";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { Prisma, $Enums } from "@prisma/client";
import { redirect } from "next/navigation";
import { getCurrentUserRole } from "@/actions/user-actions";
import { prisma } from "@/lib/prisma";

const UpdateListingRequest = z.object({
    listingId: z.string(),
    title: z.string().min(1, "Title is required"),
    description: z.string().min(10, "Description must be at least 10 characters"),
    price: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid price format"),
    listingStatus: z.enum(["AVAILABLE", "DRAFT"]).optional(),
    isProfessorOnly: z.boolean().optional(),
    categoryIds: z.array(z.number()).min(1, "At least one category is required"),
    imagePath: z.string().optional(),
});

export async function updateListingAction(_initialState: FormResponse, formData: FormData): Promise<FormResponse> {
    
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session?.user) {
        return {
            status: FormStatus.ERROR,
            message: {
                type: "error",
                content: "You must be logged in to update a listing."
            }
        };
    }

    const parsedFormData = UpdateListingRequest.safeParse({
        listingId: formData.get("listingId"),
        title: formData.get("title"),
        description: formData.get("description"),
        price: formData.get("price"),
        listingStatus: formData.get("listingStatus") as "AVAILABLE" | "DRAFT" | null,
        isProfessorOnly: formData.get("isProfessorOnly") === "true",
        categoryIds: JSON.parse(formData.get("categoryIds") as string || "[]"),
        imagePath: formData.get("imagePath") as string || "",
    });

    if (!parsedFormData.success) {
        return {
            status: FormStatus.ERROR,
            validationErrors: parsedFormData.error.issues,
            message: {
                type: "error",
                content: "One or more validation errors have occurred."
            }
        };
    }

    // use shared singleton
    const listingId = parsedFormData.data.listingId;

    try {
        // Verify the listing exists and belongs to the user
        const existingListing = await prisma.listing.findUnique({
            where: { id: listingId },
            select: { ownerId: true, listingStatus: true }
        });

        if (!existingListing) {
            return {
                status: FormStatus.ERROR,
                message: {
                    type: "error",
                    content: "Listing not found."
                }
            };
        }

        if (existingListing.ownerId !== session.user.id) {
            return {
                status: FormStatus.ERROR,
                message: {
                    type: "error",
                    content: "You don't have permission to update this listing."
                }
            };
        }

        // Handle image update if provided
        const imagePath = parsedFormData.data.imagePath;
        
        let imagesParsed: string[] = [];
        
        if (imagePath && imagePath !== "" && imagePath !== "[]") {
            // Parse images (could be JSON array or single string)
            try {
                const parsed = JSON.parse(imagePath);
                if (Array.isArray(parsed)) {
                    imagesParsed = parsed.filter(img => img && img !== "");
                } else if (parsed && parsed !== "") {
                    imagesParsed = [parsed];
                }
            } catch {
                if (imagePath && imagePath !== "") {
                    imagesParsed = [imagePath];
                }
            }
        }

        // Build update data
        const updateData: Prisma.ListingUpdateInput = {
            title: parsedFormData.data.title,
            description: parsedFormData.data.description,
            price: new Prisma.Decimal(parsedFormData.data.price),
            isProfessorOnly: parsedFormData.data.isProfessorOnly ?? false,
            categories: {
                set: parsedFormData.data.categoryIds.map(id => ({ id }))
            }
        };

        if (existingListing.listingStatus === $Enums.ListingStatus.ARCHIVED) {
            updateData.listingStatus = $Enums.ListingStatus.DRAFT;
        } else if (
            parsedFormData.data.listingStatus &&
            (existingListing.listingStatus === $Enums.ListingStatus.AVAILABLE ||
                existingListing.listingStatus === $Enums.ListingStatus.DRAFT)
        ) {
            if (
                existingListing.listingStatus === $Enums.ListingStatus.DRAFT &&
                parsedFormData.data.listingStatus === $Enums.ListingStatus.AVAILABLE
            ) {
                const user = await prisma.user.findUnique({
                    where: {
                        id: session.user.id,
                    },
                    select: { listingApproved: true },
                });

                if (!user?.listingApproved) {
                    return {
                        status: FormStatus.ERROR,
                        message: {
                            type: "error",
                            content: "Your first listing requires admin approval before it can be set to AVAILABLE.",
                        },
                    };
                }
            }

            updateData.listingStatus = parsedFormData.data.listingStatus;
        }

        // Prevent students from setting professor-only flag
        if (parsedFormData.data.isProfessorOnly) {
            const currentUserRole = await getCurrentUserRole();
            if (currentUserRole !== $Enums.UserRole.FACULTY) {
                return {
                    status: FormStatus.ERROR,
                    message: {
                        type: "error",
                        content: "Only faculty accounts can set a listing as professor-only."
                    }
                };
            }
        }

        // Always update images when editing (user has full control in UI)
        if (imagesParsed.length > 0) {
            updateData.images = {
                deleteMany: {},
                create: imagesParsed.map((url, index) => ({
                    url: url,
                    imageType: $Enums.ImageType.LISTING,
                    sortOrder: index
                }))
            };
        } else {
            updateData.images = {
                deleteMany: {}
            };
        }

        // Update the listing
        await prisma.listing.update({
            where: { id: listingId },
            data: updateData
        });

    } catch (error) {
        console.error("Error updating listing:", error);
        
        // Check if it's a payload size error
        if (error instanceof Error && error.message.includes('payload')) {
            return {
                status: FormStatus.ERROR,
                message: {
                    type: "error",
                    content: "The images are too large. Please use smaller images or fewer images."
                }
            };
        }
        
        return {
            status: FormStatus.ERROR,
            message: {
                type: "error",
                content: `Failed to update listing: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
        };
    }

    // Redirect to the listing page after successful update
    redirect(`/market/listing/${listingId}?updated=true`);
}
