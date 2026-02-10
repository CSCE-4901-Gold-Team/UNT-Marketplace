"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

type ConnectionStatus = "connecting" | "connected" | "disconnected";

interface MessagesWsContextValue {
  connectionStatus: ConnectionStatus;
  subscribe: (conversationId: string) => void;
  unsubscribe: (conversationId: string) => void;
  setNewMessageHandler: (
    handler: ((conversationId: string, message: unknown) => void) | null
  ) => void;
  setConversationUpdatedHandler: (handler: (() => void) | null) => void;
  registerRefetchMessages: (fn: (() => void) | null) => void;
  triggerRefetchMessages: () => void;
}

const MessagesWsContext = createContext<MessagesWsContextValue | null>(null);

function getWsUrl(): string {
  if (typeof window === "undefined") return "";
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}/ws`;
}

export function MessagesWsProvider({ children }: { children: React.ReactNode }) {
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("disconnected");
  const wsRef = useRef<WebSocket | null>(null);
  const subscribedConversationRef = useRef<string | null>(null);
  const newMessageHandlerRef = useRef<((conversationId: string, message: unknown) => void) | null>(null);
  const conversationUpdatedHandlerRef = useRef<(() => void) | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const refetchMessagesRef = useRef<(() => void) | null>(null);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    const url = getWsUrl();
    if (!url) return;
    setConnectionStatus("connecting");
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => setConnectionStatus("connected");
    ws.onclose = () => {
      setConnectionStatus("disconnected");
      wsRef.current = null;
      // Reconnect after 3s if we had a subscription (user likely still on messages page)
      reconnectTimeoutRef.current = setTimeout(() => {
        if (subscribedConversationRef.current) connect();
      }, 3000);
    };
    ws.onerror = () => {};
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data as string);
        if (data.type === "new_message") {
          newMessageHandlerRef.current?.(data.conversationId, data.message);
        } else if (data.type === "conversation_updated") {
          conversationUpdatedHandlerRef.current?.();
        }
      } catch {
        // ignore invalid JSON
      }
    };
  }, []);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setConnectionStatus("disconnected");
    subscribedConversationRef.current = null;
  }, []);

  const sendWhenOpen = useCallback((payload: string) => {
    const ws = wsRef.current;
    if (ws?.readyState === WebSocket.OPEN) {
      try {
        ws.send(payload);
      } catch {
        // ignore if closed in the meantime
      }
    } else if (ws?.readyState === WebSocket.CONNECTING) {
      ws.addEventListener(
        "open",
        () => {
          if (ws.readyState === WebSocket.OPEN) {
            try {
              ws.send(payload);
            } catch {
              // ignore
            }
          }
        },
        { once: true }
      );
    }
  }, []);

  const subscribe = useCallback((conversationId: string) => {
    if (subscribedConversationRef.current === conversationId) return;
    if (subscribedConversationRef.current) {
      sendWhenOpen(
        JSON.stringify({
          type: "unsubscribe",
          conversationId: subscribedConversationRef.current,
        })
      );
    }
    subscribedConversationRef.current = conversationId;
    connect();
    sendWhenOpen(JSON.stringify({ type: "subscribe", conversationId }));
  }, [connect, sendWhenOpen]);

  const unsubscribe = useCallback((conversationId: string) => {
    if (subscribedConversationRef.current === conversationId) {
      sendWhenOpen(
        JSON.stringify({ type: "unsubscribe", conversationId })
      );
      subscribedConversationRef.current = null;
    }
  }, [sendWhenOpen]);

  const setNewMessageHandler = useCallback(
    (handler: ((conversationId: string, message: unknown) => void) | null) => {
      newMessageHandlerRef.current = handler;
    },
    []
  );
  const setConversationUpdatedHandler = useCallback(
    (handler: (() => void) | null) => {
      conversationUpdatedHandlerRef.current = handler;
    },
    []
  );

  const registerRefetchMessages = useCallback((fn: (() => void) | null) => {
    refetchMessagesRef.current = fn;
  }, []);
  const triggerRefetchMessages = useCallback(() => {
    refetchMessagesRef.current?.();
  }, []);

  // Connect when provider mounts (user is on messages page), disconnect on unmount
  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  const value: MessagesWsContextValue = {
    connectionStatus,
    subscribe,
    unsubscribe,
    setNewMessageHandler,
    setConversationUpdatedHandler,
    registerRefetchMessages,
    triggerRefetchMessages,
  };

  return (
    <MessagesWsContext.Provider value={value}>
      {children}
    </MessagesWsContext.Provider>
  );
}

export function useMessagesWs() {
  const ctx = useContext(MessagesWsContext);
  if (!ctx) {
    throw new Error("useMessagesWs must be used within MessagesWsProvider");
  }
  return ctx;
}
