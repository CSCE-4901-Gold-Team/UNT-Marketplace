import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

/**
 * Check if a user is a participant in a conversation.
 * Used by the WebSocket server to validate subscribe requests.
 */
export async function canUserAccessConversation(
  userId: string,
  conversationId: string
): Promise<boolean> {
  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      OR: [{ user1Id: userId }, { user2Id: userId }],
    },
  });
  return !!conversation;
}
