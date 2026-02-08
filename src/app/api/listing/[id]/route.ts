   import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const prisma = new PrismaClient();

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    
    // Get the current user session
    const session = await auth.api.getSession({
        headers: await headers()
    });
    
    try {
        const listing = await prisma.listing.findUnique({
            where: { id },
            include: {
                categories: {
                    select: {
                        id: true,
                        name: true,
                    }
                },
                images: {
                    select: {
                        url: true,
                    }
                }
            }
        });

        await prisma.$disconnect();

        if (!listing) {
            return NextResponse.json({ error: "Listing not found" }, { status: 404 });
        }

        // Prevent students from accessing professor-only listings
        if (listing.isProfessorOnly && session?.user?.role === "STUDENT") {
            return NextResponse.json(
                { error: "This listing is only available to faculty" },
                { status: 403 }
            );
        }

        // Prevent users from accessing other users' draft listings
        if (listing.listingStatus === "DRAFT" && session?.user?.id !== listing.ownerId) {
            return NextResponse.json(
                { error: "Listing not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            id: listing.id,
            title: listing.title,
            description: listing.description,
            price: listing.price.toString(),
            isProfessorOnly: listing.isProfessorOnly,
            categories: listing.categories,
            images: listing.images,
        });
    } catch (error) {
        await prisma.$disconnect();
        console.error("Error fetching listing:", error);
        return NextResponse.json({ error: "Failed to fetch listing" }, { status: 500 });
    }
}
