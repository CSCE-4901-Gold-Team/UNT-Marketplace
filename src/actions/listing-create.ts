"use server";

import { FormResponse } from "@/types/FormResponse";
import * as z from "zod";
import { FormStatus } from "@/constants/FormStatus";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { PrismaClient, Prisma } from "@prisma/client";
import { redirect } from "next/navigation";

const CreateListingRequest = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().min(10, "Description must be at least 10 characters"),
    price: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid price format"),
    isProfessorOnly: z.boolean().optional(),
    categoryIds: z.array(z.number()).optional(),
    newCategoryNames: z.array(z.string()).optional(),
    imagePath: z.string().optional(),
}).refine(
    (data) => (data.categoryIds && data.categoryIds.length > 0) || (data.newCategoryNames && data.newCategoryNames.length > 0),
    { message: "At least one category is required", path: ["categoryIds"] }
);

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

    const parsedFormData = CreateListingRequest.safeParse({
        title: formData.get("title"),
        description: formData.get("description"),
        price: formData.get("price"),
        isProfessorOnly: formData.get("isProfessorOnly") === "true",
        categoryIds: JSON.parse(formData.get("categoryIds") as string || "[]"),
        newCategoryNames: JSON.parse(formData.get("newCategoryNames") as string || "[]"),
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

    const prisma = new PrismaClient();
    let newListingId: string;

    try {
        // Check if this is the user's first listing
        const existingListingsCount = await prisma.listing.count({
            where: { ownerId: session.user.id }
        });
        const isFirstListing = existingListingsCount === 0;

        // First, create any new categories if provided (or find existing ones)
        const newCategoryIds: number[] = [];
        if (parsedFormData.data.newCategoryNames && parsedFormData.data.newCategoryNames.length > 0) {
            for (const categoryName of parsedFormData.data.newCategoryNames) {
                // Create a slug from the category name
                const slug = categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

                // Check if category already exists, if not create it
                let category = await prisma.category.findUnique({
                    where: { name: categoryName }
                });

                if (!category) {
                    category = await prisma.category.create({
                        data: {
                            name: categoryName,
                            slug: slug
                        }
                    });
                }

                newCategoryIds.push(category.id);
            }
        }

        // Combine existing category IDs with newly created ones
        const allCategoryIds = [
            ...(parsedFormData.data.categoryIds || []),
            ...newCategoryIds
        ];

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
                listingStatus: isFirstListing ? "DRAFT" : "AVAILABLE",
                ownerId: session.user.id,
                categories: {
                    connect: allCategoryIds.map(id => ({ id }))
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
        await prisma.$disconnect();
    } catch (error) {
        await prisma.$disconnect();
        console.error("Error creating listing:", error);
        return {
            status: FormStatus.ERROR,
            message: {
                type: "error",
                content: `Failed to create listing: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
        };
    }

    // Redirect after successfully creating and disconnecting (outside try-catch)
    redirect(`/market/listing/${newListingId}`);
}
