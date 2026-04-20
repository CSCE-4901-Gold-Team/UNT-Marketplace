import { auth } from "@/lib/auth";

export function getSessionUserId(
    session: Awaited<ReturnType<typeof auth.api.getSession>> | null
): string | null {
    if (!session?.user) return null;
    const userObj = session.user as unknown as { id?: string };
    const sessionObj = session as unknown as { userId?: string };
    return userObj.id ?? sessionObj.userId ?? null;
}
