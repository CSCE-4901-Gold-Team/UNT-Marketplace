import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        const email = request.nextUrl.searchParams.get("email");
        if (!email || typeof email !== "string") {
            return NextResponse.json(
                { success: false, error: "Email is required" },
                { status: 400 }
            );
        }

        const normalized = email.trim().toLowerCase();
        if (!normalized) {
            return NextResponse.json(
                { success: false, error: "User not found or cannot message this user" },
                { status: 404 }
            );
        }

        const user = await prisma.user.findFirst({
            where: { email: { equals: normalized, mode: "insensitive" } },
            select: { id: true, name: true, image: true },
        });

        if (!user || user.id === session.user.id) {
            return NextResponse.json(
                { success: false, error: "User not found or cannot message this user" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: { id: user.id, name: user.name, image: user.image },
        });
    } catch (error) {
        console.error("Error looking up user:", error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "Lookup failed",
            },
            { status: 500 }
        );
    }
}
