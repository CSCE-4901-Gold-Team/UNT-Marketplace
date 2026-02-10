"use client";

import React, { useState, KeyboardEvent } from "react";
import Button from "@/components/ui/Button";
import { useMessagesWs } from "@/lib/messages-ws-context";

interface MessageInputProps {
    conversationId: string;
    onMessageSent: () => void;
}

export default function MessageInput({ conversationId, onMessageSent }: MessageInputProps) {
    const { triggerRefetchMessages } = useMessagesWs();
    const [content, setContent] = useState("");
    const [sending, setSending] = useState(false);

    const handleSend = async () => {
        if (!content.trim() || sending) return;

        setSending(true);
        try {
            const response = await fetch(
                `/api/messages/conversations/${conversationId}/messages`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({content: content.trim()}),
                }
            );

            const data = await response.json();
            if (data.success) {
                setContent("");
                triggerRefetchMessages();
                onMessageSent();
            } else {
                alert(data.error || "Failed to send message");
            }
        } catch (error) {
            console.error("Error sending message:", error);
            alert("Failed to send message. Please try again.");
        } finally {
            setSending(false);
        }
    };

    const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="border-t border-gray-200 p-4 bg-white">
            <div className="flex gap-2 items-end">
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message..."
                    className="flex-1 resize-none border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
                    rows={1}
                    style={{
                        minHeight: "44px",
                        maxHeight: "120px",
                    }}
                    onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement;
                        target.style.height = "auto";
                        target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
                    }}
                />
                <Button
                    onClick={handleSend}
                    disabled={!content.trim() || sending}
                    buttonSize="md"
                >
                    {sending ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth="2"
                            stroke="currentColor"
                            className="w-5 h-5"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                            />
                        </svg>
                    )}
                </Button>
            </div>
        </div>
    );
}

