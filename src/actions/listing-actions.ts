"use server";

import {auth} from "@/lib/auth";
import {$Enums, PrismaClient} from "@/generated/prisma";
import {headers} from "next/headers";
import {redirect} from "next/navigation";
import {getCurrentUserRole} from "@/actions/user-actions";
import UserRole = $Enums.UserRole;
import {ListingObject, ListingWithRelations} from "@/models/ListingObject";
import {ListingFilters} from "@/types/ListingFilters";
import {ListingUtils} from "@/utils/ListingUtils";

const prisma = new PrismaClient();

/**
 * Returns all listings based on listing status and current user's role.
 *
 * @param searchQuery String to search for within listing body and titles
 * @param filters Filter parameters to filter listings by
 * @return Promise<ListingReturnType[]> Array of listings with their related images
 */
export async function getListings(searchQuery?: string, filters?: ListingFilters): Promise<ListingObject[]> {
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
    let listings: ListingWithRelations[];

    // Build filter object if it's included
    const filterObject = filters ? ListingUtils.buildFilterObject(filters) : [];

    // Build search object if it's included
    const searchObject = searchQuery ? {
        OR: [
            {title: {search: searchQuery}},
            {description: {search: searchQuery}}
        ]
    } : {};

    if (currentUserRole === UserRole.FACULTY || currentUserRole === UserRole.ADMIN) {
        // Admin/Faculty
        listings = await prisma.listing.findMany({
            where: {
                ...searchObject,
                AND: [
                    { listingStatus: ListingStatus.AVAILABLE },
                    ...filterObject
                ]
            },
            orderBy: {
                createdAt: 'desc'
            },
            include: {
                images: true,
                categories: true,
            }
        });
    } else {
        // All other roles
        listings = await prisma.listing.findMany({
            where: {
                ...searchObject,
                AND: [
                    { listingStatus: ListingStatus.AVAILABLE },
                    { isProfessorOnly: false },
                    ...filterObject
                ]
            },
            orderBy: {
                createdAt: 'desc'
            },
            include: {
                images: true,
                categories: true,
            }
        });
    }

    // Convert and return listings
    return listings.map(listing => ({
            ...listing,
            price: listing.price.toNumber(),
    }));
}
