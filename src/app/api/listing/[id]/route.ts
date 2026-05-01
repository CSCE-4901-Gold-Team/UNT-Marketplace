import { $Enums } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

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

        if (!listing) {
            return NextResponse.json({ error: "Listing not found" }, { status: 404 });
        }

        // Prevent students from accessing professor-only listings
        if (listing.isProfessorOnly && session) {
            const userObj = session.user as unknown as { id?: string };
            const sessionObj = session as unknown as { userId?: string };
            const userId = userObj.id ?? sessionObj.userId;

            if (userId) {
                const user = await prisma.user.findUnique({
                    where: { id: userId },
                    select: { role: true }
                });

                if (user?.role === $Enums.UserRole.STUDENT) {
                    return NextResponse.json(
                        { error: "This listing is only available to faculty" },
                        { status: 403 }
                    );
                }
            }
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
            listingStatus: listing.listingStatus,
            isProfessorOnly: listing.isProfessorOnly,
            pickupAddress: listing.pickupAddress,
            categories: listing.categories,
            images: listing.images,
        });
    } catch (error) {
        console.error("Error fetching listing:", error);
        return NextResponse.json({ error: "Failed to fetch listing" }, { status: 500 });
    }
}
