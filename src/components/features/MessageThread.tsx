"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useMessagesWs } from "@/lib/messages-ws-context";

interface Message {
  id: string;
  content: string;
  senderId: string;
  sender: {
    id: string;
    name: string;
    image: string | null;
  };
  createdAt: string;
  read: boolean;
}

interface MessageThreadProps {
  conversationId: string;
  currentUserId: string;
}

export default function MessageThread({
  conversationId,
  currentUserId,
}: MessageThreadProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const {
    subscribe,
    unsubscribe,
    setNewMessageHandler,
    registerRefetchMessages,
  } = useMessagesWs();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchMessages = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/messages/conversations/${conversationId}/messages`
      );
      const data = await response.json();
      if (data.success) {
        setMessages(data.data);
        setTimeout(scrollToBottom, 100);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    subscribe(conversationId);
    setNewMessageHandler((convId, rawMessage) => {
      if (convId !== conversationId) return;
      const message = rawMessage as Message;
      setMessages((prev) => [...prev, message]);
      setTimeout(scrollToBottom, 50);
    });
    return () => {
      unsubscribe(conversationId);
      setNewMessageHandler(null);
    };
  }, [conversationId, subscribe, unsubscribe, setNewMessageHandler]);

  useEffect(() => {
    const interval = setInterval(fetchMessages, 2500);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  useEffect(() => {
    registerRefetchMessages(fetchMessages);
    return () => registerRefetchMessages(null);
  }, [registerRefetchMessages, fetchMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
        );
    }

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
        });
    };

    return (
        <div className="flex flex-col h-full overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                    <p>No messages yet. Start the conversation!</p>
                </div>
            ) : (
                messages.map((message) => {
                    const isOwnMessage = message.senderId === currentUserId;

                    return (
                        <div
                            key={message.id}
                            className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                        >
                            <div
                                className={`flex gap-2 max-w-[70%] ${
                                    isOwnMessage ? "flex-row-reverse" : "flex-row"
                                }`}
                            >
                                {!isOwnMessage && (
                                    <div className="flex-shrink-0">
                                        {message.sender.image ? (
                                            <img
                                                src={message.sender.image}
                                                alt={message.sender.name}
                                                className="w-8 h-8 rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white text-xs font-semibold">
                                                {message.sender.name.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                )}
                                <div
                                    className={`rounded-lg px-4 py-2 ${
                                        isOwnMessage
                                            ? "bg-green-600 text-white"
                                            : "bg-white text-gray-900 border border-gray-200"
                                    }`}
                                >
                                    {!isOwnMessage && (
                                        <p className="text-xs font-semibold mb-1 opacity-75">
                                            {message.sender.name}
                                        </p>
                                    )}
                                    <p className="text-sm whitespace-pre-wrap break-words">
                                        {message.content}
                                    </p>
                                    <p
                                        className={`text-xs mt-1 ${
                                            isOwnMessage ? "text-green-100" : "text-gray-500"
                                        }`}
                                    >
                                        {formatTime(message.createdAt)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    );
                })
            )}
            <div ref={messagesEndRef} />
        </div>
    );
}

