"use server";

import {auth} from "@/lib/auth";
import {PrismaClient} from "@/generated/prisma";
import {headers} from "next/headers";
import {redirect} from "next/navigation";

const prisma = new PrismaClient();

/**
 * Get the current user's session
 */
async function getCurrentSession() {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        redirect("/login");
    }

    return session;
}

/**
 * Get or create a conversation between two users, optionally linked to a listing
 */
export async function getOrCreateConversation(
    otherUserId: string,
    listingId?: string
) {
    const session = await getCurrentSession();
    const currentUserId = session.user.id;

    // Ensure users are different
    if (currentUserId === otherUserId) {
        throw new Error("Cannot create conversation with yourself");
    }

    // Check if conversation already exists
    const existingConversation = await prisma.conversation.findFirst({
        where: {
            OR: [
                {
                    user1Id: currentUserId,
                    user2Id: otherUserId,
                    listingId: listingId || null,
                },
                {
                    user1Id: otherUserId,
                    user2Id: currentUserId,
                    listingId: listingId || null,
                },
            ],
        },
        include: {
            user1: {
                select: {
                    id: true,
                    name: true,
                    image: true,
                },
            },
            user2: {
                select: {
                    id: true,
                    name: true,
                    image: true,
                },
            },
            listing: {
                select: {
                    id: true,
                    title: true,
                    price: true,
                    images: {
                        take: 1,
                        orderBy: {
                            sortOrder: "asc",
                        },
                    },
                },
            },
        },
    });

    if (existingConversation) {
        return existingConversation;
    }

    // Create new conversation
    const conversation = await prisma.conversation.create({
        data: {
            user1Id: currentUserId,
            user2Id: otherUserId,
            listingId: listingId || null,
        },
        include: {
            user1: {
                select: {
                    id: true,
                    name: true,
                    image: true,
                },
            },
            user2: {
                select: {
                    id: true,
                    name: true,
                    image: true,
                },
            },
            listing: {
                select: {
                    id: true,
                    title: true,
                    price: true,
                    images: {
                        take: 1,
                        orderBy: {
                            sortOrder: "asc",
                        },
                    },
                },
            },
        },
    });

    return conversation;
}

/**
 * Get all conversations for the current user
 */
export async function getConversations() {
    const session = await getCurrentSession();
    const currentUserId = session.user.id;

    const conversations = await prisma.conversation.findMany({
        where: {
            OR: [
                {user1Id: currentUserId},
                {user2Id: currentUserId},
            ],
        },
        include: {
            user1: {
                select: {
                    id: true,
                    name: true,
                    image: true,
                },
            },
            user2: {
                select: {
                    id: true,
                    name: true,
                    image: true,
                },
            },
            listing: {
                select: {
                    id: true,
                    title: true,
                    price: true,
                    images: {
                        take: 1,
                        orderBy: {
                            sortOrder: "asc",
                        },
                    },
                },
            },
            messages: {
                take: 1,
                orderBy: {
                    createdAt: "desc",
                },
                include: {
                    sender: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            },
            _count: {
                select: {
                    messages: {
                        where: {
                            read: false,
                            senderId: {
                                not: currentUserId,
                            },
                        },
                    },
                },
            },
        },
        orderBy: {
            updatedAt: "desc",
        },
    });

    return conversations.map((conv) => ({
        ...conv,
        otherUser: conv.user1Id === currentUserId ? conv.user2 : conv.user1,
        unreadCount: conv._count.messages,
        lastMessage: conv.messages[0] || null,
    }));
}

/**
 * Get messages for a specific conversation
 */
export async function getMessages(conversationId: string) {
    const session = await getCurrentSession();
    const currentUserId = session.user.id;

    // Verify user is part of the conversation
    const conversation = await prisma.conversation.findFirst({
        where: {
            id: conversationId,
            OR: [
                {user1Id: currentUserId},
                {user2Id: currentUserId},
            ],
        },
    });

    if (!conversation) {
        throw new Error("Conversation not found or access denied");
    }

    const messages = await prisma.message.findMany({
        where: {
            conversationId,
        },
        include: {
            sender: {
                select: {
                    id: true,
                    name: true,
                    image: true,
                },
            },
        },
        orderBy: {
            createdAt: "asc",
        },
    });

    // Mark messages as read
    await prisma.message.updateMany({
        where: {
            conversationId,
            senderId: {
                not: currentUserId,
            },
            read: false,
        },
        data: {
            read: true,
        },
    });

    return messages;
}

/**
 * Send a message in a conversation
 */
export async function sendMessage(conversationId: string, content: string) {
    const session = await getCurrentSession();
    const currentUserId = session.user.id;

    // Verify user is part of the conversation
    const conversation = await prisma.conversation.findFirst({
        where: {
            id: conversationId,
            OR: [
                {user1Id: currentUserId},
                {user2Id: currentUserId},
            ],
        },
    });

    if (!conversation) {
        throw new Error("Conversation not found or access denied");
    }

    // Validate content
    if (!content || content.trim().length === 0) {
        throw new Error("Message content cannot be empty");
    }

    if (content.length > 5000) {
        throw new Error("Message content is too long (max 5000 characters)");
    }

    // Create message
    const message = await prisma.message.create({
        data: {
            conversationId,
            senderId: currentUserId,
            content: content.trim(),
        },
        include: {
            sender: {
                select: {
                    id: true,
                    name: true,
                    image: true,
                },
            },
        },
    });

    // Update conversation's updatedAt timestamp
    await prisma.conversation.update({
        where: {
            id: conversationId,
        },
        data: {
            updatedAt: new Date(),
        },
    });

    return message;
}

/**
 * Get a single conversation by ID
 */
export async function getConversation(conversationId: string) {
    const session = await getCurrentSession();
    const currentUserId = session.user.id;

    const conversation = await prisma.conversation.findFirst({
        where: {
            id: conversationId,
            OR: [
                {user1Id: currentUserId},
                {user2Id: currentUserId},
            ],
        },
        include: {
            user1: {
                select: {
                    id: true,
                    name: true,
                    image: true,
                },
            },
            user2: {
                select: {
                    id: true,
                    name: true,
                    image: true,
                },
            },
            listing: {
                select: {
                    id: true,
                    title: true,
                    price: true,
                    images: {
                        take: 1,
                        orderBy: {
                            sortOrder: "asc",
                        },
                    },
                },
            },
        },
    });

    if (!conversation) {
        throw new Error("Conversation not found or access denied");
    }

    return {
        ...conversation,
        otherUser: conversation.user1Id === currentUserId
            ? conversation.user2
            : conversation.user1,
    };
}

