"use server";

import { auth } from "@/lib/auth";
import { PrismaClient, ListingStatus } from "@prisma/client";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentUserRole } from "@/actions/user-actions";

const prisma = new PrismaClient();

export async function getAdminStats() {
    // Validate session and admin role
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        redirect("/sign-in");
    }

    const userRole = await getCurrentUserRole();
    if (userRole !== "ADMIN") {
        throw new Error("Unauthorized");
    }

    const [totalUsers, activeListings, pendingReports, totalTransactions] = await Promise.all([
        prisma.user.count(),
        prisma.listing.count({
            where: { listingStatus: ListingStatus.AVAILABLE }
        }),
        // Report model to be added in future PR - currently returns 0
        Promise.resolve(0),
        // Transaction model to be added in future PR - currently returns 0
        Promise.resolve(0)
    ]);

    return {
        totalUsers,
        activeListings,
        pendingReports,
        totalTransactions
    };
}

export async function getRecentlyListedItems(limit: number = 5) {
    // Validate session and admin role
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        redirect("/sign-in");
    }

    const userRole = await getCurrentUserRole();
    if (userRole !== "ADMIN") {
        throw new Error("Unauthorized");
    }

    const listings = await prisma.listing.findMany({
        where: {
            listingStatus: ListingStatus.AVAILABLE
        },
        orderBy: {
            createdAt: 'desc'
        },
        take: limit,
        include: {
            owner: {
                select: {
                    id: true,
                    name: true,
                    email: true
                }
            },
            categories: true
        }
    });

    return listings.map(listing => ({
        id: listing.id,
        title: listing.title,
        seller: listing.owner.email,
        sellerName: listing.owner.name,
        category: listing.categories[0]?.name || 'Uncategorized',
        price: `$${listing.price.toNumber().toFixed(2)}`,
        date: listing.createdAt.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
        createdAt: listing.createdAt
    }));
}

export async function getFirstListingsAwaitingApproval(limit: number = 10) {
    // Validate session and admin role
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        redirect("/sign-in");
    }

    const userRole = await getCurrentUserRole();
    if (userRole !== "ADMIN") {
        throw new Error("Unauthorized");
    }

    // Get users' first listings (DRAFT status)
    const firstListings = await prisma.listing.findMany({
        where: {
            listingStatus: ListingStatus.DRAFT
        },
        orderBy: {
            createdAt: 'asc'
        },
        take: limit,
        include: {
            owner: {
                select: {
                    id: true,
                    email: true,
                    name: true,
                    createdAt: true
                }
            },
            categories: true
        }
    });

    return firstListings.map(listing => ({
        id: listing.id,
        title: listing.title,
        seller: listing.owner.email,
        sellerName: listing.owner.name,
        category: listing.categories[0]?.name || 'Uncategorized',
        price: `$${listing.price.toNumber().toFixed(2)}`,
        date: listing.createdAt.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    }));
}

export async function getAllUsers(limit: number = 50) {
    // Validate session and admin role
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        redirect("/sign-in");
    }

    const userRole = await getCurrentUserRole();
    if (userRole !== "ADMIN") {
        throw new Error("Unauthorized");
    }

    const users = await prisma.user.findMany({
        take: limit,
        orderBy: {
            createdAt: 'desc'
        },
        include: {
            listings: true
        }
    });

    // Transaction and Report models to be added in future PRs - currently returns 0 for both
    return users.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        transactions: 0,
        listings: user.listings.length,
        reports: 0
    }));
}

export async function approveFirstListing(listingId: string) {
    // Validate session and admin role
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        redirect("/sign-in");
    }

    const userRole = await getCurrentUserRole();
    if (userRole !== "ADMIN") {
        throw new Error("Unauthorized");
    }

    await prisma.listing.update({
        where: { id: listingId },
        data: { listingStatus: ListingStatus.AVAILABLE }
    });

    return { success: true };
}

export async function rejectFirstListing(listingId: string) {
    // Validate session and admin role
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        redirect("/sign-in");
    }

    const userRole = await getCurrentUserRole();
    if (userRole !== "ADMIN") {
        throw new Error("Unauthorized");
    }

    await prisma.listing.update({
        where: { id: listingId },
        data: { listingStatus: ListingStatus.ARCHIVED }
    });

    return { success: true };
}
