import {Prisma} from "@/generated/prisma";

// Price is return from Prisma as a Decimal.js object, which can't
//  be streamed to React client components. The following type
//  allows conversion of Decimal->Number from client side streaming.
export type ListingWithImages = Prisma.ListingGetPayload<{
    include: { images: true }
}>

export type ListingReturnType = Omit<ListingWithImages, "price"> & {
    price: number;
};
