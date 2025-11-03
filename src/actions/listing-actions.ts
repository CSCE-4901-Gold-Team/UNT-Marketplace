"use server";

import {auth} from "@/lib/auth";
import {$Enums, Listing, ListingStatus, PrismaClient} from "@/generated/prisma";
import {headers} from "next/headers";
import {redirect} from "next/navigation";
import {getCurrentUserRole} from "@/actions/user-actions";
import UserRole = $Enums.UserRole;
import {ListingReturnType, ListingWithImages} from "@/models/ListingReturnType";

const prisma = new PrismaClient();

/**
 * Returns all listings based on listing status and current user's role.
 *
 * @param searchQuery  String to search for within listing body and titles
 * @return Promise<ListingReturnType[]> Array of listings with their related images
 */
export async function getListings(searchQuery?: string): Promise<ListingReturnType[]> {
    // Validate session
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        redirect("/sign-in");
    }

    // Get role of current user
    const currentUserRole = await getCurrentUserRole();

    if (!currentUserRole) return [];
    let listings: ListingWithImages[];

    if (currentUserRole === UserRole.FACULTY || currentUserRole === UserRole.ADMIN) {
        // Admin/Faculty
        listings = await prisma.listing.findMany({
            where: {
                listingStatus: ListingStatus.AVAILABLE,
                ...(searchQuery ? {
                    OR: [
                        {title: {search: searchQuery}},
                        {description: {search: searchQuery}}
                    ]
                } : {})
            },
            orderBy: {
                createdAt: 'desc'
            },
            include: {
                images: true
            }
        });
    } else {
        // All other roles
        listings = await prisma.listing.findMany({
            where: {
                listingStatus: ListingStatus.AVAILABLE,
                isProfessorOnly: false,
                ...(searchQuery ? {
                    OR: [
                        {title: {search: searchQuery}},
                        {description: {search: searchQuery}}
                    ]
                } : {})
            },
            orderBy: {
                createdAt: 'desc'
            },
            include: {
                images: true
            }
        });
    }

    // Convert and return listings
    return listings.map(listing => ({
            ...listing,
            price: listing.price.toNumber(),
    }));
}
