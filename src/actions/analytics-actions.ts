"use server";

import {auth, prisma} from "@/lib/auth";
import {headers} from "next/headers";
import {EventType} from "@/prisma/generated";

function startOfToday(): Date {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
}

function daysAgoStart(daysAgo: number): Date {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    d.setHours(0, 0, 0, 0);
    return d;
}

function toDateKey(d: Date): string {
    return d.toISOString().slice(0, 10);
}

export interface ListingAnalyticsPoint {
    date: string;
    impressions: number;
    views: number;
    contactSeller: number;
}

export interface ListingAnalyticsSummary {
    listingId: string;
    listingTitle: string;
    windowDays: number;
    totals: {
        impressions: number;
        views: number;
        contactSeller: number;
    };
    conversionRates: {
        impressionToViewPct: number;
        viewToContactPct: number;
    };
    daily: ListingAnalyticsPoint[];
}

/**
 * Generic bulk-event logger
 * Deduped per (sessionId, listingId, eventType, createdAt[date]).
 */
export async function fireListingEvents(type: EventType, listingIds: string[]) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    // Don't hard-redirect from an analytics action; just no-op if not logged in.
    if (!session) return {status: 403};

    const uniqueListingIds = Array.from(new Set(listingIds)).filter(Boolean);
    if (uniqueListingIds.length === 0) return {status: 200};

    const today = startOfToday();

    await prisma.listingEvent.createMany({
        data: uniqueListingIds.map((listingId) => ({
            sessionId: session.session.id,
            userId: session.user?.id ?? null,
            listingId,
            eventType: type,
            createdAt: today,
        })),
        skipDuplicates: true,
    });

    return {status: 200};
}

/**
 * Generic single-event logger
 * Deduped per (sessionId, listingId, eventType, createdAt[date]).
 */
export async function fireEvent(type: EventType, listingId: string) {
    return fireListingEvents(type, [listingId]);
}

/**
 * Listing impressions from market overview page
 */
export async function fireListingImpression(listingId: string) {
    return fireEvent(EventType.LISTING_IMPRESSION, listingId);
}

/**
 * Listing visits
 */
export async function fireListingView(listingId: string) {
    return fireEvent(EventType.LISTING_VIEW, listingId);
}

/**
 * Contact seller clicks from listing detail
 */
export async function fireContactSeller(listingId: string) {
    return fireEvent(EventType.CONTACT_SELLER, listingId);
}

/**
 * Bulk impression logger
 */
export async function fireListingImpressions(listingIds: string[]) {
    return fireListingEvents(EventType.LISTING_IMPRESSION, listingIds);
}

/**
 * Owner-only listing analytics (daily series + totals)
 */
export async function getListingAnalytics(listingId: string, windowDays: number = 14) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) return {status: 403};

    const listing = await prisma.listing.findUnique({
        where: {id: listingId},
        select: {id: true, title: true, ownerId: true},
    });

    if (!listing) return {status: 404};
    if (listing.ownerId !== session.user.id) return {status: 403};

    const safeWindowDays = Math.max(1, Math.min(90, windowDays));
    const startDate = daysAgoStart(safeWindowDays - 1);

    const grouped = await prisma.listingEvent.groupBy({
        by: ["createdAt", "eventType"],
        where: {
            listingId,
            createdAt: {gte: startDate},
            eventType: {
                in: [
                    EventType.LISTING_IMPRESSION,
                    EventType.LISTING_VIEW,
                    EventType.CONTACT_SELLER,
                ],
            },
        },
        _count: {_all: true},
        orderBy: [{createdAt: "asc"}],
    });

    const buckets = new Map<string, ListingAnalyticsPoint>();
    for (let i = safeWindowDays - 1; i >= 0; i--) {
        const date = daysAgoStart(i);
        const key = toDateKey(date);
        buckets.set(key, {
            date: key,
            impressions: 0,
            views: 0,
            contactSeller: 0,
        });
    }

    for (const row of grouped) {
        const key = toDateKey(row.createdAt);
        const current = buckets.get(key);
        if (!current) continue;

        if (row.eventType === EventType.LISTING_IMPRESSION) current.impressions += row._count._all;
        if (row.eventType === EventType.LISTING_VIEW) current.views += row._count._all;
        if (row.eventType === EventType.CONTACT_SELLER) current.contactSeller += row._count._all;
    }

    const daily = Array.from(buckets.values());
    const totals = daily.reduce(
        (acc, day) => {
            acc.impressions += day.impressions;
            acc.views += day.views;
            acc.contactSeller += day.contactSeller;
            return acc;
        },
        {impressions: 0, views: 0, contactSeller: 0}
    );

    const impressionToViewPct = totals.impressions > 0
        ? Number(((totals.views / totals.impressions) * 100).toFixed(1))
        : 0;

    const viewToContactPct = totals.views > 0
        ? Number(((totals.contactSeller / totals.views) * 100).toFixed(1))
        : 0;

    const data: ListingAnalyticsSummary = {
        listingId: listing.id,
        listingTitle: listing.title,
        windowDays: safeWindowDays,
        totals,
        conversionRates: {
            impressionToViewPct,
            viewToContactPct,
        },
        daily,
    };

    return {status: 200, data};
}
