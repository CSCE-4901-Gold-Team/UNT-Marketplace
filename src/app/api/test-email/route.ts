import { NextResponse } from "next/server";
import { testMailJetConnection, testMailJetEmail } from "../../../lib/test-mailjet-connection";

export async function POST() {
    // Test connection first
    const connectionSuccess = await testMailJetConnection();

    if (!connectionSuccess) {
        return NextResponse.json({
            success: false,
            message: "Failed to connect to MailJet. Check your credentials."
        }, { status: 500 });
    }

    // Test email sending
    const emailSuccess = await testMailJetEmail();

    if (emailSuccess) {
        return NextResponse.json({
            success: true,
            message: "Test email sent successfully!"
        });
    } else {
        return NextResponse.json({
            success: false,
            message: "Failed to send test email. Check your configuration."
        }, { status: 500 });
    }
}
