import {Prisma} from "@/generated/prisma";

// Price is return from Prisma as a Decimal.js object, which can't
//  be streamed to React client components. The following type
//  allows conversion of Decimal->Number from client side streaming.
export type ListingWithRelations = Prisma.ListingGetPayload<{
    include: {
        images: true,
        categories: true
    }
}>

export type ListingObject = Omit<ListingWithRelations, "price"> & {
    price: number;
};
