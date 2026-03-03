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
 * Generic single-event logger
 * Deduped per (sessionId, listingId, eventType, createdAt[date]).
 */
export async function fireEvent(type: EventType, listingId: string) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    // Don't hard-redirect from an analytics action; just no-op if not logged in.
    if (!session) return {status: 403};

    const today = startOfToday();

    await prisma.listingEvent.upsert({
        where: {
            session_listing_event_created: {
                sessionId: session.session.id,
                listingId,
                eventType: type,
                createdAt: today,
            },
        },
        update: {},
        create: {
            sessionId: session.session.id ?? null,
            userId: session.user?.id ?? null,
            listingId,
            eventType: type,
        },
    });

    return { status: 200 };
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
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    // Don't hard-redirect from an analytics action; just no-op if not logged in.
    if (!session) return { status: 403 };

    const uniqueListingIds = Array.from(new Set(listingIds)).filter(Boolean);
    if (uniqueListingIds.length === 0) return { status: 200 };

    const result = await prisma.listingEvent.createMany({
        data: uniqueListingIds.map((listingId) => ({
            sessionId: session.session.id,
            userId: session.user?.id ?? null,
            listingId,
            eventType: EventType.LISTING_IMPRESSION,
        })),
        skipDuplicates: true,
    });

    return { status: 200 };
}
