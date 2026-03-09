import { getConversations } from "@/actions/chat-actions";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

function timeAgo(date: Date): string {
    const now = new Date();
    const diff = Math.floor((now.getTime() - new Date(date).getTime()) / 1000);
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

export default async function MessagesPage() {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) redirect("/login");

    const conversations = await getConversations();

    return (
        <main className="min-h-screen px-4 py-6 lg:px-10 lg:py-10">
            <div className="max-w-2xl mx-auto">
                <h1 className="text-3xl font-bold mb-6">Messages</h1>

                {conversations.length === 0 ? (
                    <div className="bg-white rounded-xl shadow p-10 text-center text-gray-500">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-14 h-14 mx-auto mb-4 text-gray-300"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z"
                            />
                        </svg>
                        <p className="text-lg font-semibold mb-1">No messages yet</p>
                        <p className="text-sm">
                            Browse the{" "}
                            <Link href="/market" className="text-green font-semibold hover:underline">
                                marketplace
                            </Link>{" "}
                            and contact a seller to start a conversation.
                        </p>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow divide-y divide-gray-100">
                        {conversations.map((conv) => (
                            <Link
                                key={conv.id}
                                href={`/market/messages/${conv.id}`}
                                className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors"
                            >
                                {/* Avatar */}
                                <div className="relative flex-shrink-0">
                                    {conv.otherUser.image ? (
                                        <Image
                                            src={conv.otherUser.image}
                                            alt={conv.otherUser.name}
                                            width={48}
                                            height={48}
                                            className="rounded-full object-cover w-12 h-12"
                                        />
                                    ) : (
                                        <div className="w-12 h-12 rounded-full bg-green flex items-center justify-center text-white font-bold text-lg">
                                            {conv.otherUser.name.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    {conv.unreadCount > 0 && (
                                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                                            {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
                                        </span>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className={`font-semibold text-gray-900 truncate ${conv.unreadCount > 0 ? "font-bold" : ""}`}>
                                            {conv.otherUser.name}
                                        </span>
                                        {conv.lastMessageAt && (
                                            <span className="text-xs text-gray-400 flex-shrink-0">
                                                {timeAgo(conv.lastMessageAt)}
                                            </span>
                                        )}
                                    </div>
                                    {conv.listingTitle && (
                                        <p className="text-xs text-green font-medium truncate">
                                            Re: {conv.listingTitle}
                                        </p>
                                    )}
                                    <p className={`text-sm truncate mt-0.5 ${conv.unreadCount > 0 ? "text-gray-900 font-medium" : "text-gray-500"}`}>
                                        {conv.lastMessage ?? "No messages yet"}
                                    </p>
                                </div>

                                {/* Listing thumbnail */}
                                {conv.listingImage && (
                                    <div className="flex-shrink-0 hidden sm:block">
                                        <Image
                                            src={conv.listingImage}
                                            alt={conv.listingTitle ?? "Listing"}
                                            width={48}
                                            height={48}
                                            className="rounded-lg object-cover w-12 h-12 border border-gray-200"
                                        />
                                    </div>
                                )}
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
