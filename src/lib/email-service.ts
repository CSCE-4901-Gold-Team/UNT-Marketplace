"use server";

import nodemailer from "nodemailer";

let transporter: any = null;

const getTransporter = () => {
    if (!transporter) {
        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || "587"),
            secure: process.env.SMTP_PORT === "465",
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASSWORD,
            },
            tls: {
                rejectUnauthorized: false,
            },
        });
    }
    return transporter;
};

export const sendPasswordResetEmail = async (email: string, url: string) => {
    console.log("Sending password reset to:", email);
    console.log("Reset URL:", url);
    try {
        const transporter = getTransporter();
        await transporter.sendMail({
            from: process.env.SMTP_FROM_EMAIL
                ? `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`
                : process.env.SMTP_USER,
            to: email,
            subject: "Reset your UNT Marketplace password",
            html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #3B9842;">Reset Your Password</h2>
              <p>You requested to reset your password. Click the link below to set a new password:</p>
              <a href="${url}" style="display: inline-block; padding: 10px 20px; background-color: #3B9842; color: white; text-decoration: none; border-radius: 4px;">Reset Password</a>
              <p style="margin-top: 20px;">If you didn't request a password reset, you can safely ignore this email.</p>
              <p style="margin-top: 20px;">This link will expire in 5 minutes.</p>
            </div>
          `,
        });
        console.log("Password reset email sent successfully");
    } catch (error) {
        console.error("Failed to send password reset email:", error);
    }
};

export const sendVerificationEmail = async (email: string, url: string) => {
    console.log("Sending email verification to:", email);
    console.log("Verification URL:", url);
    try {
        const transporter = getTransporter();
        await transporter.sendMail({
            from: process.env.SMTP_FROM_EMAIL
                ? `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`
                : process.env.SMTP_USER,
            to: email,
            subject: "Verify your UNT Marketplace account",
            html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #3B9842;">Welcome to UNT Marketplace!</h2>
              <p>Thank you for signing up. Please click the link below to verify your email address:</p>
              <a href="${url}" style="display: inline-block; padding: 10px 20px; background-color: #3B9842; color: white; text-decoration: none; border-radius: 4px;">Verify Email</a>
              <p style="margin-top: 20px;">If you didn't create an account, you can safely ignore this email.</p>
              <p style="margin-top: 20px;">This link will expire in 5 minutes.</p>
            </div>
          `,
        });
        console.log("Verification email sent successfully");
    } catch (error) {
        console.error("Failed to send verification email:", error);
    }
};
