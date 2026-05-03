import {Prisma} from "@/prisma/generated";

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
    isPendingApproval?: boolean;
    isDeniedByAdmin?: boolean;
    /** When 18+ listing content is enabled, card/detail can show originals from the profanity review row. */
    matureAlternateTitle?: string;
    matureAlternateDescription?: string;
    /** When a moderator cleared a profanity flag and the viewer has not opted in to mature content. */
    blurProfanityReleasedCardImage?: boolean;
};
