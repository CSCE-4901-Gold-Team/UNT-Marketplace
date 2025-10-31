"use server";

import {FormResponse} from "@/types/FormResponse";
import * as z from "zod";
import {FormStatus} from "@/constants/FormStatus";
import {db} from "@/lib/db";
import {auth} from "@/lib/auth";
import {headers} from "next/headers";

const CreateListingRequest = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().min(10, "Description must be at least 10 characters"),
    price: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid price format"),
    isProfessorOnly: z.boolean().optional(),
    categoryIds: z.array(z.number()).min(1, "At least one category required"),
});

export async function createListingAction(initialState: FormResponse, formData: FormData): Promise<FormResponse> {
    
    // Get the current user session
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

    // Parse and validate form data
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

    // Create the listing in the database
    try {
        await db.listing.create({
            data: {
                title: parsedFormData.data.title,
                description: parsedFormData.data.description,
                price: parsedFormData.data.price,
                isProfessorOnly: parsedFormData.data.isProfessorOnly ?? false,
                ownerId: session.user.id,
                categories: {
                    connect: parsedFormData.data.categoryIds.map(id => ({ id }))
                }
            }
        });
    } catch (error) {
        return {
            status: FormStatus.ERROR,
            message: {
                type: "error",
                content: "Failed to create listing."
            }
        };
    }

    return {
        status: FormStatus.SUCCESS
    };
}