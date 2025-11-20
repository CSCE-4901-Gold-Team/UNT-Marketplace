import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { PrismaClient } from "@/generated/prisma";
import { ALLOWED_EMAIL_DOMAINS } from "@/constants/AuthConfig";
import nodemailer from "nodemailer";

const prisma = new PrismaClient();

// ---------------------------
// Email Transporter
// ---------------------------
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_PORT === "465",
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
    },
    tls: { rejectUnauthorized: false },
});

// ---------------------------
// BetterAuth Configuration
// ---------------------------
export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),

    // ---------------------------
    // Email + Password Auth
    // ---------------------------
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: true,

        // Domain validation
        validateEmail: async (email: string) => {
            const domain = email.split("@")[1];
            if (!ALLOWED_EMAIL_DOMAINS.includes(domain)) {
                return {
                    valid: false,
                    error: `Only ${ALLOWED_EMAIL_DOMAINS.join(" or ")} email addresses are allowed`,
                };
            }
            return { valid: true };
        },

        // Password Reset Email
        sendResetPassword: async ({ user, url }) => {
            console.log("Sending password reset to:", user.email);
            console.log("Reset URL:", url);

            try {
                await transporter.sendMail({
                    from: process.env.SMTP_FROM_EMAIL
                        ? `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`
                        : process.env.SMTP_USER,
                    to: user.email,
                    subject: "Reset your UNT Marketplace password",
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                            <h2 style="color: #3B9842;">Reset Your Password</h2>
                            <p>You requested a password reset. Click the link below to continue:</p>
                            <a href="${url}" style="display: inline-block; padding: 10px 20px; background-color: #3B9842; color: white; text-decoration: none; border-radius: 4px;">Reset Password</a>
                            <p style="margin-top: 20px;">If you didn't request this, ignore this message.</p>
                            <p style="margin-top: 20px;">This link expires in 5 minutes.</p>
                        </div>
                    `,
                });
                console.log("Password reset email sent successfully");
            } catch (error) {
                console.error("Failed to send password reset email:", error);
            }
        },
    },

    // ---------------------------
    // Email Verification
    // ---------------------------
    emailVerification: {
        sendOnSignUp: true,
        expiresIn: 300, // 5 minutes

        sendVerificationEmail: async ({ user, url }) => {
            console.log("Sending verification email to:", user.email);
            console.log("Verification URL:", url);

            try {
                await transporter.sendMail({
                    from: process.env.SMTP_FROM_EMAIL
                        ? `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`
                        : process.env.SMTP_USER,
                    to: user.email,
                    subject: "Verify your UNT Marketplace account",
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                            <h2 style="color: #3B9842;">Welcome to UNT Marketplace!</h2>
                            <p>Please verify your email address:</p>
                            <a href="${url}" style="display: inline-block; padding: 10px 20px; background-color: #3B9842; color: white; text-decoration: none; border-radius: 4px;">Verify Email</a>
                            <p style="margin-top: 20px;">This link expires in 5 minutes.</p>
                        </div>
                    `,
                });
                console.log("Verification email sent successfully");
            } catch (error) {
                console.error("Failed to send verification email:", error);
            }
        },
    },

    // ---------------------------
    // Session
    // ---------------------------
    session: {
        expiresIn: 60 * 60 * 24 * 7, // 7 days
        updateAge: 60 * 60 * 24, // 1 day
    },

    // ---------------------------
    // Plugins
    // ---------------------------
    plugins: [nextCookies()],
});

// Export allowed domains if needed
export const ALLOWED_UNT_DOMAINS = ["my.unt.edu", "unt.edu"];
