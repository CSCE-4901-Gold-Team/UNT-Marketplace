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
import { censorProfanity } from "@/lib/profanity-filter";
import { imageAdapter } from "@/lib/image-adapter";
import { getProfanityModerationTermLists } from "@/lib/profanity-moderation-db";
import { revalidatePath } from "next/cache";
import { MessageProfanityFlagStatus } from "@prisma/client";

const UpdateListingRequest = z.object({
    listingId: z.string(),
    title: z.string().min(1, "Title is required"),
    description: z.string().min(10, "Description must be at least 10 characters"),
    price: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid price format"),
    listingStatus: z.enum(["AVAILABLE", "DRAFT"]).optional(),
    isProfessorOnly: z.boolean().optional(),
    categoryIds: z.array(z.number()).min(1, "At least one category is required"),
    imagePath: z.string().optional(),
    removedImageUrls: z.string().optional(),
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
        removedImageUrls: formData.get("removedImageUrls") as string || "[]",
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

        // Parse submitted images
        const submittedRaw = parsedFormData.data.imagePath || "[]";
        let allSubmitted: string[] = [];
        if (submittedRaw && submittedRaw !== "" && submittedRaw !== "[]") {
            try {
                const parsed = JSON.parse(submittedRaw);
                if (Array.isArray(parsed)) {
                    allSubmitted = parsed.filter((img: unknown) => typeof img === "string" && img !== "");
                } else if (parsed && typeof parsed === "string" && parsed !== "") {
                    allSubmitted = [parsed];
                }
            } catch {
                if (submittedRaw && submittedRaw !== "") {
                    allSubmitted = [submittedRaw];
                }
            }
        }

        // Parse removed image URLs
        const removedRaw = parsedFormData.data.removedImageUrls || "[]";
        let removedUrls: string[] = [];
        try {
            const parsed = JSON.parse(removedRaw);
            if (Array.isArray(parsed)) {
                removedUrls = parsed.filter((u: unknown) => typeof u === "string" && u !== "");
            }
        } catch {
            // ignore parse errors
        }

        // Separate new uploads (base64) from kept existing images (file paths)
        const newBase64s = allSubmitted.filter(
            (s) => typeof s === "string" && s.startsWith("data:"),
        );

        // Save new files to disk BEFORE transaction (sharp compression)
        const newPaths = await Promise.all(
            newBase64s.map((b64) => imageAdapter.saveFromBase64(b64, { type: "listing" })),
        );

        const rawTitle = parsedFormData.data.title.trim();
        const rawDescription = parsedFormData.data.description.trim();
        const { whitelist, blacklist } = await getProfanityModerationTermLists();
        const titleC = censorProfanity(rawTitle, { whitelist, blacklist });
        const descC = censorProfanity(rawDescription, { whitelist, blacklist });
        const wasCensored = titleC.wasCensored || descC.wasCensored;

        const updateData: Prisma.ListingUpdateInput = {
            title: titleC.censored,
            description: descC.censored,
            price: new Prisma.Decimal(parsedFormData.data.price),
            isProfessorOnly: parsedFormData.data.isProfessorOnly ?? false,
            categories: {
                set: parsedFormData.data.categoryIds.map((id) => ({ id })),
            },
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
                    select: { listingApproved: true, role: true },
                });

                const isAdmin = user?.role === "ADMIN";
                if (!isAdmin && !user?.listingApproved) {
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

        if (wasCensored) {
            updateData.listingStatus = $Enums.ListingStatus.DRAFT;
        }

        // Prevent students from setting professor-only flag
        if (parsedFormData.data.isProfessorOnly) {
            const currentUserRole = await getCurrentUserRole();
            if (currentUserRole !== $Enums.UserRole.FACULTY) {
                return {
                    status: FormStatus.ERROR,
                    message: {
                        type: "error",
                        content: "Only faculty accounts can set a listing as professor-only.",
                    },
                };
            }
        }

        try {
            await prisma.$transaction(async (tx) => {
                // Update listing fields
                await tx.listing.update({
                    where: { id: listingId },
                    data: updateData,
                });

                // Delete ONLY removed image records (not all images)
                if (removedUrls.length > 0) {
                    await tx.image.deleteMany({
                        where: { listingId, url: { in: removedUrls } },
                    });
                }

                // Create records ONLY for new images
                if (newPaths.length > 0) {
                    const remaining = await tx.image.findMany({
                        where: { listingId, url: { notIn: removedUrls } },
                        orderBy: { sortOrder: "asc" },
                    });
                    await tx.image.createMany({
                        data: newPaths.map((url, i) => ({
                            url,
                            listingId,
                            imageType: $Enums.ImageType.LISTING,
                            sortOrder: remaining.length + i,
                        })),
                    });
                }

                if (wasCensored) {
                    const pending = await tx.listingProfanityFlag.findFirst({
                        where: {
                            listingId,
                            status: MessageProfanityFlagStatus.PENDING,
                        },
                    });
                    if (pending) {
                        await tx.listingProfanityFlag.update({
                            where: { id: pending.id },
                            data: {
                                originalTitle: rawTitle,
                                originalDescription: rawDescription,
                            },
                        });
                    } else {
                        await tx.listingProfanityFlag.create({
                            data: {
                                listingId,
                                ownerId: session.user.id,
                                originalTitle: rawTitle,
                                originalDescription: rawDescription,
                            },
                        });
                    }
                }
            });

            // Transaction succeeded — clean up removed files from disk
            if (removedUrls.length > 0) {
                await imageAdapter.deleteListingFiles(removedUrls);
            }
        } catch (txError) {
            // Transaction failed — clean up newly written files
            if (newPaths.length > 0) {
                await imageAdapter.deleteListingFiles(newPaths);
            }
            throw txError;
        }

        if (wasCensored) {
            revalidatePath("/admin");
        }

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
