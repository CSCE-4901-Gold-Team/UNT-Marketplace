"use server";

import {auth, prisma} from "@/lib/auth";
import {headers} from "next/headers";
import {EventType} from "@prisma/client";

function startOfToday(): Date {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
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

    const result = await prisma.listingEvent.createMany({
        data: uniqueListingIds.map((listingId) => ({
            sessionId: session.session.id,
            userId: session.user?.id ?? null,
            listingId,
            eventType: type,
            createdAt: today,
        })),
        skipDuplicates: true,
    });

    console.log(uniqueListingIds, type, result);

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
 * Bulk impression logger
 */
export async function fireListingImpressions(listingIds: string[]) {
    return fireListingEvents(EventType.LISTING_IMPRESSION, listingIds);
}
