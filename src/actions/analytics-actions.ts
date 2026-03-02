"use server";

import {auth, prisma} from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {EventType} from "@prisma/client";

export async function fireEvent(
    type: EventType,
    listing_id: string
) {
    // Validate session and admin role
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        redirect("/sign-in");
    }

    // Insert new event
    // Empty update clause simulates find or create
    // Only insert unique records that
    await prisma.listingEvent.upsert({
        where: {
            session_listing_event_created: {
                sessionId: session.session.id,
                listingId: listing_id,
                eventType: type,
                createdAt: new Date().setHours(0, 0, 0, 0).toString()
            }
        },
        update: { },
        create: {
            sessionId: session.session.id,
            listingId: listing_id,
            eventType: type
        },
    });
}
