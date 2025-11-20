import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";


export const prisma = new PrismaClient({});

export async function PATCH(req: Request) {
    try {
        const session = await auth.api.getSession({ headers: (req as unknown as { headers: Headers }).headers });

        if (!session || !session.user) {
            return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
        }

        const body = await req.json();
        const { name, image } = body ?? {};

        if (!name || typeof name !== "string") {
            return NextResponse.json({ success: false, error: "Name is required" }, { status: 400 });
        }

        const userObj = session.user as unknown as { id?: string };
        const sessionObj = session as unknown as { userId?: string };
        const userId = userObj.id ?? sessionObj.userId;

        const updated = await prisma.user.update({
            where: { id: userId },
            data: {
                name: name.trim(),
                image: image ?? null,
            },
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
            },
        });

        return NextResponse.json({ success: true, user: updated });
    } catch (err) {
        console.error("/api/profile PATCH error:", err);
        const message = err instanceof Error ? err.message : String(err);
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
