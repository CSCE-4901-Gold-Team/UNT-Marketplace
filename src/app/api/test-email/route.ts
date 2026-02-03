import { testEmailConnection, sendVerificationEmail } from "@/lib/email-service";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        const testResult = await testEmailConnection();
        return NextResponse.json({
            success: testResult.success,
            message: testResult.message,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error("Test email failed:", error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
                timestamp: new Date().toISOString(),
            },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, url } = body;

        if (!email || !url) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Missing email or url in request body",
                },
                { status: 400 }
            );
        }

        console.log("🧪 Test email verification - Starting");
        const result = await sendVerificationEmail(email, url);
        console.log("🧪 Test email verification - Result:", result);

        return NextResponse.json({
            success: result.success,
            messageId: result.messageId,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error("🧪 Test email verification failed:", error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
                details: error instanceof Error ? error.stack : undefined,
                timestamp: new Date().toISOString(),
            },
            { status: 500 }
        );
    }
}
