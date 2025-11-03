"use server";

import {auth} from "@/lib/auth";
import {$Enums, Listing, ListingStatus, PrismaClient} from "@/generated/prisma";
import {headers} from "next/headers";
import {redirect} from "next/navigation";
import {getCurrentUserRole} from "@/actions/user-actions";
import UserRole = $Enums.UserRole;
import {ListingReturnType, ListingWithImages} from "@/models/ListingReturnType";

const prisma = new PrismaClient();

export async function getListings(): Promise<ListingReturnType[]> {
    // Validate session
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        redirect("/sign-in");
    }

    // Get role of current user
    const currentUserRole = await getCurrentUserRole();

    if (!currentUserRole) return [];
    let listings: ListingWithImages[] = [];

    // Admin/Faculty
    if (currentUserRole === UserRole.FACULTY || currentUserRole === UserRole.ADMIN) {
        listings = await prisma.listing.findMany({
            where: {
                listingStatus: ListingStatus.AVAILABLE
            },
            orderBy: {
                createdAt: 'desc'
            },
            include: {
                images: true
            }
        });
    }

    // All other roles
    listings = await prisma.listing.findMany({
        where: {
            listingStatus: ListingStatus.AVAILABLE,
            isProfessorOnly: false
        },
        orderBy: {
            createdAt: 'desc'
        },
        include: {
            images: true
        }
    });

    // Convert and return listings
    return listings.map(listing => ({
            ...listing,
            price: listing.price.toNumber(),
    }));
}
