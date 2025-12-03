import { PrismaClient } from "@/generated/prisma";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    
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
