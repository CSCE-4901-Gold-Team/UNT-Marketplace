"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { $Enums, PrismaClient } from "@prisma/client";
import UserRole = $Enums.UserRole;

const prisma = new PrismaClient();

export async function getCurrentUserRole() {
    // Validate session
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        redirect("/sign-in");
    }

    const user = await prisma.user.findFirst({
        where: {
            id: session.user.id
        },
        select: {
            role: true
        }
    });

    return user?.role ?? UserRole.STUDENT;
}
