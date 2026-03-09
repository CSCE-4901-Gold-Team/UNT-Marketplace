"use server";

import { auth, prisma } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ConversationSummary {
    id: string;
    listingId: string | null;
    listingTitle: string | null;
    listingImage: string | null;
    otherUser: {
        id: string;
        name: string;
        image: string | null;
    };
    lastMessage: string | null;
    lastMessageAt: Date | null;
    unreadCount: number;
    updatedAt: Date;
}

export interface MessageData {
    id: string;
    body: string;
    senderId: string;
    senderName: string;
    senderImage: string | null;
    createdAt: Date;
    isMine: boolean;
}

export interface ConversationDetail {
    id: string;
    listingId: string | null;
    listingTitle: string | null;
    listingImage: string | null;
    listingPrice: string | null;
    otherUser: {
        id: string;
        name: string;
        image: string | null;
    };
    messages: MessageData[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function requireSession() {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) throw new Error("Unauthenticated");
    return session.user;
}

// ─── Actions ──────────────────────────────────────────────────────────────────

/**
 * Gets or creates a conversation between the current user and the listing owner.
 * Returns the conversation ID.
 */
export async function getOrCreateConversation(listingId: string): Promise<{ conversationId: string }> {
    const user = await requireSession();

    const listing = await prisma.listing.findUnique({
        where: { id: listingId },
        select: { ownerId: true },
    });

    if (!listing) throw new Error("Listing not found");
    if (listing.ownerId === user.id) throw new Error("Cannot message yourself");

    // Look for an existing conversation between these two users for this listing.
    // We find a conversation linked to this listing where the current user is a
    // participant, then verify the listing owner is also a participant.
    const existing = await prisma.conversation.findFirst({
        where: {
            listingId,
            AND: [
                { participants: { some: { userId: user.id } } },
                { participants: { some: { userId: listing.ownerId } } },
            ],
        },
        select: { id: true },
    });

    if (existing) return { conversationId: existing.id };

    // Create a new conversation
    const conversation = await prisma.conversation.create({
        data: {
            listingId,
            participants: {
                create: [{ userId: user.id }, { userId: listing.ownerId }],
            },
        },
        select: { id: true },
    });

    return { conversationId: conversation.id };
}

/**
 * Returns all conversations for the current user, with the last message and unread count.
 */
export async function getConversations(): Promise<ConversationSummary[]> {
    const user = await requireSession();

    const participantRows = await prisma.conversationParticipant.findMany({
        where: { userId: user.id },
        include: {
            conversation: {
                include: {
                    listing: {
                        select: {
                            id: true,
                            title: true,
                            images: {
                                select: { url: true, sortOrder: true },
                                orderBy: { sortOrder: "asc" },
                                take: 1,
                            },
                        },
                    },
                    participants: {
                        where: { userId: { not: user.id } },
                        include: {
                            user: { select: { id: true, name: true, image: true } },
                        },
                    },
                    messages: {
                        orderBy: { createdAt: "desc" },
                        take: 1,
                        select: { body: true, createdAt: true },
                    },
                },
            },
        },
        orderBy: {
            conversation: { updatedAt: "desc" },
        },
    });

    const results: ConversationSummary[] = [];

    for (const row of participantRows) {
        const conv = row.conversation;
        const otherParticipant = conv.participants[0];
        if (!otherParticipant) continue;

        // Count unread: messages after lastReadAt
        const unreadCount = await prisma.message.count({
            where: {
                conversationId: conv.id,
                senderId: { not: user.id },
                createdAt: row.lastReadAt ? { gt: row.lastReadAt } : undefined,
            },
        });

        const lastMsg = conv.messages[0] ?? null;

        results.push({
            id: conv.id,
            listingId: conv.listing?.id ?? null,
            listingTitle: conv.listing?.title ?? null,
            listingImage: conv.listing?.images[0]?.url ?? null,
            otherUser: {
                id: otherParticipant.user.id,
                name: otherParticipant.user.name,
                image: otherParticipant.user.image ?? null,
            },
            lastMessage: lastMsg?.body ?? null,
            lastMessageAt: lastMsg?.createdAt ?? null,
            unreadCount,
            updatedAt: conv.updatedAt,
        });
    }

    return results;
}

/**
 * Returns all messages + metadata for a given conversation.
 * Also marks unread messages as read.
 */
export async function getConversationDetail(conversationId: string): Promise<ConversationDetail> {
    const user = await requireSession();

    // Verify user is a participant
    const participant = await prisma.conversationParticipant.findUnique({
        where: {
            conversationId_userId: { conversationId, userId: user.id },
        },
    });
    if (!participant) throw new Error("Forbidden");

    const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: {
            listing: {
                select: {
                    id: true,
                    title: true,
                    price: true,
                    images: {
                        select: { url: true, sortOrder: true },
                        orderBy: { sortOrder: "asc" },
                        take: 1,
                    },
                },
            },
            participants: {
                where: { userId: { not: user.id } },
                include: {
                    user: { select: { id: true, name: true, image: true } },
                },
            },
            messages: {
                orderBy: { createdAt: "asc" },
                include: {
                    sender: { select: { id: true, name: true, image: true } },
                },
            },
        },
    });

    if (!conversation) throw new Error("Conversation not found");

    // Mark conversation as read
    await prisma.conversationParticipant.update({
        where: { conversationId_userId: { conversationId, userId: user.id } },
        data: { lastReadAt: new Date() },
    });

    const otherUser = conversation.participants[0]?.user;

    return {
        id: conversation.id,
        listingId: conversation.listing?.id ?? null,
        listingTitle: conversation.listing?.title ?? null,
        listingImage: conversation.listing?.images[0]?.url ?? null,
        listingPrice: conversation.listing?.price?.toString() ?? null,
        otherUser: {
            id: otherUser?.id ?? "",
            name: otherUser?.name ?? "Unknown",
            image: otherUser?.image ?? null,
        },
        messages: conversation.messages.map((m) => ({
            id: m.id,
            body: m.body,
            senderId: m.senderId,
            senderName: m.sender.name,
            senderImage: m.sender.image,
            createdAt: m.createdAt,
            isMine: m.senderId === user.id,
        })),
    };
}

/**
 * Sends a message in a conversation.
 */
export async function sendMessage(conversationId: string, body: string): Promise<MessageData> {
    const user = await requireSession();

    const trimmed = body.trim();
    if (!trimmed) throw new Error("Message cannot be empty");
    if (trimmed.length > 2000) throw new Error("Message too long");

    // Verify user is a participant
    const participant = await prisma.conversationParticipant.findUnique({
        where: { conversationId_userId: { conversationId, userId: user.id } },
    });
    if (!participant) throw new Error("Forbidden");

    const [message] = await prisma.$transaction([
        prisma.message.create({
            data: { conversationId, senderId: user.id, body: trimmed },
            include: { sender: { select: { id: true, name: true, image: true } } },
        }),
        prisma.conversation.update({
            where: { id: conversationId },
            data: { updatedAt: new Date() },
        }),
        // Mark sender's lastReadAt so their own message isn't counted as unread
        prisma.conversationParticipant.update({
            where: { conversationId_userId: { conversationId, userId: user.id } },
            data: { lastReadAt: new Date() },
        }),
    ]);

    revalidatePath(`/market/messages/${conversationId}`);
    revalidatePath("/market/messages");

    return {
        id: message.id,
        body: message.body,
        senderId: message.senderId,
        senderName: message.sender.name,
        senderImage: message.sender.image,
        createdAt: message.createdAt,
        isMine: true,
    };
}

/**
 * Fetches only messages created after `afterId` for polling.
 */
export async function getNewMessages(conversationId: string, afterId: string | null): Promise<MessageData[]> {
    const user = await requireSession();

    const participant = await prisma.conversationParticipant.findUnique({
        where: { conversationId_userId: { conversationId, userId: user.id } },
    });
    if (!participant) throw new Error("Forbidden");

    const messages = await prisma.message.findMany({
        where: {
            conversationId,
            ...(afterId
                ? {
                      createdAt: {
                          gt: (
                              await prisma.message.findUnique({ where: { id: afterId }, select: { createdAt: true } })
                          )?.createdAt ?? new Date(0),
                      },
                  }
                : {}),
        },
        orderBy: { createdAt: "asc" },
        include: { sender: { select: { id: true, name: true, image: true } } },
    });

    // Mark as read
    await prisma.conversationParticipant.update({
        where: { conversationId_userId: { conversationId, userId: user.id } },
        data: { lastReadAt: new Date() },
    });

    return messages.map((m) => ({
        id: m.id,
        body: m.body,
        senderId: m.senderId,
        senderName: m.sender.name,
        senderImage: m.sender.image,
        createdAt: m.createdAt,
        isMine: m.senderId === user.id,
    }));
}
