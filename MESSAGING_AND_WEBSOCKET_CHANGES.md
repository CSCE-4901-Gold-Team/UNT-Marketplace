# Files Altered for Messaging + WebSocket Implementation

All files that were **created** or **modified** for the chat/direct-message feature and the WebSocket real-time implementation.

---

## 1. Database & schema

| File | Change |
|------|--------|
| **prisma/schema.prisma** | **Modified.** Added `Conversation` and `Message` models; added relations on `User` (`conversationsAsUser1`, `conversationsAsUser2`, `messages`) and `Listing` (`conversations`). |

---

## 2. Server / app entry

| File | Change |
|------|--------|
| **server.ts** (project root) | **Created.** Custom Next.js server that runs the app and a WebSocket server on the same HTTP server. Handles `/ws` upgrades, session auth, subscribe/unsubscribe by conversation, and broadcasts new messages and conversation updates. |

---

## 3. Package and scripts

| File | Change |
|------|--------|
| **package.json** | **Modified.** Added dependencies: `ws`, `@types/ws`, `cross-env`. Added scripts: `dev` (tsx server.ts), `dev:next`, `start` (production custom server), `start:next`. |

---

## 4. Backend: messaging actions and API

| File | Change |
|------|--------|
| **src/actions/messaging-actions.ts** | **Created.** Server actions: `getOrCreateConversation`, `getConversations`, `getMessages`, `sendMessage`, `getConversation` (all use session and Prisma). |
| **src/app/api/messages/conversations/route.ts** | **Created.** GET handler that returns the current user’s conversations. |
| **src/app/api/messages/conversations/[conversationId]/route.ts** | **Created.** GET handler that returns a single conversation by ID. |
| **src/app/api/messages/conversations/[conversationId]/messages/route.ts** | **Created.** GET messages for a conversation; POST to send a message. **Modified** to call `broadcastNewMessage` after saving a message so WebSocket clients get real-time updates. |
| **src/app/api/messages/create/route.ts** | **Created.** POST handler to get-or-create a conversation (by other user and optional listing). |

---

## 5. Backend: WebSocket and broadcast

| File | Change |
|------|--------|
| **src/lib/message-broadcast.ts** | **Created.** In-memory `EventEmitter` used to notify the WebSocket server when a new message is saved. Exports `broadcastNewMessage` and `onNewMessage`. |
| **src/lib/conversation-access.ts** | **Created.** `canUserAccessConversation(userId, conversationId)` – Prisma check used by the WebSocket server to allow subscribe only for participants. |
| **src/lib/ws-auth.ts** | **Created.** `getSessionFromRequest(request)` – builds headers from the Node HTTP request and uses `auth.api.getSession` to authenticate WebSocket connections. |

---

## 6. Frontend: WebSocket client

| File | Change |
|------|--------|
| **src/lib/messages-ws-context.tsx** | **Created.** React context and provider: single WebSocket to `/ws`, `subscribe`/`unsubscribe` by conversation, `setNewMessageHandler` and `setConversationUpdatedHandler` for real-time UI updates. |

---

## 7. Frontend: messaging UI

| File | Change |
|------|--------|
| **src/components/features/ConversationList.tsx** | **Created.** Renders the list of conversations (other user, listing, last message, unread). **Modified** to use `useMessagesWs` and `setConversationUpdatedHandler` instead of polling. |
| **src/components/features/MessageThread.tsx** | **Created.** Renders messages for one conversation. **Modified** to use `useMessagesWs`, `subscribe`/`unsubscribe`, and `setNewMessageHandler` instead of polling. |
| **src/components/features/MessageInput.tsx** | **Created.** Text input and send button; POSTs to the messages API (new messages then arrive via WebSocket). |
| **src/components/features/MessagesClient.tsx** | **Created.** Main messages layout: conversation list + thread + input. **Modified** to wrap content in `MessagesWsProvider`. |
| **src/components/features/ListingDetailClient.tsx** | **Created.** Listing detail page with “Message Seller” button that creates a conversation and navigates to messages. |

---

## 8. App routes (pages)

| File | Change |
|------|--------|
| **src/app/market/layout.tsx** | **Modified.** Added “Messages” sidebar link (with icon) pointing to `/market/messages`. |
| **src/app/market/messages/page.tsx** | **Created.** Messages page; loads session and renders `MessagesClient`. |
| **src/app/market/messages/[conversationId]/page.tsx** | **Created.** Single-conversation page; passes `conversationId` into `MessagesClient`. |
| **src/app/market/listing/[listingId]/page.tsx** | **Created.** Listing detail page; loads listing and owner, renders `ListingDetailClient` with “Message Seller”. |

---

## Summary

- **Created:** 18 files (server, API routes, actions, libs, components, pages).
- **Modified:** 4 files (prisma schema, package.json, messages POST route, market layout).
- **Total:** 22 files involved in messaging and WebSocket behavior.

All of these files are included in the zip **messaging-websocket-changes.zip** in the project root. The zip preserves the same folder structure as the project (e.g. `src/app/api/messages/...`, `src/lib/...`).
