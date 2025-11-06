import {Category} from "@/generated/prisma";

/**
 * Custom Listing Filter type used to construct Prisma filter queries
 */
export type ListingFilters = {
    priceMin?: string;
    priceMax?: string;
    dateMin?: Date;
    dateMax?: Date;
    professorOnly?: boolean;
    sold?: boolean;
    categories?: string[];
}
