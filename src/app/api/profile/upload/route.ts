import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import fs from "fs";
import path from "path";

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
  const originalName = f.name || "upload";
  const ext = path.extname(originalName) || "";
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;

  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await fs.promises.mkdir(uploadDir, { recursive: true });

  const arrayBuffer = await f.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

    const dest = path.join(uploadDir, filename);
    await fs.promises.writeFile(dest, buffer);

    const url = `/uploads/${filename}`;
    return NextResponse.json({ success: true, url });
  } catch (err) {
    console.error("/api/profile/upload error:", err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
