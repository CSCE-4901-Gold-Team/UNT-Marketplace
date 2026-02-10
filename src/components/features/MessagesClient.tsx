"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MessagesWsProvider } from "@/lib/messages-ws-context";
import ConversationList from "@/components/features/ConversationList";
import MessageThread from "@/components/features/MessageThread";
import MessageInput from "@/components/features/MessageInput";
import Link from "next/link";

interface MessagesClientProps {
    currentUserId: string;
    conversationId?: string;
}

export default function MessagesClient({currentUserId, conversationId}: MessagesClientProps) {
    const router = useRouter();
    const [selectedConversation, setSelectedConversation] = useState<string | null>(
        conversationId || null
    );
    const [conversationInfo, setConversationInfo] = useState<{
        otherUser: {id: string; name: string; image: string | null};
        listing: {id: string; title: string; price: number} | null;
    } | null>(null);
    const [showNewConversation, setShowNewConversation] = useState(false);
    const [newConvEmail, setNewConvEmail] = useState("");
    const [newConvError, setNewConvError] = useState("");
    const [newConvLoading, setNewConvLoading] = useState(false);

    useEffect(() => {
        if (conversationId) {
            setSelectedConversation(conversationId);
            fetchConversationInfo(conversationId);
        }
    }, [conversationId]);

    const handleConversationSelect = (convId: string) => {
        setSelectedConversation(convId);
        fetchConversationInfo(convId);
        router.push(`/market/messages/${convId}`);
    };

    const fetchConversationInfo = async (convId: string) => {
        try {
            const response = await fetch(`/api/messages/conversations/${convId}`);
            const data = await response.json();
            if (data.success) {
                setConversationInfo({
                    otherUser: data.data.otherUser,
                    listing: data.data.listing,
                });
            }
        } catch (error) {
            console.error("Error fetching conversation info:", error);
        }
    };

    const handleMessageSent = () => {
        // New message is pushed via WebSocket; no need to refetch
    };

    const handleStartConversation = async (e: React.FormEvent) => {
        e.preventDefault();
        setNewConvError("");
        if (!newConvEmail.trim()) {
            setNewConvError("Enter an email address.");
            return;
        }
        setNewConvLoading(true);
        try {
            const lookupRes = await fetch(
                `/api/users/lookup?email=${encodeURIComponent(newConvEmail.trim())}`
            );
            const lookupData = await lookupRes.json();
            if (!lookupData.success || !lookupData.data?.id) {
                setNewConvError(lookupData.error || "User not found. They must be registered with UNT Marketplace.");
                setNewConvLoading(false);
                return;
            }
            const createRes = await fetch("/api/messages/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ otherUserId: lookupData.data.id }),
            });
            const createData = await createRes.json();
            if (!createData.success) {
                setNewConvError(createData.error || "Could not start conversation.");
                setNewConvLoading(false);
                return;
            }
            setShowNewConversation(false);
            setNewConvEmail("");
            setNewConvError("");
            router.push(`/market/messages/${createData.data.id}`);
        } catch (err) {
            setNewConvError("Something went wrong. Please try again.");
        } finally {
            setNewConvLoading(false);
        }
    };

    return (
        <MessagesWsProvider>
            <div className="flex h-[calc(100vh-4rem)] border border-gray-200 rounded-lg overflow-hidden bg-white">
                <div className="w-80 border-r border-gray-200 flex flex-col">
                    <div className="p-4 border-b border-gray-200 bg-gray-50">
                        <h2 className="text-xl font-bold text-gray-900">Messages</h2>
                        <button
                            type="button"
                            onClick={() => setShowNewConversation((v) => !v)}
                            className="mt-2 w-full text-sm font-semibold text-green-600 hover:text-green-700 py-2 rounded-lg border border-green-600 hover:bg-green-50"
                        >
                            {showNewConversation ? "Cancel" : "New conversation"}
                        </button>
                        {showNewConversation && (
                            <form onSubmit={handleStartConversation} className="mt-3 space-y-2">
                                <input
                                    type="email"
                                    value={newConvEmail}
                                    onChange={(e) => setNewConvEmail(e.target.value)}
                                    placeholder="Their email address"
                                    className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                                    disabled={newConvLoading}
                                />
                                {newConvError && (
                                    <p className="text-sm text-red-600">{newConvError}</p>
                                )}
                                <button
                                    type="submit"
                                    disabled={newConvLoading}
                                    className="w-full rounded bg-green-600 text-white text-sm font-semibold py-2 hover:bg-green-700 disabled:opacity-50"
                                >
                                    {newConvLoading ? "Starting…" : "Start conversation"}
                                </button>
                            </form>
                        )}
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <ConversationList onConversationSelect={handleConversationSelect} />
                    </div>
                </div>

                <div className="flex-1 flex flex-col">
                    {selectedConversation ? (
                        <>
                            <div className="p-4 border-b border-gray-200 bg-white">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        {conversationInfo?.otherUser.image ? (
                                            <img
                                                src={conversationInfo.otherUser.image}
                                                alt={conversationInfo.otherUser.name}
                                                className="w-10 h-10 rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white font-semibold">
                                                {conversationInfo?.otherUser.name
                                                    .charAt(0)
                                                    .toUpperCase() || "?"}
                                            </div>
                                        )}
                                        <div>
                                            <h3 className="font-semibold text-gray-900">
                                                {conversationInfo?.otherUser.name || "Loading..."}
                                            </h3>
                                            {conversationInfo?.listing && (
                                                <Link
                                                    href={`/market/listing/${conversationInfo.listing.id}`}
                                                    className="text-sm text-green-600 hover:underline"
                                                >
                                                    {conversationInfo.listing.title}
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 overflow-hidden">
                                <MessageThread
                                    conversationId={selectedConversation}
                                    currentUserId={currentUserId}
                                    key={selectedConversation}
                                />
                            </div>

                            <MessageInput
                                conversationId={selectedConversation}
                                onMessageSent={handleMessageSent}
                            />
                        </>
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-500">
                            <div className="text-center">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth="1.5"
                                    stroke="currentColor"
                                    className="w-16 h-16 mx-auto mb-4"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155"
                                    />
                                </svg>
                                <p>Select a conversation or start one from the sidebar.</p>
                                <p className="text-sm mt-2">No listing needed — use &quot;New conversation&quot; and enter their email.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </MessagesWsProvider>
    );
}

