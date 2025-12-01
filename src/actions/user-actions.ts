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

export async function updateAdminUser(userId: string, data: { name?: string; email?: string; role?: UserRole }) {
    // Validate session and admin role
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        redirect("/sign-in");
    }

    const userRole = await getCurrentUserRole();
    if (userRole !== "ADMIN") {
        throw new Error("Unauthorized");
    }

    const updatedUser = await prisma.user.update({
        where: { id: userId },
        data
    });

    return {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role
    };
}
