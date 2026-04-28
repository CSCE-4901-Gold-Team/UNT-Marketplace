import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { imageAdapter } from "@/lib/image-adapter";

export async function POST(req: Request) {
  try {
    // Validate session
    const session = await auth.api.getSession({ headers: (req as unknown as { headers: Headers }).headers });
    if (!session || !session.user) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
    }

    const form = await req.formData();
    const file = form.get("file") as unknown as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
    }

    const f = file as unknown as { name?: string; arrayBuffer: () => Promise<ArrayBuffer> };
    const buffer = Buffer.from(await f.arrayBuffer());

    const url = await imageAdapter.saveFromBuffer(buffer, f.name || "upload.jpg", {
      type: "profile",
    });

    return NextResponse.json({ success: true, url });
  } catch (err) {
    console.error("/api/profile/upload error:", err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
