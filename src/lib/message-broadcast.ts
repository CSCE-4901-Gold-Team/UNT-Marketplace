import { EventEmitter } from "events";

export interface BroadcastMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
  read: boolean;
  sender: {
    id: string;
    name: string;
    image: string | null;
  };
}

const messageBroadcast = new EventEmitter();
messageBroadcast.setMaxListeners(50);

/**
 * Emit a new message so WebSocket server can broadcast to subscribed clients.
 * Called from the POST /api/messages/... route after saving a message.
 */
export function broadcastNewMessage(payload: {
  conversationId: string;
  message: BroadcastMessage;
}) {
  messageBroadcast.emit("message", payload);
}

/**
 * Subscribe to new message events. Used by the WebSocket server.
 */
export function onNewMessage(
  handler: (payload: { conversationId: string; message: BroadcastMessage }) => void
) {
  messageBroadcast.on("message", handler);
  return () => messageBroadcast.off("message", handler);
}
