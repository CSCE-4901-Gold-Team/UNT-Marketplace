"use server";

import nodemailer from "nodemailer";

let transporter: any = null;

/**
 * Initialize Nodemailer transporter with Gmail SMTP configuration
 * Supports both App Passwords (recommended) and Less Secure App Passwords
 */
const getTransporter = () => {
    if (!transporter) {
        // Validate required environment variables
        if (!process.env.SMTP_HOST) {
            throw new Error("SMTP_HOST environment variable is not set");
        }
        if (!process.env.SMTP_USER) {
            throw new Error("SMTP_USER environment variable is not set");
        }
        if (!process.env.SMTP_PASSWORD) {
            throw new Error("SMTP_PASSWORD environment variable is not set");
        }

        console.log("📧 Initializing email transporter with:", {
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT || "587",
            secure: process.env.SMTP_PORT === "465",
            user: process.env.SMTP_USER,
        });

        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || "587"),
            secure: process.env.SMTP_PORT === "465", // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASSWORD,
            },
            // For Gmail, disable strict TLS certificate validation
            tls: {
                rejectUnauthorized: false,
                minVersion: "TLSv1.2",
            },
            // Increase timeouts significantly for Gmail's slower SMTP
            // Gmail can take 15-45+ seconds to establish connection
            connectionTimeout: 60000, // 60 seconds
            socketTimeout: 60000, // 60 seconds
            greetingTimeout: 60000, // 60 seconds
            pool: {
                maxConnections: 5,
                maxMessages: 100,
                rateDelta: 20000, // throttle emails
                rateLimit: 5, // max 5 emails per rateDelta
            },
        });
    }
    return transporter;
};

/**
 * Test the email connection to verify Gmail credentials are working
 * Useful for debugging connection issues
 */
export const testEmailConnection = async () => {
    try {
        const transporter = getTransporter();
        console.log("🧪 Testing email connection...");
        await transporter.verify();
        console.log("✅ Email service connection successful");
        return { success: true, message: "Email service is connected" };
    } catch (error) {
        console.error("❌ Email service connection failed:", error);
        return {
            success: false,
            message: error instanceof Error ? error.message : "Unknown error",
        };
    }
};

/**
 * Retry utility for handling transient failures
 * With longer delays and more attempts for Gmail SMTP
 */
const retryWithBackoff = async <T>(
    fn: () => Promise<T>,
    retries = 5,
    delay = 2000
): Promise<T> => {
    let lastError: Error | undefined;

    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
            const isTransient =
                lastError.message.includes("ETIMEDOUT") ||
                lastError.message.includes("ECONNREFUSED") ||
                lastError.message.includes("Timeout") ||
                lastError.message.includes("connection") ||
                lastError.message.includes("EHOSTUNREACH");

            if (!isTransient || i === retries - 1) {
                throw lastError;
            }

            const waitTime = delay * Math.pow(2, i);
            console.log(`⏳ Retry attempt ${i + 1}/${retries} after ${waitTime}ms due to: ${lastError.message}`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
    }

    throw lastError || new Error("Unknown error");
};

export const sendPasswordResetEmail = async (email: string, url: string) => {
    console.log("📧 Sending password reset to:", email);
    try {
        await retryWithBackoff(async () => {
            const transporter = getTransporter();
            const info = await transporter.sendMail({
                from: process.env.SMTP_FROM_EMAIL
                    ? `"${process.env.SMTP_FROM_NAME || "UNT Marketplace"}" <${process.env.SMTP_FROM_EMAIL}>`
                    : process.env.SMTP_USER,
                to: email,
                subject: "Reset your UNT Marketplace password",
                html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h2 style="color: #3B9842; margin: 0;">Reset Your Password</h2>
              </div>
              <p style="color: #333; line-height: 1.6;">You requested to reset your password. Click the button below to set a new password:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${url}" style="display: inline-block; padding: 12px 30px; background-color: #3B9842; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">Reset Password</a>
              </div>
              <p style="color: #666; font-size: 14px;">Or copy and paste this link in your browser:</p>
              <p style="color: #666; font-size: 12px; word-break: break-all;">${url}</p>
              <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
              <p style="color: #999; font-size: 12px; margin: 10px 0;">If you didn't request a password reset, you can safely ignore this email.</p>
              <p style="color: #999; font-size: 12px; margin: 10px 0;">⏱️ This link will expire in 5 minutes.</p>
            </div>
          `,
                text: `You requested to reset your password. Visit this link to set a new password: ${url}\n\nThis link will expire in 5 minutes.`,
            });
            console.log("✅ Password reset email sent successfully (ID:", info.messageId, ")");
            return { success: true, messageId: info.messageId };
        });
        return { success: true };
    } catch (error) {
        console.error("❌ Failed to send password reset email after retries:", error);
        // Don't throw - allow the password reset flow to continue
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
};

export const sendVerificationEmail = async (email: string, url: string) => {
    console.log("📧 Sending email verification to:", email);
    console.log("🔗 Verification URL:", url);
    try {
        await retryWithBackoff(async () => {
            const transporter = getTransporter();
            console.log("📧 Transporter initialized, sending email...");

            const info = await transporter.sendMail({
                from: process.env.SMTP_FROM_EMAIL
                    ? `"${process.env.SMTP_FROM_NAME || "UNT Marketplace"}" <${process.env.SMTP_FROM_EMAIL}>`
                    : process.env.SMTP_USER,
                to: email,
                subject: "Verify your UNT Marketplace account",
                html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h2 style="color: #3B9842; margin: 0;">Welcome to UNT Marketplace!</h2>
              </div>
              <p style="color: #333; line-height: 1.6;">Thank you for signing up. Please click the button below to verify your email address:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${url}" style="display: inline-block; padding: 12px 30px; background-color: #3B9842; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">Verify Email</a>
              </div>
              <p style="color: #666; font-size: 14px;">Or copy and paste this link in your browser:</p>
              <p style="color: #666; font-size: 12px; word-break: break-all;">${url}</p>
              <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
              <p style="color: #999; font-size: 12px; margin: 10px 0;">If you didn't create an account, you can safely ignore this email.</p>
              <p style="color: #999; font-size: 12px; margin: 10px 0;">⏱️ This link will expire in 5 minutes.</p>
            </div>
          `,
                text: `Welcome to UNT Marketplace! Click this link to verify your email: ${url}\n\nThis link will expire in 5 minutes.`,
            });
            console.log("✅ Verification email sent successfully (ID:", info.messageId, ")");
            return { success: true, messageId: info.messageId };
        });
        return { success: true };
    } catch (error) {
        console.error("❌ Failed to send verification email after retries:", error);
        console.error("📧 Email configuration diagnostic:");
        console.error("  - SMTP_HOST:", process.env.SMTP_HOST ? "✅ Set" : "❌ Missing");
        console.error("  - SMTP_USER:", process.env.SMTP_USER ? "✅ Set" : "❌ Missing");
        console.error("  - SMTP_PASSWORD:", process.env.SMTP_PASSWORD ? "✅ Set" : "❌ Missing");
        console.error("  - SMTP_FROM_EMAIL:", process.env.SMTP_FROM_EMAIL ? "✅ Set" : "❌ Missing");
        console.error("  - Error type:", error instanceof Error ? error.constructor.name : typeof error);
        console.error("  - Error message:", error instanceof Error ? error.message : String(error));
        // Don't throw - allow registration to continue even if email fails
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
};
