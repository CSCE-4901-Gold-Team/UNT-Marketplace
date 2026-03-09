"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { ConversationDetail, MessageData, sendMessage, getNewMessages } from "@/actions/chat-actions";

const POLL_INTERVAL_MS = 3000;

function Avatar({ name, image, size = 8 }: { name: string; image?: string | null; size?: number }) {
    if (image) {
        return (
            <Image
                src={image}
                alt={name}
                width={size * 4}
                height={size * 4}
                className={`rounded-full object-cover w-${size} h-${size}`}
            />
        );
    }
    return (
        <div
            className={`w-${size} h-${size} rounded-full bg-green flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}
        >
            {name.charAt(0).toUpperCase()}
        </div>
    );
}

function formatTime(date: Date) {
    return new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(date: Date) {
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) return "Today";
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
    return d.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}

export default function ChatWindow({ initial }: { initial: ConversationDetail }) {
    const [messages, setMessages] = useState<MessageData[]>(initial.messages);
    const [input, setInput] = useState("");
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const bottomRef = useRef<HTMLDivElement>(null);
    const lastIdRef = useRef<string | null>(messages[messages.length - 1]?.id ?? null);
    const pollingRef = useRef<NodeJS.Timeout | null>(null);

    // Scroll to bottom whenever messages change
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Polling for new messages (Vercel-compatible, no WebSockets)
    useEffect(() => {
        pollingRef.current = setInterval(async () => {
            try {
                const newMsgs = await getNewMessages(initial.id, lastIdRef.current);
                if (newMsgs.length > 0) {
                    setMessages((prev) => {
                        const existingIds = new Set(prev.map((m) => m.id));
                        const fresh = newMsgs.filter((m) => !existingIds.has(m.id));
                        if (fresh.length === 0) return prev;
                        lastIdRef.current = fresh[fresh.length - 1].id;
                        return [...prev, ...fresh];
                    });
                }
            } catch {
                // Silently ignore polling errors
            }
        }, POLL_INTERVAL_MS);

        return () => {
            if (pollingRef.current) clearInterval(pollingRef.current);
        };
    }, [initial.id]);

    const handleSend = () => {
        const trimmed = input.trim();
        if (!trimmed || isPending) return;

        setError(null);
        const optimisticMsg: MessageData = {
            id: `optimistic-${Date.now()}`,
            body: trimmed,
            senderId: "me",
            senderName: "You",
            senderImage: null,
            createdAt: new Date(),
            isMine: true,
        };

        setMessages((prev) => [...prev, optimisticMsg]);
        setInput("");

        startTransition(async () => {
            try {
                const saved = await sendMessage(initial.id, trimmed);
                setMessages((prev) =>
                    prev.map((m) => (m.id === optimisticMsg.id ? saved : m))
                );
                lastIdRef.current = saved.id;
            } catch (e: unknown) {
                setError(e instanceof Error ? e.message : "Failed to send message");
                // Remove the optimistic message on failure
                setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
            }
        });
    };

    // Group messages by date
    const grouped: { date: string; messages: MessageData[] }[] = [];
    for (const msg of messages) {
        const label = formatDate(msg.createdAt);
        const last = grouped[grouped.length - 1];
        if (last && last.date === label) {
            last.messages.push(msg);
        } else {
            grouped.push({ date: label, messages: [msg] });
        }
    }

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b bg-white shadow-sm">
                <Link href="/market/messages" className="text-green hover:text-green/80 mr-1">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                    </svg>
                </Link>
                <Avatar name={initial.otherUser.name} image={initial.otherUser.image} size={10} />
                <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{initial.otherUser.name}</p>
                    {initial.listingTitle && (
                        <Link
                            href={initial.listingId ? `/market/listing/${initial.listingId}` : "#"}
                            className="text-xs text-green hover:underline truncate block"
                        >
                            Re: {initial.listingTitle}
                            {initial.listingPrice ? ` — $${initial.listingPrice}` : ""}
                        </Link>
                    )}
                </div>
                {initial.listingImage && (
                    <div className="ml-auto flex-shrink-0">
                        <Link href={initial.listingId ? `/market/listing/${initial.listingId}` : "#"}>
                            <Image
                                src={initial.listingImage}
                                alt={initial.listingTitle ?? "Listing"}
                                width={44}
                                height={44}
                                className="rounded-lg object-cover border border-gray-200 w-11 h-11"
                            />
                        </Link>
                    </div>
                )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-gray-50">
                {messages.length === 0 && (
                    <p className="text-center text-gray-400 text-sm mt-8">
                        No messages yet. Say hello!
                    </p>
                )}

                {grouped.map((group) => (
                    <div key={group.date}>
                        {/* Date separator */}
                        <div className="flex items-center gap-2 my-3">
                            <div className="flex-1 h-px bg-gray-200" />
                            <span className="text-xs text-gray-400 font-medium">{group.date}</span>
                            <div className="flex-1 h-px bg-gray-200" />
                        </div>

                        <div className="space-y-2">
                            {group.messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`flex items-end gap-2 ${msg.isMine ? "justify-end" : "justify-start"}`}
                                >
                                    {!msg.isMine && (
                                        <Avatar name={msg.senderName} image={msg.senderImage} size={7} />
                                    )}
                                    <div
                                        className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm leading-relaxed shadow-sm ${
                                            msg.isMine
                                                ? "bg-green text-white rounded-br-sm"
                                                : "bg-white text-gray-800 rounded-bl-sm border border-gray-200"
                                        } ${msg.id.startsWith("optimistic-") ? "opacity-70" : ""}`}
                                    >
                                        <p className="whitespace-pre-wrap break-words">{msg.body}</p>
                                        <p
                                            className={`text-[10px] mt-1 text-right ${
                                                msg.isMine ? "text-white/70" : "text-gray-400"
                                            }`}
                                        >
                                            {formatTime(msg.createdAt)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
                <div ref={bottomRef} />
            </div>

            {/* Error */}
            {error && (
                <div className="px-4 py-2 bg-red-50 border-t border-red-200 text-red-600 text-sm">
                    {error}
                </div>
            )}

            {/* Input */}
            <div className="px-4 py-3 border-t bg-white flex items-end gap-2">
                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                        }
                    }}
                    placeholder="Type a message… (Enter to send, Shift+Enter for newline)"
                    rows={1}
                    className="flex-1 resize-none rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green/50 focus:border-green max-h-32 overflow-y-auto"
                    style={{ lineHeight: "1.5" }}
                    disabled={isPending}
                />
                <button
                    onClick={handleSend}
                    disabled={isPending || !input.trim()}
                    className="bg-green text-white rounded-xl p-2.5 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity flex-shrink-0"
                    aria-label="Send message"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                        <path d="M3.478 2.405a.75.75 0 0 0-.926.94l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.405Z" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
