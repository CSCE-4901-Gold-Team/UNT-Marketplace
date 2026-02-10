"use client";

import React, { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useMessagesWs } from "@/lib/messages-ws-context";

interface Conversation {
    id: string;
    otherUser: {
        id: string;
        name: string;
        image: string | null;
    };
    listing: {
        id: string;
        title: string;
        price: number;
        images: Array<{url: string}>;
    } | null;
    lastMessage: {
        content: string;
        sender: {
            id: string;
            name: string;
        };
        createdAt: string;
    } | null;
    unreadCount: number;
    updatedAt: string;
}

interface ConversationListProps {
    onConversationSelect?: (conversationId: string) => void;
}

export default function ConversationList({
  onConversationSelect,
}: ConversationListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const { setConversationUpdatedHandler } = useMessagesWs();

  const fetchConversations = useCallback(async () => {
    try {
      const response = await fetch("/api/messages/conversations");
      const data = await response.json();
      if (data.success) {
        setConversations(data.data);
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    setConversationUpdatedHandler(fetchConversations);
    return () => setConversationUpdatedHandler(null);
  }, [fetchConversations, setConversationUpdatedHandler]);

  useEffect(() => {
    const interval = setInterval(fetchConversations, 5000);
    return () => clearInterval(interval);
  }, [fetchConversations]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
        );
    }

    if (conversations.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    className="w-12 h-12 mb-4"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155"
                    />
                </svg>
                <p className="text-center">No conversations yet</p>
                <p className="text-sm text-center mt-2">Start a conversation from a listing!</p>
            </div>
        );
    }

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return "Just now";
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className="flex flex-col h-full overflow-y-auto">
            {conversations.map((conversation) => {
                const isActive = pathname?.includes(conversation.id);
                const listingImage = conversation.listing?.images[0]?.url;

                return (
                    <div
                        key={conversation.id}
                        onClick={() => {
                            if (onConversationSelect) {
                                onConversationSelect(conversation.id);
                            }
                        }}
                        className={`flex gap-3 p-4 border-b border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer ${
                            isActive ? "bg-green-50 border-l-4 border-l-green-600" : ""
                        }`}
                    >
                        <div className="flex-shrink-0">
                            {conversation.otherUser.image ? (
                                <img
                                    src={conversation.otherUser.image}
                                    alt={conversation.otherUser.name}
                                    className="w-12 h-12 rounded-full object-cover"
                                />
                            ) : (
                                <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center text-white font-semibold">
                                    {conversation.otherUser.name.charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                                <h3 className="font-semibold text-gray-900 truncate">
                                    {conversation.otherUser.name}
                                </h3>
                                {conversation.unreadCount > 0 && (
                                    <span className="bg-green-600 text-white text-xs font-semibold px-2 py-1 rounded-full">
                                        {conversation.unreadCount}
                                    </span>
                                )}
                            </div>
                            {conversation.listing && (
                                <p className="text-sm text-gray-600 truncate mb-1">
                                    {conversation.listing.title}
                                </p>
                            )}
                            {conversation.lastMessage && (
                                <div className="flex items-center justify-between">
                                    <p className="text-sm text-gray-500 truncate">
                                        {conversation.lastMessage.sender.id === conversation.otherUser.id
                                            ? ""
                                            : "You: "}
                                        {conversation.lastMessage.content}
                                    </p>
                                    <span className="text-xs text-gray-400 ml-2 flex-shrink-0">
                                        {formatTime(conversation.lastMessage.createdAt)}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

