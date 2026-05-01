"use server";

import { FormResponse } from "@/types/FormResponse";
import * as z from "zod";
import { FormStatus } from "@/constants/FormStatus";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { $Enums } from "@prisma/client";
import { redirect } from "next/navigation";
import { enforceUserStatus } from "@/utils/StatusEnforcer";
import { getCurrentUserRole } from "@/actions/user-actions";
import { prisma } from "@/lib/prisma";
import { imageAdapter } from "@/lib/image-adapter";
import { censorProfanity } from "@/lib/profanity-filter";
import { getProfanityModerationTermLists } from "@/lib/profanity-moderation-db";
import { revalidatePath } from "next/cache";

const CreateListingRequest = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().min(10, "Description must be at least 10 characters"),
    price: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid price format"),
    isProfessorOnly: z.boolean().optional(),
    categoryIds: z.array(z.number()).min(1, "At least one category is required"),
    imagePath: z.string().optional(),
});

export async function createListingAction(_initialState: FormResponse, formData: FormData): Promise<FormResponse> {

    const session = await auth.api.getSession({
        headers: await headers()
    });

    const currentUserRole = await getCurrentUserRole();

    if (!session?.user) {
        return {
            status: FormStatus.ERROR,
            message: {
                type: "error",
                content: "You must be logged in to create a listing."
            }
        };
    }

    // Enforce user status - check if suspended or banned
    try {
        await enforceUserStatus(session.user.id);
    } catch (error) {
        return {
            status: FormStatus.ERROR,
            message: {
                type: "error",
                content: error instanceof Error ? error.message : "Your account is restricted and cannot create listings."
            }
        };
    }

    const parsedFormData = CreateListingRequest.safeParse({
        title: formData.get("title"),
        description: formData.get("description"),
        price: formData.get("price"),
        isProfessorOnly: formData.get("isProfessorOnly") === "true",
        categoryIds: JSON.parse(formData.get("categoryIds") as string || "[]"),
        imagePath: formData.get("imagePath") as string || "",
    });

    if (!parsedFormData.success) {
        console.log("Validation errors:", parsedFormData.error.issues);
        return {
            status: FormStatus.ERROR,
            validationErrors: parsedFormData.error.issues,
            message: {
                type: "error",
                content: "One or more validation errors have occurred."
            }
        };
    }

    if (parsedFormData.data.isProfessorOnly) {
        if (currentUserRole !== $Enums.UserRole.FACULTY) {
            return {
                status: FormStatus.ERROR
            };
        }
    }

    let newListingId: string;
    let requiresAdminApproval = false;
    let pendingReason: "profanity" | "first_listing" | "both" | null = null;

    try {
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { listingApproved: true },
        });

        if (!user) {
            return {
                status: FormStatus.ERROR,
                message: {
                    type: "error",
                    content: "User not found.",
                },
            };
        }

        requiresAdminApproval = currentUserRole !== $Enums.UserRole.ADMIN && !user.listingApproved;

        const pendingListing = await prisma.listing.findFirst({
            where: {
                ownerId: session.user.id,
                listingStatus: {
                    in: ["DRAFT", "ARCHIVED"]
                }
            },
            select: {
                id: true,
            },
        });

        if (requiresAdminApproval && pendingListing) {
            return {
                status: FormStatus.ERROR,
                message: {
                    type: "error",
                    content: "You already have a listing that is either pending review or archived. Please wait until it is approved or update/delete it if denied.",
                },
            };
        }

        // Use the image path directly (base64 or file path)
        const imagePath = parsedFormData.data.imagePath || null;
        let imagesParsed: string[] = [];

        // Parse images (could be JSON array or single string)
        if (imagePath) {
            try {
                imagesParsed = JSON.parse(imagePath);
                if (!Array.isArray(imagesParsed)) {
                    imagesParsed = [imagePath];
                }
            } catch {
                imagesParsed = [imagePath];
            }
        }

        // Filter to base64 strings only (new uploads)
        const newBase64s = imagesParsed.filter(
            (s): s is string => typeof s === "string" && s.startsWith("data:"),
        );

        // Save new files to disk BEFORE transaction (sharp compression)
        const newPaths = await Promise.all(
            newBase64s.map((b64) => imageAdapter.saveFromBase64(b64, { type: "listing" })),
        );

        // Censored title/description; DRAFT if profanity or user requires approval; optional profanity flag row.
        const rawTitle = parsedFormData.data.title.trim();
        const rawDescription = parsedFormData.data.description.trim();
        const { whitelist, blacklist } = await getProfanityModerationTermLists();
        const titleC = censorProfanity(rawTitle, { whitelist, blacklist });
        const descC = censorProfanity(rawDescription, { whitelist, blacklist });
        const wasCensored = titleC.wasCensored || descC.wasCensored;

        const listingStatus =
            wasCensored || !user.listingApproved ? "DRAFT" : "AVAILABLE";
        if (listingStatus === "DRAFT") {
            if (wasCensored && !user.listingApproved) pendingReason = "both";
            else if (wasCensored) pendingReason = "profanity";
            else pendingReason = "first_listing";
        }

        try {
            const newListing = await prisma.$transaction(async (tx) => {
                const listing = await tx.listing.create({
                    data: {
                        title: titleC.censored,
                        description: descC.censored,
                        price: parseFloat(parsedFormData.data.price),
                        isProfessorOnly: parsedFormData.data.isProfessorOnly ?? false,
                        listingStatus,
                        ownerId: session.user.id,
                        categories: {
                            connect: parsedFormData.data.categoryIds.map((id) => ({ id })),
                        },
                    },
                });

                // Create Image records with file paths
                if (newPaths.length > 0) {
                    await tx.image.createMany({
                        data: newPaths.map((url, index) => ({
                            url,
                            listingId: listing.id,
                            imageType: "LISTING",
                            sortOrder: index,
                        })),
                    });
                }

                if (wasCensored) {
                    await tx.listingProfanityFlag.create({
                        data: {
                            listingId: listing.id,
                            ownerId: session.user.id,
                            originalTitle: rawTitle,
                            originalDescription: rawDescription,
                        },
                    });
                }
                return listing;
            });

            if (wasCensored) {
                revalidatePath("/admin");
            }

            newListingId = newListing.id;
        } catch (error) {
            // Transaction failed — clean up orphaned files
            if (newPaths.length > 0) {
                await imageAdapter.deleteListingFiles(newPaths);
            }
            throw error;
        }
    } catch (error) {
        console.error("Error creating listing:", error);
        return {
            status: FormStatus.ERROR,
            message: {
                type: "error",
                content: `Failed to create listing: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
        };
    }

    // Redirect after successful creation (outside try-catch)
    const pendingReasonParam = pendingReason ? `&pendingReason=${pendingReason}` : "";
    redirect(`/market/listing/${newListingId}?created=true${requiresAdminApproval ? "&requiresApproval=true" : ""}${pendingReasonParam}`);
}
