import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/saved-queries
 * Retrieve all saved queries for the authenticated user
 */
export async function GET(request: NextRequest) {
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

        if (!userId) {
            return NextResponse.json(
                { error: "User ID not found" },
                { status: 400 }
            );
        }

        const savedQueries = await prisma.savedQuery.findMany({
            where: { userId },
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
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json({
            success: true,
            queries: savedQueries.map((q) => ({
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
        });
    } catch (error) {
        console.error("Error fetching saved queries:", error);
        return NextResponse.json(
            { error: "Failed to fetch saved queries" },
            { status: 500 }
        );
    }
}

/**
 * POST /api/saved-queries
 * Create a new saved query
 */
export async function POST(request: NextRequest) {
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

        if (!userId) {
            return NextResponse.json(
                { error: "User ID not found" },
                { status: 400 }
            );
        }

        const body = await request.json();
        const { name, searchTerm, minPrice, maxPrice, categoryIds = [] } = body;

        if (!name || typeof name !== "string") {
            return NextResponse.json(
                { error: "Query name is required" },
                { status: 400 }
            );
        }

        // Validate category IDs exist
        if (categoryIds.length > 0) {
            const categoriesCount = await prisma.category.count({
                where: {
                    id: {
                        in: categoryIds.map((id: number) => parseInt(id as string, 10)),
                    },
                },
            });

            if (categoriesCount !== categoryIds.length) {
                return NextResponse.json(
                    { error: "One or more category IDs are invalid" },
                    { status: 400 }
                );
            }
        }

        const savedQuery = await prisma.savedQuery.create({
            data: {
                userId,
                name: name.trim(),
                searchTerm: searchTerm ? searchTerm.trim() : null,
                minPrice: minPrice ? parseFloat(minPrice) : null,
                maxPrice: maxPrice ? parseFloat(maxPrice) : null,
                categories: {
                    create: categoryIds.map((categoryId: number) => ({
                        categoryId,
                    })),
                },
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

        return NextResponse.json(
            {
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
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Error creating saved query:", error);
        return NextResponse.json(
            { error: "Failed to create saved query" },
            { status: 500 }
        );
    }
}
