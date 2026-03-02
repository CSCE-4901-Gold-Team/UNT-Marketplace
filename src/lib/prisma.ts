/**
 * Prisma singleton client
 *
 * In development, Next.js hot-reload can create a new module evaluation on
 * every file change, which would keep opening new PrismaClient connections
 * and quickly exhaust the database connection pool.
 *
 * The pattern below stores a single PrismaClient instance on the Node.js
 * `globalThis` object so it survives module re-evaluations in development,
 * while in production (Vercel serverless) each Lambda only imports this
 * module once, so it effectively acts as a singleton per invocation.
 */

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

export const prisma =
    globalForPrisma.prisma ??
    new PrismaClient({
        log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    });

if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
}
