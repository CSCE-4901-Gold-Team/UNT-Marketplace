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
import { revalidatePath } from "next/cache";
import { MessageProfanityFlagStatus } from "@prisma/client";
import { imageStorage } from "@/lib/image-storage-adapter";

const UpdateListingRequest = z.object({
    listingId: z.string(),
    title: z.string().min(1, "Title is required"),
    description: z.string().min(10, "Description must be at least 10 characters"),
    price: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid price format"),
    listingStatus: z.enum(["AVAILABLE", "DRAFT"]).optional(),
    isProfessorOnly: z.boolean().optional(),
    categoryIds: z.array(z.number()).min(1, "At least one category is required"),
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

    const listingId = parsedFormData.data.listingId;

    try {
        const existingListing = await prisma.listing.findUnique({
            where: { id: listingId },
            select: { ownerId: true, listingStatus: true, images: { select: { url: true } } }
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

        // Parse staged image changes from form
        const newImagesBase64Raw = formData.get("newImagesBase64") as string;
        const existingImageUrlsRaw = formData.get("existingImageUrls") as string;
        const removedImageUrlsRaw = formData.get("removedImageUrls") as string;

        let newImagesBase64: string[] = [];
        if (newImagesBase64Raw) {
            try {
                newImagesBase64 = JSON.parse(newImagesBase64Raw);
                if (!Array.isArray(newImagesBase64)) newImagesBase64 = [];
            } catch { /* ignore */ }
        }

        let existingImageUrls: string[] = [];
        if (existingImageUrlsRaw) {
            try {
                existingImageUrls = JSON.parse(existingImageUrlsRaw);
                if (!Array.isArray(existingImageUrls)) existingImageUrls = [];
            } catch { /* ignore */ }
        }

        let removedImageUrls: string[] = [];
        if (removedImageUrlsRaw) {
            try {
                removedImageUrls = JSON.parse(removedImageUrlsRaw);
                if (!Array.isArray(removedImageUrls)) removedImageUrls = [];
            } catch { /* ignore */ }
        }

        // Save base64 images to filesystem (staged → persisted on save)
        const savedNewUrls: string[] = [];
        for (const base64 of newImagesBase64) {
            if (!base64 || typeof base64 !== "string") continue;
            const match = base64.match(/^data:image\/([^;]+);base64,(.+)$/);
            if (!match) continue;

            const ext = `.${match[1].split("/")[1] || "jpg"}`;
            const buffer = Buffer.from(match[2], "base64");
            const result = await imageStorage.save(buffer, "listings", ext);
            savedNewUrls.push(result.url);
        }

        // Combine: newly saved + existing kept URLs
        const allImageUrls = [...savedNewUrls, ...existingImageUrls];

        const rawTitle = parsedFormData.data.title.trim();
        const rawDescription = parsedFormData.data.description.trim();
        const titleC = censorProfanity(rawTitle);
        const descC = censorProfanity(rawDescription);
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
                    where: { id: session.user.id },
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
                        content: "Only faculty accounts can set a listing as professor-only."
                    }
                };
            }
        }

        // Update images in DB
        updateData.images = {
            deleteMany: {},
            create: allImageUrls.map((url, index) => ({
                url,
                imageType: $Enums.ImageType.LISTING,
                sortOrder: index,
            })),
        };

        await prisma.$transaction(async (tx) => {
            await tx.listing.update({
                where: { id: listingId },
                data: updateData,
            });
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

        if (wasCensored) {
            revalidatePath("/admin");
        }

        // Delete image files that were removed by the user
        if (removedImageUrls.length > 0) {
            await imageStorage.deleteMany("listings", removedImageUrls);
        }

    } catch (error) {
        console.error("Error updating listing:", error);

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

    redirect(`/market/listing/${listingId}?updated=true`);
}
