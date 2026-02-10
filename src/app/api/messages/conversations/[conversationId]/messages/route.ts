import { NextRequest, NextResponse } from "next/server";
import { getMessages, sendMessage } from "@/actions/messaging-actions";
import { broadcastNewMessage } from "@/lib/message-broadcast";

export async function GET(
    request: NextRequest,
    {params}: {params: Promise<{conversationId: string}>}
) {
    try {
        const {conversationId} = await params;
        const messages = await getMessages(conversationId);
        return NextResponse.json({success: true, data: messages});
    } catch (error) {
        console.error("Error fetching messages:", error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "Failed to fetch messages",
            },
            {status: 500}
        );
    }
}

export async function POST(
    request: NextRequest,
    {params}: {params: Promise<{conversationId: string}>}
) {
    try {
        const {conversationId} = await params;
        const body = await request.json();
        const {content} = body;

        if (!content || typeof content !== "string") {
            return NextResponse.json(
                {success: false, error: "Message content is required"},
                {status: 400}
            );
        }

        const message = await sendMessage(conversationId, content);
        broadcastNewMessage({
          conversationId,
          message: {
            id: message.id,
            conversationId: message.conversationId,
            senderId: message.senderId,
            content: message.content,
            createdAt:
              message.createdAt instanceof Date
                ? message.createdAt.toISOString()
                : String(message.createdAt),
            read: message.read,
            sender: message.sender,
          },
        });
        return NextResponse.json({ success: true, data: message });
    } catch (error) {
        console.error("Error sending message:", error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "Failed to send message",
            },
            {status: 500}
        );
    }
}

