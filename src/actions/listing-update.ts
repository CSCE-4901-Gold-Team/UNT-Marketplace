"use server";

import {FormResponse} from "@/types/FormResponse";
import * as z from "zod";
import {FormStatus} from "@/constants/FormStatus";
import {auth} from "@/lib/auth";
import {headers} from "next/headers";
import {PrismaClient, Prisma} from "@/generated/prisma";
import {redirect} from "next/navigation";

const UpdateListingRequest = z.object({
    listingId: z.string(),
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

export async function updateListingAction(_initialState: FormResponse, formData: FormData): Promise<FormResponse> {
    console.log("Update listing action called");
    
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

    console.log("FormData entries:", {
        listingId: formData.get("listingId"),
        title: formData.get("title"),
        description: formData.get("description"),
        price: formData.get("price"),
        isProfessorOnly: formData.get("isProfessorOnly"),
        categoryIds: formData.get("categoryIds"),
        newCategoryNames: formData.get("newCategoryNames"),
        imagePath: formData.get("imagePath"),
    });

    const parsedFormData = UpdateListingRequest.safeParse({
        listingId: formData.get("listingId"),
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
    const listingId = parsedFormData.data.listingId;

    try {
        // Verify the listing exists and belongs to the user
        const existingListing = await prisma.listing.findUnique({
            where: { id: listingId },
            select: { ownerId: true }
        });

        if (!existingListing) {
            await prisma.$disconnect();
            return {
                status: FormStatus.ERROR,
                message: {
                    type: "error",
                    content: "Listing not found."
                }
            };
        }

        if (existingListing.ownerId !== session.user.id) {
            await prisma.$disconnect();
            return {
                status: FormStatus.ERROR,
                message: {
                    type: "error",
                    content: "You don't have permission to update this listing."
                }
            };
        }

        // Create any new categories
        const newCategoryIds: number[] = [];
        if (parsedFormData.data.newCategoryNames && parsedFormData.data.newCategoryNames.length > 0) {
            for (const categoryName of parsedFormData.data.newCategoryNames) {
                const slug = categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                
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

        // Handle image update if provided
        const imagePath = parsedFormData.data.imagePath;
        console.log("Image path from form:", imagePath);
        
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
            console.log("Parsed images:", imagesParsed);
        }

        // Build update data
        const updateData: any = {
            title: parsedFormData.data.title,
            description: parsedFormData.data.description,
            price: new Prisma.Decimal(parsedFormData.data.price),
            isProfessorOnly: parsedFormData.data.isProfessorOnly ?? false,
            categories: {
                set: allCategoryIds.map(id => ({ id }))
            }
        };

        // Always update images when editing (user has full control in UI)
        if (imagesParsed.length > 0) {
            console.log("Updating images");
            updateData.images = {
                deleteMany: {},
                create: imagesParsed.map((url, index) => ({
                    url: url,
                    imageType: "LISTING" as const,
                    sortOrder: index
                }))
            };
        } else {
            console.log("No images provided - will remove all existing images");
            updateData.images = {
                deleteMany: {}
            };
        }

        // Update the listing
        await prisma.listing.update({
            where: { id: listingId },
            data: updateData
        });

        console.log("Listing updated successfully");

        await prisma.$disconnect();
    } catch (error) {
        await prisma.$disconnect();
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
    redirect(`/market/listing/${listingId}`);
}
