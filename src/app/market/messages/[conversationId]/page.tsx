import { getConversationDetail } from "@/actions/chat-actions";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import ChatWindow from "@/components/ui/ChatWindow";

export default async function ConversationPage({
    params,
}: {
    params: Promise<{ conversationId: string }>;
}) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) redirect("/login");

    const { conversationId } = await params;

    let conversation;
    try {
        conversation = await getConversationDetail(conversationId);
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "";
        if (msg === "Forbidden" || msg === "Conversation not found") notFound();
        throw e;
    }

    return (
        <main className="flex flex-col h-[calc(100vh-0px)] lg:h-screen">
            <ChatWindow initial={conversation} />
        </main>
    );
}
