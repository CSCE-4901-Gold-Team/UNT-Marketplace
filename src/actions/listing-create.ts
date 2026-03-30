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

        // Create the listing
        const newListing = await prisma.listing.create({
            data: {
                title: parsedFormData.data.title,
                description: parsedFormData.data.description,
                price: parseFloat(parsedFormData.data.price),
                isProfessorOnly: parsedFormData.data.isProfessorOnly ?? false,
                listingStatus: user.listingApproved ? "AVAILABLE" : "DRAFT",
                ownerId: session.user.id,
                categories: {
                    connect: parsedFormData.data.categoryIds.map(id => ({ id }))
                },
                ...(imagesParsed.length > 0 && {
                    images: {
                        create: imagesParsed.map((url, index) => ({
                            url: url,
                            imageType: "LISTING",
                            sortOrder: index
                        }))
                    }
                })
            }
        });

        newListingId = newListing.id;
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
