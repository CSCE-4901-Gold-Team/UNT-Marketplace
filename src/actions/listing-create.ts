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
import { censorProfanity } from "@/lib/profanity-filter";
import { revalidatePath } from "next/cache";
import { imageStorage } from "@/lib/image-storage-adapter";

const CreateListingRequest = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().min(10, "Description must be at least 10 characters"),
    price: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid price format"),
    isProfessorOnly: z.boolean().optional(),
    categoryIds: z.array(z.number()).min(1, "At least one category is required"),
});

export async function createListingAction(_initialState: FormResponse, formData: FormData): Promise<FormResponse> {

    const session = await auth.api.getSession({
        headers: await headers()
    });

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
    });

    console.log("Parsed form data:", parsedFormData);

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
        const currentUserRole = await getCurrentUserRole();
        if (currentUserRole !== $Enums.UserRole.FACULTY) {
            return {
                status: FormStatus.ERROR
            };
        }
    }

    let newListingId: string;
    let requiresAdminApproval = false;

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

        requiresAdminApproval = !user.listingApproved;

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

        if (!user.listingApproved && pendingListing) {
            return {
                status: FormStatus.ERROR,
                message: {
                    type: "error",
                    content: "You already have a listing that is either pending review or archived. Please wait until it is approved or update/delete it if denied.",
                },
            };
        }

       // Parse new images: base64 strings to save, and existing server URLs
        let imageUrls: string[] = [];

        const newImagesBase64Raw = formData.get("newImagesBase64") as string;
        const existingImageUrlsRaw = formData.get("existingImageUrls") as string;

        let newImagesBase64: string[] = [];
        if (newImagesBase64Raw) {
            try {
                newImagesBase64 = JSON.parse(newImagesBase64Raw);
                if (!Array.isArray(newImagesBase64)) newImagesBase64 = [];
            } catch { /* ignore parse errors */ }
        }

        let existingImageUrls: string[] = [];
        if (existingImageUrlsRaw) {
            try {
                existingImageUrls = JSON.parse(existingImageUrlsRaw);
                if (!Array.isArray(existingImageUrls)) existingImageUrls = [];
            } catch { /* ignore parse errors */ }
        }

      // Save base64 images to filesystem (persisted on save)
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

        imageUrls = [...savedNewUrls, ...existingImageUrls];

        const rawTitle = parsedFormData.data.title.trim();
        const rawDescription = parsedFormData.data.description.trim();
        const titleC = censorProfanity(rawTitle);
        const descC = censorProfanity(rawDescription);
        const wasCensored = titleC.wasCensored || descC.wasCensored;

        const listingStatus =
            wasCensored || !user.listingApproved ? "DRAFT" : "AVAILABLE";

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
                        ...(imageUrls.length > 0 && {
                            images: {
                                create: imageUrls.map((url, index) => ({
                                    url: url,
                                    imageType: "LISTING",
                                    sortOrder: index,
                                })),
                            },
                        }),
                    },
                });
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
        } catch (dbError) {
            // Clean up orphaned image files if DB save failed
            if (savedNewUrls.length > 0) {
                await imageStorage.deleteMany("listings", savedNewUrls);
            }
            throw dbError;
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
    redirect(`/market/listing/${newListingId}?created=true${requiresAdminApproval ? "&requiresApproval=true" : ""}`);
}
