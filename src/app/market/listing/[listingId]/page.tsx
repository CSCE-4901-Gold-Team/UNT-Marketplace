"use server";

import React from "react";
import {auth} from "@/lib/auth";
import {headers} from "next/headers";
import {redirect} from "next/navigation";
import {PrismaClient} from "@/generated/prisma";
import ListingDetailClient from "@/components/features/ListingDetailClient";

const prisma = new PrismaClient();

export default async function ListingDetailPage({
    params,
}: {
    params: Promise<{listingId: string}>;
}) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        redirect("/login");
    }

    const {listingId} = await params;

    const listing = await prisma.listing.findUnique({
        where: {
            id: listingId,
        },
        include: {
            owner: {
                select: {
                    id: true,
                    name: true,
                    image: true,
                    email: true,
                },
            },
            images: {
                orderBy: {
                    sortOrder: "asc",
                },
            },
            categories: true,
        },
    });

    if (!listing) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">Listing Not Found</h1>
                    <p className="text-gray-600">The listing you're looking for doesn't exist.</p>
                </div>
            </div>
        );
    }

    return (
        <ListingDetailClient
            listing={{
                ...listing,
                price: listing.price.toNumber(),
            }}
            currentUserId={session.user.id}
        />
    );
}

