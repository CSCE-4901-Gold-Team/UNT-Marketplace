import {NextRequest, NextResponse} from "next/server";
import {getOrCreateConversation} from "@/actions/messaging-actions";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {otherUserId, listingId} = body;

        if (!otherUserId || typeof otherUserId !== "string") {
            return NextResponse.json(
                {success: false, error: "otherUserId is required"},
                {status: 400}
            );
        }

        const conversation = await getOrCreateConversation(
            otherUserId,
            listingId || undefined
        );

        return NextResponse.json({success: true, data: conversation});
    } catch (error) {
        console.error("Error creating conversation:", error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "Failed to create conversation",
            },
            {status: 500}
        );
    }
}

