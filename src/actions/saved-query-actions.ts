"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

/**
 * Server action to create a saved query
 */
export async function createSavedQuery(data: {
    name: string;
    searchTerm?: string;
    minPrice?: string;
    maxPrice?: string;
    categoryIds?: number[];
}) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session || !session.user) {
            return { success: false, error: "Not authenticated" };
        }

        const userObj = session.user as unknown as { id?: string };
        const sessionObj = session as unknown as { userId?: string };
        const userId = userObj.id ?? sessionObj.userId;

        if (!userId) {
            return { success: false, error: "User ID not found" };
        }

        const savedQuery = await prisma.savedQuery.create({
            data: {
                userId,
                name: data.name.trim(),
                searchTerm: data.searchTerm ? data.searchTerm.trim() : null,
                minPrice: data.minPrice ? parseFloat(data.minPrice) : null,
                maxPrice: data.maxPrice ? parseFloat(data.maxPrice) : null,
                categories: {
                    create: (data.categoryIds || []).map((categoryId) => ({
                        categoryId,
                    })),
                },
            },
            include: {
                categories: {
                    include: {
                        category: {
                            select: { id: true, name: true, slug: true },
                        },
                    },
                },
            },
        });

        return {
            success: true,
            query: {
                id: savedQuery.id,
                name: savedQuery.name,
                searchTerm: savedQuery.searchTerm,
                minPrice: savedQuery.minPrice?.toString(),
                maxPrice: savedQuery.maxPrice?.toString(),
                categories: savedQuery.categories.map((cat) => ({
                    id: cat.category.id,
                    name: cat.category.name,
                    slug: cat.category.slug,
                })),
                enabled: savedQuery.enabled,
                createdAt: savedQuery.createdAt,
            },
        };
    } catch (error) {
        console.error("Error creating saved query:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}

/**
 * Server action to retrieve all saved queries for the user
 */
export async function getSavedQueries() {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session || !session.user) {
            return { success: false, error: "Not authenticated" };
        }

        const userObj = session.user as unknown as { id?: string };
        const sessionObj = session as unknown as { userId?: string };
        const userId = userObj.id ?? sessionObj.userId;

        if (!userId) {
            return { success: false, error: "User ID not found" };
        }

        const queries = await prisma.savedQuery.findMany({
            where: { userId },
            include: {
                categories: {
                    include: {
                        category: {
                            select: { id: true, name: true, slug: true },
                        },
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        return {
            success: true,
            queries: queries.map((q) => ({
                id: q.id,
                name: q.name,
                searchTerm: q.searchTerm,
                minPrice: q.minPrice?.toString(),
                maxPrice: q.maxPrice?.toString(),
                categories: q.categories.map((cat) => ({
                    id: cat.category.id,
                    name: cat.category.name,
                    slug: cat.category.slug,
                })),
                enabled: q.enabled,
                createdAt: q.createdAt,
                lastEmailSentAt: q.lastEmailSentAt,
            })),
        };
    } catch (error) {
        console.error("Error fetching saved queries:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}

/**
 * Server action to update a saved query
 */
export async function updateSavedQuery(
    id: string,
    data: {
        name?: string;
        searchTerm?: string | null;
        minPrice?: string | null;
        maxPrice?: string | null;
        categoryIds?: number[];
        enabled?: boolean;
    }
) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session || !session.user) {
            return { success: false, error: "Not authenticated" };
        }

        const userObj = session.user as unknown as { id?: string };
        const sessionObj = session as unknown as { userId?: string };
        const userId = userObj.id ?? sessionObj.userId;

        if (!userId) {
            return { success: false, error: "User ID not found" };
        }

        // Verify ownership
        const existingQuery = await prisma.savedQuery.findUnique({
            where: { id },
        });

        if (!existingQuery || existingQuery.userId !== userId) {
            return { success: false, error: "Not authorized" };
        }

        // Update categories if provided
        if (data.categoryIds !== undefined) {
            await prisma.categoryOnSavedQuery.deleteMany({
                where: { savedQueryId: id },
            });

            if (data.categoryIds.length > 0) {
                await prisma.categoryOnSavedQuery.createMany({
                    data: data.categoryIds.map((categoryId) => ({
                        savedQueryId: id,
                        categoryId,
                    })),
                });
            }
        }

        const updated = await prisma.savedQuery.update({
            where: { id },
            data: {
                name: data.name ? data.name.trim() : undefined,
                searchTerm:
                    data.searchTerm !== undefined
                        ? data.searchTerm
                            ? data.searchTerm.trim()
                            : null
                        : undefined,
                minPrice:
                    data.minPrice !== undefined
                        ? data.minPrice
                            ? parseFloat(data.minPrice)
                            : null
                        : undefined,
                maxPrice:
                    data.maxPrice !== undefined
                        ? data.maxPrice
                            ? parseFloat(data.maxPrice)
                            : null
                        : undefined,
                enabled: data.enabled,
            },
            include: {
                categories: {
                    include: {
                        category: {
                            select: { id: true, name: true, slug: true },
                        },
                    },
                },
            },
        });

        return {
            success: true,
            query: {
                id: updated.id,
                name: updated.name,
                searchTerm: updated.searchTerm,
                minPrice: updated.minPrice?.toString(),
                maxPrice: updated.maxPrice?.toString(),
                categories: updated.categories.map((cat) => ({
                    id: cat.category.id,
                    name: cat.category.name,
                    slug: cat.category.slug,
                })),
                enabled: updated.enabled,
                createdAt: updated.createdAt,
                lastEmailSentAt: updated.lastEmailSentAt,
            },
        };
    } catch (error) {
        console.error("Error updating saved query:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}

/**
 * Server action to delete a saved query
 */
export async function deleteSavedQuery(id: string) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session || !session.user) {
            return { success: false, error: "Not authenticated" };
        }

        const userObj = session.user as unknown as { id?: string };
        const sessionObj = session as unknown as { userId?: string };
        const userId = userObj.id ?? sessionObj.userId;

        if (!userId) {
            return { success: false, error: "User ID not found" };
        }

        // Verify ownership
        const existingQuery = await prisma.savedQuery.findUnique({
            where: { id },
        });

        if (!existingQuery || existingQuery.userId !== userId) {
            return { success: false, error: "Not authorized" };
        }

        await prisma.savedQuery.delete({
            where: { id },
        });

        return { success: true };
    } catch (error) {
        console.error("Error deleting saved query:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}
