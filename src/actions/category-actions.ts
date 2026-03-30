"use server";

import * as z from "zod";
import { $Enums } from "@prisma/client";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { FormStatus } from "@/constants/FormStatus";
import type { FormResponse } from "@/types/FormResponse";
import { getCurrentUserRole } from "@/actions/user-actions";

import UserRole = $Enums.UserRole;

const CATEGORY_NAME_MIN_LENGTH = 3;
const CATEGORY_NAME_MAX_LENGTH = 60;

const CategoryNameValidator = z.string()
    .trim()
    .min(CATEGORY_NAME_MIN_LENGTH, `Category name must be at least ${CATEGORY_NAME_MIN_LENGTH} characters.`)
    .max(CATEGORY_NAME_MAX_LENGTH, `Category name cannot exceed ${CATEGORY_NAME_MAX_LENGTH} characters.`);

const CreateCategoryRequest = z.object({
    name: CategoryNameValidator
});

const UpdateCategoryRequest = z.object({
    categoryId: z.coerce.number().int().positive("Invalid category id."),
    name: CategoryNameValidator
});

const CategoryIdRequest = z.coerce.number().int().positive("Invalid category id.");

function normalizeCategoryName(name: string): string {
    return name.trim().replace(/\s+/g, " ");
}

function createCategorySlug(name: string): string {
    return normalizeCategoryName(name)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
}

async function requireAdminSession() {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        redirect("/sign-in");
    }

    const currentUserRole = await getCurrentUserRole();
    if (!currentUserRole || currentUserRole !== UserRole.ADMIN) {
        throw new Error("Unauthorized");
    }

    return session;
}

async function findCategoryConflict(name: string, slug: string, excludeCategoryId?: number) {
    return await prisma.category.findFirst({
        where: {
            ...(typeof excludeCategoryId === "number" ? { id: { not: excludeCategoryId } } : {}),
            OR: [
                {
                    name: {
                        equals: name,
                        mode: "insensitive"
                    }
                },
                { slug: slug }
            ]
        },
        select: {
            id: true,
            name: true,
            slug: true
        }
    });
}

export async function getCategories(take: number = 50, skip: number = 0) {
    const categories = await prisma.category.findMany({
        take: take,
        skip: skip,
        orderBy: {
            name: "asc"
        },
        include: {
            _count: {
                select: {
                    listings: true
                }
            }
        }
    });

    return categories.map((category) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        listingCount: category._count.listings
    }));
}

export async function getCategoriesCount() {
    return await prisma.category.count();
}

export async function getCategoryById(categoryId: number) {
    const parsedCategoryId = CategoryIdRequest.safeParse(categoryId);
    if (!parsedCategoryId.success) {
        return null;
    }

    const category = await prisma.category.findUnique({
        where: {
            id: parsedCategoryId.data
        },
        include: {
            _count: {
                select: {
                    listings: true
                }
            }
        }
    });

    if (!category) {
        return null;
    }

    return {
        id: category.id,
        name: category.name,
        slug: category.slug,
        listingCount: category._count.listings
    };
}

export async function createCategoryAction(_initialState: FormResponse, formData: FormData): Promise<FormResponse> {
    await requireAdminSession();
    
    const parsedFormData = CreateCategoryRequest.safeParse({
        name: formData.get("name")
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

    const normalizedCategoryName = normalizeCategoryName(parsedFormData.data.name);
    const slug = createCategorySlug(normalizedCategoryName);

    if (!slug) {
        return {
            status: FormStatus.ERROR,
            message: {
                type: "error",
                content: "Category name must contain letters or numbers."
            }
        };
    }

    const existingCategory = await findCategoryConflict(normalizedCategoryName, slug);
    if (existingCategory) {
        return {
            status: FormStatus.ERROR,
            message: {
                type: "error",
                content: "A category with this name already exists."
            }
        };
    }

    try {
        await prisma.category.create({
            data: {
                name: normalizedCategoryName,
                slug: slug
            }
        });
    } catch (error) {
        console.error("Error creating category:", error);
        return {
            status: FormStatus.ERROR,
            message: {
                type: "error",
                content: `Failed to create category: ${error instanceof Error ? error.message : "Unknown error"}`
            }
        };
    }

    return {
        status: FormStatus.SUCCESS,
        message: {
            type: "success",
            content: "Category created successfully."
        }
    };
}

export async function updateCategoryAction(_initialState: FormResponse, formData: FormData): Promise<FormResponse> {
    await requireAdminSession();
    
    const parsedFormData = UpdateCategoryRequest.safeParse({
        categoryId: formData.get("categoryId"),
        name: formData.get("name")
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

    const normalizedCategoryName = normalizeCategoryName(parsedFormData.data.name);
    const slug = createCategorySlug(normalizedCategoryName);

    if (!slug) {
        return {
            status: FormStatus.ERROR,
            message: {
                type: "error",
                content: "Category name must contain letters or numbers."
            }
        };
    }

    const existingCategory = await prisma.category.findUnique({
        where: {
            id: parsedFormData.data.categoryId
        },
        select: {
            id: true
        }
    });

    if (!existingCategory) {
        return {
            status: FormStatus.ERROR,
            message: {
                type: "error",
                content: "Category not found."
            }
        };
    }

    const conflictingCategory = await findCategoryConflict(normalizedCategoryName, slug, parsedFormData.data.categoryId);
    if (conflictingCategory) {
        return {
            status: FormStatus.ERROR,
            message: {
                type: "error",
                content: "A category with this name already exists."
            }
        };
    }

    try {
        await prisma.category.update({
            where: {
                id: parsedFormData.data.categoryId
            },
            data: {
                name: normalizedCategoryName,
                slug: slug
            }
        });
    } catch (error) {
        console.error("Error updating category:", error);
        return {
            status: FormStatus.ERROR,
            message: {
                type: "error",
                content: `Failed to update category: ${error instanceof Error ? error.message : "Unknown error"}`
            }
        };
    }

    return {
        status: FormStatus.SUCCESS,
        message: {
            type: "success",
            content: "Category updated successfully."
        }
    };
}

export async function deleteCategoryAction(categoryId: number): Promise<FormResponse> {
    await requireAdminSession();
    
    const parsedCategoryId = CategoryIdRequest.safeParse(categoryId);

    if (!parsedCategoryId.success) {
        return {
            status: FormStatus.ERROR,
            validationErrors: parsedCategoryId.error.issues,
            message: {
                type: "error",
                content: "One or more validation errors have occurred."
            }
        };
    }

    const existingCategory = await prisma.category.findUnique({
        where: {
            id: parsedCategoryId.data
        },
        select: {
            id: true
        }
    });

    if (!existingCategory) {
        return {
            status: FormStatus.ERROR,
            message: {
                type: "error",
                content: "Category not found."
            }
        };
    }

    try {
        await prisma.category.delete({
            where: {
                id: parsedCategoryId.data
            }
        });
    } catch (error) {
        console.error("Error deleting category:", error);
        return {
            status: FormStatus.ERROR,
            message: {
                type: "error",
                content: `Failed to delete category: ${error instanceof Error ? error.message : "Unknown error"}`
            }
        };
    }

    return {
        status: FormStatus.SUCCESS,
        message: {
            type: "success",
            content: "Category deleted successfully."
        }
    };
}
