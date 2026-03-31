"use server";

import { auth } from "@/lib/auth";
import { ListingStatus, MessageProfanityFlagStatus, ReportStatus, UserStatusType } from "@prisma/client";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentUserRole } from "@/actions/user-actions";
import { prisma } from "@/lib/prisma";

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

    const [totalUsers, activeListings, pendingReports, totalTransactions, pendingProfanityFlags, pendingListingProfanityFlags] =
        await Promise.all([
            prisma.user.count().catch(() => 0),
            prisma.listing.count({
                where: { listingStatus: ListingStatus.AVAILABLE },
            }).catch(() => 0),
            prisma.report.count({
                where: { status: ReportStatus.PENDING },
            }).catch(() => 0),
            // Transaction model to be added in future PR - currently returns 0
            Promise.resolve(0),
            prisma.messageProfanityFlag
                .count({
                    where: { status: MessageProfanityFlagStatus.PENDING },
                })
                .catch(() => 0),
            prisma.listingProfanityFlag
                .count({
                    where: { status: MessageProfanityFlagStatus.PENDING },
                })
                .catch(() => 0),
        ]);

    return {
        totalUsers,
        activeListings,
        pendingReports,
        totalTransactions,
        pendingProfanityFlags,
        pendingListingProfanityFlags,
    };
}

export async function getRecentlyListedItems(limit: number = 5, skip: number = 0) {
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
        redirect("/sign-in");
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

export async function getPendingListingReports(limit: number = 50, skip: number = 0) {
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

    const [reports, total] = await Promise.all([
        prisma.report.findMany({
            where: {
                status: ReportStatus.PENDING,
            },
            orderBy: {
                createdAt: "desc",
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
                                email: true,
                            },
                        },
                        images: {
                            select: {
                                url: true,
                            },
                            take: 1,
                        },
                    },
                },
                reporter: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        }),
        prisma.report.count({
            where: { status: ReportStatus.PENDING },
        }),
    ]);

    return {
        reports: reports.map((report) => ({
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
            createdAt: report.createdAt.toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
            }),
        })),
        total,
    };
}

export async function getReportById(reportId: string) {
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

export async function suspendUserWithExpiry(userId: string, expiresAt: Date) {
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
        redirect("/sign-in");
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
        redirect("/sign-in");
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
        redirect("/sign-in");
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
        redirect("/sign-in");
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
        redirect("/sign-in");
    }

    const userRole = await getCurrentUserRole();
    if (userRole !== "ADMIN") {
        throw new Error("Unauthorized");
    }

    const reportStatus = action === 'RESOLVED' ? ReportStatus.RESOLVED : ReportStatus.DISMISSED;

    await prisma.report.update({
        where: { id: reportId },
        data: { status: reportStatus },
    });

    revalidatePath("/admin");
    revalidatePath("/admin/reports");

    return { success: true };
}

export interface ProfanityFlagRow {
    id: string;
    messageId: string;
    conversationId: string;
    senderId: string;
    senderName: string;
    senderEmail: string;
    originalBody: string;
    censoredBody: string;
    createdAt: Date;
    listingId: string | null;
    listingTitle: string | null;
}

export async function getPendingProfanityFlags(limit: number = 25, skip: number = 0): Promise<{
    flags: ProfanityFlagRow[];
    total: number;
}> {
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

    const [rows, total] = await Promise.all([
        prisma.messageProfanityFlag.findMany({
            where: { status: MessageProfanityFlagStatus.PENDING },
            orderBy: { createdAt: "desc" },
            take: limit,
            skip,
            include: {
                sender: { select: { id: true, name: true, email: true } },
                message: { select: { body: true } },
                conversation: {
                    select: {
                        listing: { select: { id: true, title: true } },
                    },
                },
            },
        }),
        prisma.messageProfanityFlag.count({
            where: { status: MessageProfanityFlagStatus.PENDING },
        }),
    ]);

    const flags: ProfanityFlagRow[] = rows.map((f) => ({
        id: f.id,
        messageId: f.messageId,
        conversationId: f.conversationId,
        senderId: f.senderId,
        senderName: f.sender.name,
        senderEmail: f.sender.email,
        originalBody: f.originalBody,
        censoredBody: f.message.body,
        createdAt: f.createdAt,
        listingId: f.conversation.listing?.id ?? null,
        listingTitle: f.conversation.listing?.title ?? null,
    }));

    return { flags, total };
}

export async function reviewProfanityFlag(
    flagId: string,
    outcome: "REVIEWED_NO_ACTION" | "ACTIONED"
): Promise<{ success: boolean }> {
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

    const status =
        outcome === "ACTIONED"
            ? MessageProfanityFlagStatus.ACTIONED
            : MessageProfanityFlagStatus.REVIEWED_NO_ACTION;

    await prisma.messageProfanityFlag.update({
        where: { id: flagId },
        data: {
            status,
            reviewedAt: new Date(),
            reviewedById: session.user.id,
        },
    });

    revalidatePath("/admin");
    return { success: true };
}

export interface ListingProfanityFlagRow {
    id: string;
    listingId: string;
    ownerId: string;
    ownerName: string;
    ownerEmail: string;
    originalTitle: string;
    originalDescription: string;
    censoredTitle: string;
    censoredDescription: string;
    createdAt: Date;
}

export async function getPendingListingProfanityFlags(
    limit: number = 25,
    skip: number = 0
): Promise<{
    flags: ListingProfanityFlagRow[];
    total: number;
}> {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        redirect("/sign-in");
    }

    const userRole = await getCurrentUserRole();
    if (userRole !== "ADMIN") {
        throw new Error("Unauthorized");
    }

    const [rows, total] = await Promise.all([
        prisma.listingProfanityFlag.findMany({
            where: { status: MessageProfanityFlagStatus.PENDING },
            orderBy: { createdAt: "desc" },
            take: limit,
            skip,
            include: {
                listing: { select: { title: true, description: true } },
                owner: { select: { id: true, name: true, email: true } },
            },
        }),
        prisma.listingProfanityFlag.count({
            where: { status: MessageProfanityFlagStatus.PENDING },
        }),
    ]);

    const flags: ListingProfanityFlagRow[] = rows.map((f) => ({
        id: f.id,
        listingId: f.listingId,
        ownerId: f.ownerId,
        ownerName: f.owner.name,
        ownerEmail: f.owner.email,
        originalTitle: f.originalTitle,
        originalDescription: f.originalDescription,
        censoredTitle: f.listing.title,
        censoredDescription: f.listing.description,
        createdAt: f.createdAt,
    }));

    return { flags, total };
}

export async function reviewListingProfanityFlag(
    flagId: string,
    outcome: "REVIEWED_NO_ACTION" | "ACTIONED"
): Promise<{ success: boolean }> {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        redirect("/sign-in");
    }

    const userRole = await getCurrentUserRole();
    if (userRole !== "ADMIN") {
        throw new Error("Unauthorized");
    }

    const status =
        outcome === "ACTIONED"
            ? MessageProfanityFlagStatus.ACTIONED
            : MessageProfanityFlagStatus.REVIEWED_NO_ACTION;

    await prisma.listingProfanityFlag.update({
        where: { id: flagId },
        data: {
            status,
            reviewedAt: new Date(),
            reviewedById: session.user.id,
        },
    });

    revalidatePath("/admin");
    return { success: true };
}
