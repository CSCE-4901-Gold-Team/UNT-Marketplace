import { IncomingMessage } from "http";
import { auth } from "@/lib/auth";

/**
 * Get session from a raw Node HTTP request (e.g. WebSocket upgrade).
 * Used by the custom server to authenticate WebSocket connections.
 */
export async function getSessionFromRequest(
  request: IncomingMessage
): Promise<{ user: { id: string; name: string; image: string | null } } | null> {
  const headers = new Headers();
  for (const [key, value] of Object.entries(request.headers)) {
    if (value !== undefined) {
      headers.set(key, Array.isArray(value) ? value.join(", ") : value);
    }
  }

  const session = await auth.api.getSession({ headers });
  return session;
}
