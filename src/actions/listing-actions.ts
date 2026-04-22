"use server";

import {auth} from "@/lib/auth";
import {$Enums} from "@prisma/client";
import {headers} from "next/headers";
import {redirect} from "next/navigation";
import {getCurrentUserRole} from "@/actions/user-actions";
import UserRole = $Enums.UserRole;
import ListingStatus = $Enums.ListingStatus;
import {ListingObject, ListingWithRelations} from "@/models/ListingObject";
import {ListingFilters} from "@/types/ListingFilters";
import {ListingUtils} from "@/utils/ListingUtils";
import { enforceUserStatus, checkUserStatus } from "@/utils/StatusEnforcer";
import { prisma } from "@/lib/prisma";

/**
 * Returns all listings based on listing status and current user's role.
 *
 * @param {string} searchQuery to search for within listing body and titles
 * @param {ListingFilters} filters Filter parameters to filter listings by
 * @param {number} skipN Optional pagination variable for skipping first n posts
 * @param {number} takeN Optional pagination variable for taking n posts
 * @return Promise<ListingReturnType[]> Array of listings with their related images
 */
export async function getListings(
    searchQuery?: string,
    filters?: ListingFilters,
    skipN: number = 0,
    takeN: number = 12
): Promise<ListingObject[]> {
    // Validate session
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        redirect("/sign-in");
    }

    // Enforce user status - allow viewing listings even if suspended
    // (but you can change this if needed)
    const statusCheck = await checkUserStatus(session.user.id);
    
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

    const isMyListingsView = filters?.mine === true;

    if (isMyListingsView) {
        const currentUser = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { listingApproved: true },
        });

        listings = await prisma.listing.findMany({
            skip: skipN,
            take: takeN,
            where: {
                ...searchObject,
                AND: [
                    { ownerId: session.user.id },
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

        return listings.map(listing => ({
            ...listing,
            price: listing.price.toNumber(),
            isPendingApproval: listing.listingStatus === ListingStatus.DRAFT && !currentUser?.listingApproved,
            isDeniedByAdmin: listing.listingStatus === ListingStatus.ARCHIVED && !currentUser?.listingApproved,
        }));
    }

    if (currentUserRole === UserRole.FACULTY || currentUserRole === UserRole.ADMIN) {
        // Admin/Faculty
        listings = await prisma.listing.findMany({
            skip: skipN,
            take: takeN,
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
            skip: skipN,
            take: takeN,
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
            isPendingApproval: false,
            isDeniedByAdmin: false,
    }));
}

export interface ListingDetailResponse {
    id: string;
    title: string;
    description: string;
    price: string;
    listingStatus: string;
    isProfessorOnly: boolean;
    categories: Array<{ id: number; name: string }>;
    images: Array<{ url: string }>;
}

/**
 * Gets a single listing by ID with access control based on user role and listing status.
 * 
 * - Prevents students from accessing professor-only listings
 * - Prevents users from accessing other users' draft listings
 * 
 * @param id The listing ID to fetch
 * @returns Listing detail data or throws an error
 */
export async function getListingById(id: string): Promise<ListingDetailResponse> {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        redirect("/sign-in");
    }

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
        throw new Error("Listing not found");
    }

    // Prevent students from accessing professor-only listings
    if (listing.isProfessorOnly && session) {
        const userId = session.user.id;

        if (userId) {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { role: true }
            });

            if (user?.role === UserRole.STUDENT) {
                throw new Error("This listing is only available to faculty");
            }
        }
    }

    // Prevent users from accessing other users' draft listings
    if (listing.listingStatus === "DRAFT" && session?.user?.id !== listing.ownerId) {
        throw new Error("Listing not found");
    }

    return {
        id: listing.id,
        title: listing.title,
        description: listing.description,
        price: listing.price.toString(),
        listingStatus: listing.listingStatus,
        isProfessorOnly: listing.isProfessorOnly,
        categories: listing.categories,
        images: listing.images,
    };
}
