import { NextResponse } from "next/server";
import { auth, prisma } from "@/lib/auth";
import { imageAdapter } from "@/lib/image-adapter";
import { ImageUtils } from "@/utils/ImageUtils";

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

        // Fetch current image to check for cleanup
        const existing = await prisma.user.findUnique({
            where: { id: userId },
            select: { image: true },
        });

        const newImage = image?.trim() || null;

        // Update both name and image
        const updated = await prisma.user.update({
            where: { id: userId },
            data: {
                name: name.trim(),
                image: newImage,
            },
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
            },
        });

        // Delete old profile file if it was a local upload and changed
        if (
            existing?.image &&
            ImageUtils.isLocalFile(existing.image) &&
            existing.image !== newImage
        ) {
            await imageAdapter.deleteFile(existing.image);
        }

        return NextResponse.json({ success: true, user: updated });
    } catch (err) {
        console.error("/api/profile PATCH error:", err);
        const message = err instanceof Error ? err.message : String(err);
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
