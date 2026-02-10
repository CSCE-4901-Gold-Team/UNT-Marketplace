"use server";

import React from "react";
import {auth} from "@/lib/auth";
import {headers} from "next/headers";
import {redirect} from "next/navigation";
import MessagesClient from "@/components/features/MessagesClient";

export default async function ConversationPage({
    params,
}: {
    params: Promise<{conversationId: string}>;
}) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        redirect("/login");
    }

    const {conversationId} = await params;

    return <MessagesClient currentUserId={session.user.id} conversationId={conversationId} />;
}

