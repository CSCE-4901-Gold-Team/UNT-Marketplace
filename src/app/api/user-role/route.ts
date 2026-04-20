import { NextRequest, NextResponse } from "next/server";
import { auth, prisma } from "@/lib/auth";
import { getSessionUserId } from "@/lib/session-utils";

export async function GET(request: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: request.headers
        });

        if (!session || !session.user) {
            return NextResponse.json({ role: null }, { status: 401 });
        }

        const userId = getSessionUserId(session);

        if (!userId) {
            return NextResponse.json({ role: null }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { role: true }
        });

        return NextResponse.json({ role: user?.role ?? null });
    } catch (error) {
        console.error("/api/user-role GET error:", error);
        return NextResponse.json({ role: null }, { status: 500 });
    }
}
