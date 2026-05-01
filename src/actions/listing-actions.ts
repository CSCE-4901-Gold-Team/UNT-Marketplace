"use server";

import {auth} from "@/lib/auth";
import {$Enums, MessageProfanityFlagStatus} from "@/prisma/generated";
import {headers} from "next/headers";
import {redirect} from "next/navigation";
import {getCurrentUserRole} from "@/actions/user-actions";
import UserRole = $Enums.UserRole;
import ListingStatus = $Enums.ListingStatus;
import {ListingObject, ListingWithRelations} from "@/models/ListingObject";
import {ListingFilters} from "@/types/ListingFilters";
import {ListingByIdResult} from "@/types/ListingTypes";
import {ListingUtils} from "@/utils/ListingUtils";
import { enforceUserStatus, checkUserStatus } from "@/utils/StatusEnforcer";
import { prisma } from "@/lib/prisma";

async function withProfanityViewerFields(
    listings: ListingWithRelations[],
    viewerId: string,
    getRowExtras: (
        listing: ListingWithRelations
    ) => Pick<ListingObject, "isPendingApproval" | "isDeniedByAdmin">
): Promise<ListingObject[]> {
    if (listings.length === 0) {
        return [];
    }

    const viewer = await prisma.user.findUnique({
        where: { id: viewerId },
        select: { allowMatureListingContent: true },
    });
    const allowMature = viewer?.allowMatureListingContent ?? false;

    const ids = listings.map((l) => l.id);
    const flags = await prisma.listingProfanityFlag.findMany({
        where: {
            listingId: { in: ids },
            status: MessageProfanityFlagStatus.REVIEWED_NO_ACTION,
        },
        orderBy: [{ reviewedAt: "desc" }, { createdAt: "desc" }],
        select: {
            listingId: true,
            originalTitle: true,
            originalDescription: true,
        },
    });

    const releasedByListing = new Map<string, { title: string; description: string }>();
    for (const f of flags) {
        if (!releasedByListing.has(f.listingId)) {
            releasedByListing.set(f.listingId, {
                title: f.originalTitle,
                description: f.originalDescription,
            });
        }
    }

    return listings.map((listing) => {
        const extras = getRowExtras(listing);
        const base: ListingObject = {
            ...listing,
            price: listing.price.toNumber(),
            ...extras,
        };
        const released = releasedByListing.get(listing.id);
        if (!released) {
            return base;
        }
        return {
            ...base,
            ...(allowMature
                ? {
                      matureAlternateTitle: released.title,
                      matureAlternateDescription: released.description,
                  }
                : {}),
            blurProfanityReleasedCardImage: !allowMature,
        };
    });
}

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
        redirect("/login");
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

        return withProfanityViewerFields(
            listings,
            session.user.id,
            (listing) => ({
                isPendingApproval:
                    listing.listingStatus === ListingStatus.DRAFT &&
                    !currentUser?.listingApproved,
                isDeniedByAdmin:
                    listing.listingStatus === ListingStatus.ARCHIVED &&
                    !currentUser?.listingApproved,
            })
        );
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

    return withProfanityViewerFields(listings, session.user.id, () => ({
        isPendingApproval: false,
        isDeniedByAdmin: false,
    }));
}

/**
 * Returns a single listing by ID with access control checks.
 * Used for editing listings.
 */
export async function getListById(id: string): Promise<ListingByIdResult> {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        redirect("/login");
    }

    const listing = await prisma.listing.findUnique({
        where: { id },
        include: {
            categories: {
                select: {
                    id: true,
                    name: true,
                },
            },
            images: {
                select: {
                    url: true,
                },
            },
        },
    });

    if (!listing) {
        return { success: false, error: "Listing not found" };
    }

    // Prevent students from accessing professor-only listings
    if (listing.isProfessorOnly) {
        const currentUserRole = await getCurrentUserRole();
        if (currentUserRole === UserRole.STUDENT) {
            return { success: false, error: "This listing is only available to faculty" };
        }
    }

    // Prevent users from accessing other users' draft listings
    if (listing.listingStatus === ListingStatus.DRAFT && session.user.id !== listing.ownerId) {
        return { success: false, error: "Listing not found" };
    }

    return {
        success: true,
        listing: {
            id: listing.id,
            title: listing.title,
            description: listing.description,
            price: listing.price.toString(),
            listingStatus: listing.listingStatus,
            isProfessorOnly: listing.isProfessorOnly,
            categories: listing.categories,
            images: listing.images,
        },
    };
}
