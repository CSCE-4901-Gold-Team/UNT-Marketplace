import {NextRequest, NextResponse} from "next/server";
import {getConversations} from "@/actions/messaging-actions";

export async function GET(request: NextRequest) {
    try {
        const conversations = await getConversations();
        return NextResponse.json({success: true, data: conversations});
    } catch (error) {
        console.error("Error fetching conversations:", error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "Failed to fetch conversations",
            },
            {status: 500}
        );
    }
}

