import nodemailer from "nodemailer";

// Create reusable transporter
const createTransporter = () => {
    // Check if all required SMTP environment variables are set
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT;
    const smtpUser = process.env.SMTP_USER;
    const smtpPassword = process.env.SMTP_PASSWORD;
    const smtpFrom = process.env.SMTP_FROM || smtpUser;

    // If SMTP is not configured, return null
    if (!smtpHost || !smtpPort || !smtpUser || !smtpPassword) {
        console.warn("[EMAIL] SMTP configuration missing. Emails will be logged to console only.");
        return null;
    }

    return nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(smtpPort, 10),
        secure: smtpPort === "465", // true for 465, false for other ports
        auth: {
            user: smtpUser,
            pass: smtpPassword,
        },
        // For development with services like Gmail, might need:
        // tls: {
        //     rejectUnauthorized: false
        // }
    });
};

export interface EmailOptions {
    to: string;
    subject: string;
    html: string;
    text?: string;
}

export async function sendEmail(options: EmailOptions): Promise<void> {
    const transporter = createTransporter();
    const smtpFrom = process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@unt-marketplace.com";

    // If transporter is null (SMTP not configured), log to console
    if (!transporter) {
        console.log("=".repeat(60));
        console.log("[EMAIL] Email would be sent (SMTP not configured):");
        console.log(`To: ${options.to}`);
        console.log(`Subject: ${options.subject}`);
        console.log(`From: ${smtpFrom}`);
        console.log("Body (HTML):");
        console.log(options.html);
        if (options.text) {
            console.log("Body (Text):");
            console.log(options.text);
        }
        console.log("=".repeat(60));
        return;
    }

    try {
        const info = await transporter.sendMail({
            from: smtpFrom,
            to: options.to,
            subject: options.subject,
            html: options.html,
            text: options.text || options.html.replace(/<[^>]*>/g, ""), // Strip HTML for text version
        });

        console.log("[EMAIL] Email sent successfully:", info.messageId);
    } catch (error) {
        console.error("[EMAIL] Error sending email:", error);
        throw error;
    }
}

// Email template for OTP verification
export function getOtpEmailTemplate(otp: string, type: "sign-in" | "email-verification" | "forget-password"): { subject: string; html: string; text: string } {
    const appName = "UNT Marketplace";
    const appUrl = process.env.APP_URL || "http://localhost:3000";

    let subject: string;
    let title: string;
    let description: string;

    switch (type) {
        case "sign-in":
            subject = "Your Sign-In Verification Code";
            title = "Sign-In Verification Code";
            description = "Use the code below to complete your sign-in:";
            break;
        case "email-verification":
            subject = "Verify Your Email Address - UNT Marketplace";
            title = "Verify Your Email Address";
            description = "Welcome to UNT Marketplace! Please verify your email address using the code below:";
            break;
        case "forget-password":
            subject = "Reset Your Password - UNT Marketplace";
            title = "Password Reset Code";
            description = "You requested to reset your password. Use the code below to proceed:";
            break;
    }

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subject}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #00853E; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 24px;">${appName}</h1>
    </div>
    <div style="background-color: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 8px 8px;">
        <h2 style="color: #00853E; margin-top: 0;">${title}</h2>
        <p>${description}</p>
        <div style="background-color: white; border: 2px dashed #00853E; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
            <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #00853E; font-family: 'Courier New', monospace;">
                ${otp}
            </div>
        </div>
        <p style="color: #666; font-size: 14px;">
            This code will expire in 5 minutes. If you didn't request this code, you can safely ignore this email.
        </p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
        <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
            This is an automated message from ${appName}. Please do not reply to this email.
        </p>
    </div>
</body>
</html>
    `.trim();

    const text = `
${appName}
${"=".repeat(appName.length)}

${title}

${description}

Your verification code is: ${otp}

This code will expire in 5 minutes. If you didn't request this code, you can safely ignore this email.

---
This is an automated message from ${appName}. Please do not reply to this email.
    `.trim();

    return { subject, html, text };
}

