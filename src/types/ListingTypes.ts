export type ListingByIdResult = {
    success: boolean;
    listing?: {
        id: string;
        title: string;
        description: string;
        price: string;
        listingStatus: string;
        isProfessorOnly: boolean;
        categories: { id: number; name: string }[];
        images: { url: string }[];
    };
    error?: string;
};
