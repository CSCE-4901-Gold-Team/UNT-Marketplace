import {ListingFilters} from "@/types/ListingFilters";
import {$Enums} from "@/generated/prisma";
import ListingStatus = $Enums.ListingStatus;

/**
 * Listing utility functions
 */
export const ListingUtils = {
    /**
     * Accepts ListingFilters object and returns a Prisma 'where:' compatible object
     *
     * @param filters Object containing filter parameters
     * @return A Prisma 'where:' compatible object
     */
    buildFilterObject: (filters: ListingFilters) => {
        const filterObject = [];

        // Min price
        if (!!filters.priceMin) {
            filterObject.push({
                price: { gte: filters.priceMin }
            });
        }

        // Max price
        if (!!filters.priceMax) {
            filterObject.push({
                price: { lte: filters.priceMax }
            });
        }

        // Min date
        if (!!filters.dateMin) {
            filterObject.push({
                createdAt: { gte: filters.dateMin.toLocaleDateString() }
            });
        }

        // Max date
        if (!!filters.dateMax) {
            filterObject.push({
                createdAt: { lte: filters.dateMax }
            });
        }

        // Professor only
        if (!!filters.professorOnly) {
            filterObject.push({
                isProfessorOnly: true
            });
        }

        // Sold status
        if (!!filters.sold) {
            filterObject.push({
                listingStatus: ListingStatus.SOLD
            });
        }

        // Categories
        if (!!filters.categories) {
            filterObject.push({
                categories: {
                    some: {
                        name: { in: filters.categories }
                    }
                }
            });
        }

        return filterObject;
    }
};
