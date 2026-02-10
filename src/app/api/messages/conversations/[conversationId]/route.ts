import {NextRequest, NextResponse} from "next/server";
import {getConversation} from "@/actions/messaging-actions";

export async function GET(
    request: NextRequest,
    {params}: {params: Promise<{conversationId: string}>}
) {
    try {
        const {conversationId} = await params;
        const conversation = await getConversation(conversationId);
        return NextResponse.json({success: true, data: conversation});
    } catch (error) {
        console.error("Error fetching conversation:", error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "Failed to fetch conversation",
            },
            {status: 500}
        );
    }
}

