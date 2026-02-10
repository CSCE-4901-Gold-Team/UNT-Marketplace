/**
 * Custom Next.js server with WebSocket support on the same HTTP server.
 * Run with: npx tsx server.ts (dev) or NODE_ENV=production npx tsx server.ts (prod)
 *
 * WebSocket endpoint: ws://localhost:3000/ws (or wss:// when using HTTPS)
 */

import next from "next";
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { getSessionFromRequest } from "./src/lib/ws-auth";
import { canUserAccessConversation } from "./src/lib/conversation-access";
import { onNewMessage } from "./src/lib/message-broadcast";

const dev = process.env.NODE_ENV !== "production";
const port = parseInt(process.env.PORT || "3000", 10);

const server = createServer();
const app = next({
  dev,
  dir: __dirname,
  turbopack: dev,
  httpServer: server,
});
const handle = app.getRequestHandler();

// conversationId -> Set of WebSocket clients subscribed to that conversation
const conversationSubscribers = new Map<string, Set<WebSocket>>();

app.prepare().then(() => {
  server.on("request", (req, res) => handle(req, res));

  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (request, socket, head) => {
    if (!request.url?.startsWith("/ws")) {
      return;
    }

    getSessionFromRequest(request)
      .then((session) => {
        if (!session) {
          socket.destroy();
          return;
        }
        const userId = session.user.id;

        wss.handleUpgrade(request, socket, head, (ws: WebSocket) => {
          wss.emit("connection", ws, request);

          ws.on("message", (data: Buffer) => {
            try {
              const msg = JSON.parse(data.toString());
              if (msg.type === "subscribe" && typeof msg.conversationId === "string") {
                canUserAccessConversation(userId, msg.conversationId).then(
                  (allowed) => {
                    if (allowed) {
                      if (!conversationSubscribers.has(msg.conversationId)) {
                        conversationSubscribers.set(
                          msg.conversationId,
                          new Set()
                        );
                      }
                      conversationSubscribers.get(msg.conversationId)!.add(ws);
                    }
                  }
                );
              } else if (
                msg.type === "unsubscribe" &&
                typeof msg.conversationId === "string"
              ) {
                conversationSubscribers.get(msg.conversationId)?.delete(ws);
              }
            } catch {
              // ignore invalid JSON
            }
          });

          ws.on("close", () => {
            conversationSubscribers.forEach((set) => set.delete(ws));
          });
        });
      })
      .catch(() => socket.destroy());
  });

  onNewMessage(({ conversationId, message }) => {
    const subs = conversationSubscribers.get(conversationId);
    if (subs) {
      const payload = JSON.stringify({
        type: "new_message",
        conversationId,
        message,
      });
      subs.forEach((ws) => {
        if (ws.readyState === 1) ws.send(payload);
      });
    }
    // Notify all connected clients so conversation list can refresh
    const listPayload = JSON.stringify({
      type: "conversation_updated",
      conversationId,
    });
    wss.clients.forEach((client) => {
      if (client.readyState === 1) client.send(listPayload);
    });
  });

  server.listen(port, () => {
    console.log(
      `> Ready on http://localhost:${port} (${dev ? "development" : "production"})`
    );
    console.log(`> WebSocket: ws://localhost:${port}/ws`);
  });
});
