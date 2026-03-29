import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/saved-queries/[id]
 * Retrieve a specific saved query
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session || !session.user) {
            return NextResponse.json(
                { error: "Not authenticated" },
                { status: 401 }
            );
        }

        const userObj = session.user as unknown as { id?: string };
        const sessionObj = session as unknown as { userId?: string };
        const userId = userObj.id ?? sessionObj.userId;

        const { id } = await params;

        const savedQuery = await prisma.savedQuery.findUnique({
            where: { id },
            include: {
                categories: {
                    include: {
                        category: {
                            select: {
                                id: true,
                                name: true,
                                slug: true,
                            },
                        },
                    },
                },
            },
        });

        if (!savedQuery) {
            return NextResponse.json(
                { error: "Saved query not found" },
                { status: 404 }
            );
        }

        // Ensure user owns this query
        if (savedQuery.userId !== userId) {
            return NextResponse.json(
                { error: "Not authorized to view this query" },
                { status: 403 }
            );
        }

        return NextResponse.json({
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
                lastEmailSentAt: savedQuery.lastEmailSentAt,
            },
        });
    } catch (error) {
        console.error("Error fetching saved query:", error);
        return NextResponse.json(
            { error: "Failed to fetch saved query" },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/saved-queries/[id]
 * Update a specific saved query
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session || !session.user) {
            return NextResponse.json(
                { error: "Not authenticated" },
                { status: 401 }
            );
        }

        const userObj = session.user as unknown as { id?: string };
        const sessionObj = session as unknown as { userId?: string };
        const userId = userObj.id ?? sessionObj.userId;

        const { id } = await params;
        const body = await request.json();
        const { name, searchTerm, minPrice, maxPrice, categoryIds, enabled } = body;

        // Verify user owns this query
        const existingQuery = await prisma.savedQuery.findUnique({
            where: { id },
        });

        if (!existingQuery) {
            return NextResponse.json(
                { error: "Saved query not found" },
                { status: 404 }
            );
        }

        if (existingQuery.userId !== userId) {
            return NextResponse.json(
                { error: "Not authorized to update this query" },
                { status: 403 }
            );
        }

        // Update categories if provided
        if (categoryIds !== undefined) {
            // Delete existing category relations
            await prisma.categoryOnSavedQuery.deleteMany({
                where: { savedQueryId: id },
            });

            // Create new category relations
            if (categoryIds.length > 0) {
                await prisma.categoryOnSavedQuery.createMany({
                    data: categoryIds.map((categoryId: number) => ({
                        savedQueryId: id,
                        categoryId: parseInt(categoryId as string, 10),
                    })),
                });
            }
        }

        const updatedQuery = await prisma.savedQuery.update({
            where: { id },
            data: {
                name: name ? name.trim() : undefined,
                searchTerm: searchTerm !== undefined ? (searchTerm ? searchTerm.trim() : null) : undefined,
                minPrice: minPrice !== undefined ? (minPrice ? parseFloat(minPrice) : null) : undefined,
                maxPrice: maxPrice !== undefined ? (maxPrice ? parseFloat(maxPrice) : null) : undefined,
                enabled: enabled !== undefined ? enabled : undefined,
            },
            include: {
                categories: {
                    include: {
                        category: {
                            select: {
                                id: true,
                                name: true,
                                slug: true,
                            },
                        },
                    },
                },
            },
        });

        return NextResponse.json({
            success: true,
            query: {
                id: updatedQuery.id,
                name: updatedQuery.name,
                searchTerm: updatedQuery.searchTerm,
                minPrice: updatedQuery.minPrice?.toString(),
                maxPrice: updatedQuery.maxPrice?.toString(),
                categories: updatedQuery.categories.map((cat) => ({
                    id: cat.category.id,
                    name: cat.category.name,
                    slug: cat.category.slug,
                })),
                enabled: updatedQuery.enabled,
                createdAt: updatedQuery.createdAt,
                lastEmailSentAt: updatedQuery.lastEmailSentAt,
            },
        });
    } catch (error) {
        console.error("Error updating saved query:", error);
        return NextResponse.json(
            { error: "Failed to update saved query" },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/saved-queries/[id]
 * Delete a specific saved query
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session || !session.user) {
            return NextResponse.json(
                { error: "Not authenticated" },
                { status: 401 }
            );
        }

        const userObj = session.user as unknown as { id?: string };
        const sessionObj = session as unknown as { userId?: string };
        const userId = userObj.id ?? sessionObj.userId;

        const { id } = await params;

        // Verify user owns this query
        const existingQuery = await prisma.savedQuery.findUnique({
            where: { id },
        });

        if (!existingQuery) {
            return NextResponse.json(
                { error: "Saved query not found" },
                { status: 404 }
            );
        }

        if (existingQuery.userId !== userId) {
            return NextResponse.json(
                { error: "Not authorized to delete this query" },
                { status: 403 }
            );
        }

        await prisma.savedQuery.delete({
            where: { id },
        });

        return NextResponse.json({
            success: true,
            message: "Saved query deleted",
        });
    } catch (error) {
        console.error("Error deleting saved query:", error);
        return NextResponse.json(
            { error: "Failed to delete saved query" },
            { status: 500 }
        );
    }
}
