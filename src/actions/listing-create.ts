"use server";

import {FormResponse} from "@/types/FormResponse";
import * as z from "zod";
import {FormStatus} from "@/constants/FormStatus"; 
import {auth} from "@/lib/auth";
import {headers} from "next/headers";
import {PrismaClient} from "../../generated/prisma";
import {redirect} from "next/navigation";

const CreateListingRequest = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().min(10, "Description must be at least 10 characters"),
    price: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid price format"),
    isProfessorOnly: z.boolean().optional(),
    categoryIds: z.array(z.number()).optional(),
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

    const parsedFormData = CreateListingRequest.safeParse({
        title: formData.get("title"),
        description: formData.get("description"),
        price: formData.get("price"),
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

    const prisma = new PrismaClient();
    let newListingId: string;

    try {
        // Create the listing
        const newListing = await prisma.listing.create({
            data: {
                title: parsedFormData.data.title,
                description: parsedFormData.data.description,
                price: parsedFormData.data.price,
                isProfessorOnly: parsedFormData.data.isProfessorOnly ?? false,
                ownerId: session.user.id,
                ...(parsedFormData.data.categoryIds && parsedFormData.data.categoryIds.length > 0 && {
                    categories: {
                        connect: parsedFormData.data.categoryIds.map(id => ({ id }))
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