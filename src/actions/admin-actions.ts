"use server";

import { auth } from "@/lib/auth";
import { ListingStatus, ReportStatus, UserStatusType } from "@prisma/client";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentUserRole } from "@/actions/user-actions";
import { prisma } from "@/lib/prisma";

export async function getAdminStats() {
    // Validate session and admin role
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        redirect("/login");
    }

    const userRole = await getCurrentUserRole();
    if (userRole !== "ADMIN") {
        throw new Error("Unauthorized");
    }

    const [totalUsers, activeListings, pendingReports, totalTransactions] = await Promise.all([
        prisma.user.count().catch(() => 0),
        prisma.listing.count({
            where: { listingStatus: ListingStatus.AVAILABLE }
        }).catch(() => 0),
        prisma.report.count({
            where: { status: ReportStatus.PENDING }
        }).catch(() => 0),
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

export async function getRecentlyListedItems(limit: number = 5, skip: number = 0) {
    // Validate session and admin role
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        redirect("/login");
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
        skip: skip,
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

export async function getFirstListingsAwaitingApproval(limit: number = 10, skip: number = 0) {
    // Validate session and admin role
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        redirect("/login");
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
        skip: skip,
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

export async function getAllUsers(limit: number = 50, skip: number = 0) {
    // Validate session and admin role
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        redirect("/login");
    }

    const userRole = await getCurrentUserRole();
    if (userRole !== "ADMIN") {
        throw new Error("Unauthorized");
    }

    const users = await prisma.user.findMany({
        take: limit,
        skip: skip,
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
        redirect("/login");
    }

    const userRole = await getCurrentUserRole();
    if (userRole !== "ADMIN") {
        throw new Error("Unauthorized");
    }

    const listing = await prisma.listing.findUnique({
        where: { id: listingId },
        select: { ownerId: true },
    });

    if (!listing) {
        throw new Error("Listing not found");
    }

    await prisma.$transaction([
        prisma.listing.update({
            where: { id: listingId },
            data: { listingStatus: ListingStatus.AVAILABLE }
        }),
        prisma.user.update({
            where: { id: listing.ownerId },
            data: { listingApproved: true },
        }),
    ]);

    return { success: true };
}

export async function rejectFirstListing(listingId: string) {
    // Validate session and admin role
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        redirect("/login");
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

export async function getPendingListingReports(limit: number = 50, skip: number = 0) {
    // Validate session and admin role
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        redirect("/login");
    }

    const userRole = await getCurrentUserRole();
    if (userRole !== "ADMIN") {
        throw new Error("Unauthorized");
    }

    const reports = await prisma.report.findMany({
        where: {
            status: ReportStatus.PENDING
        },
        orderBy: {
            createdAt: 'desc'
        },
        take: limit,
        skip: skip,
        include: {
            listing: {
                select: {
                    id: true,
                    title: true,
                    description: true,
                    price: true,
                    ownerId: true,
                    owner: {
                        select: {
                            id: true,
                            name: true,
                            email: true
                        }
                    },
                    images: {
                        select: {
                            url: true
                        },
                        take: 1
                    }
                }
            },
            reporter: {
                select: {
                    id: true,
                    name: true,
                    email: true
                }
            }
        }
    });

    return reports.map(report => ({
        id: report.id,
        listingId: report.listing.id,
        listingTitle: report.listing.title,
        listingDescription: report.listing.description,
        listingPrice: `$${report.listing.price.toNumber().toFixed(2)}`,
        listingImage: report.listing.images[0]?.url || null,
        listingOwnerId: report.listing.ownerId,
        listingOwnerName: report.listing.owner.name,
        listingOwnerEmail: report.listing.owner.email,
        reporterId: report.reporter.id,
        reporterName: report.reporter.name,
        reporterEmail: report.reporter.email,
        reason: report.reason,
        details: report.details,
        status: report.status,
        createdAt: report.createdAt.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    }));
}

export async function getReportById(reportId: string) {
    // Validate session and admin role
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        redirect("/login");
    }

    const userRole = await getCurrentUserRole();
    if (userRole !== "ADMIN") {
        throw new Error("Unauthorized");
    }

    const report = await prisma.report.findUnique({
        where: { id: reportId },
        include: {
            listing: {
                include: {
                    owner: true,
                    images: true,
                    categories: true
                }
            },
            reporter: true
        }
    });

    if (!report) {
        throw new Error("Report not found");
    }

    return report;
}

export async function deleteListing(listingId: string) {
    // Validate session and admin role
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        redirect("/login");
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

export async function suspendUserWithExpiry(userId: string, expiresAt: Date) {
    // Validate session and admin role
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        redirect("/login");
    }

    const userRole = await getCurrentUserRole();
    if (userRole !== "ADMIN") {
        throw new Error("Unauthorized");
    }

    await prisma.userStatus.create({
        data: {
            userId,
            status: UserStatusType.SUSPENDED,
            expiresAt: expiresAt
        }
    });

    return { success: true };
}

export async function banUserPermanently(userId: string) {
    // Validate session and admin role
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        redirect("/login");
    }

    const userRole = await getCurrentUserRole();
    if (userRole !== "ADMIN") {
        throw new Error("Unauthorized");
    }

    await prisma.userStatus.create({
        data: {
            userId,
            status: UserStatusType.BANNED,
            expiresAt: null
        }
    });

    return { success: true };
}

export async function activateUser(userId: string) {
    // Validate session and admin role
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        redirect("/login");
    }

    const userRole = await getCurrentUserRole();
    if (userRole !== "ADMIN") {
        throw new Error("Unauthorized");
    }

    await prisma.userStatus.create({
        data: {
            userId,
            status: UserStatusType.ACTIVE,
            expiresAt: null
        }
    });

    return { success: true };
}

export async function getUserSuspensionStatus(userId: string) {
    // Validate session and admin role
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        redirect("/login");
    }

    const userRole = await getCurrentUserRole();
    if (userRole !== "ADMIN") {
        throw new Error("Unauthorized");
    }

    const userStatus = await prisma.userStatus.findFirst({
        where: {
            userId: userId
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    if (!userStatus) {
        return { status: 'ACTIVE', expiresAt: null, createdAt: null };
    }

    return {
        status: userStatus.status,
        expiresAt: userStatus.expiresAt,
        createdAt: userStatus.createdAt
    };
}

export async function getSuspendedUsers(limit: number = 50, skip: number = 0) {
    // Validate session and admin role
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        redirect("/login");
    }

    const userRole = await getCurrentUserRole();
    if (userRole !== "ADMIN") {
        throw new Error("Unauthorized");
    }

    // Get unique users with suspended or banned status, showing their latest status
    const suspendedStatuses = await prisma.userStatus.findMany({
        where: {
            status: {
                in: [UserStatusType.SUSPENDED, UserStatusType.BANNED]
            }
        },
        orderBy: {
            createdAt: 'desc'
        },
        take: limit,
        skip: skip,
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    createdAt: true
                }
            }
        }
    });

    // Remove duplicates (keep only latest status per user)
    const uniqueMap = new Map();
    suspendedStatuses.forEach(status => {
        if (!uniqueMap.has(status.userId)) {
            uniqueMap.set(status.userId, status);
        }
    });

    return Array.from(uniqueMap.values()).map(userStatus => ({
        userId: userStatus.user.id,
        name: userStatus.user.name,
        email: userStatus.user.email,
        role: userStatus.user.role,
        status: userStatus.status,
        expiresAt: userStatus.expiresAt,
        suspendedAt: userStatus.createdAt,
        userCreatedAt: userStatus.user.createdAt
    }));
}

export async function resolveReport(reportId: string, action: 'RESOLVED' | 'DISMISSED') {
    // Validate session and admin role
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        redirect("/login");
    }

    const userRole = await getCurrentUserRole();
    if (userRole !== "ADMIN") {
        throw new Error("Unauthorized");
    }

    const reportStatus = action === 'RESOLVED' ? ReportStatus.RESOLVED : ReportStatus.DISMISSED;

    await prisma.report.update({
        where: { id: reportId },
        data: { status: reportStatus }
    });

    return { success: true };
}
