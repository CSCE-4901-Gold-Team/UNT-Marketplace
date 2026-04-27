export interface RecentListing {
    id: string;
    title: string;
    seller: string;
    sellerName: string;
    category: string;
    price: string;
    date: string;
    createdAt: Date;
}

export interface PendingListing {
    id: string;
    title: string;
    seller: string;
    sellerName: string;
    category: string;
    price: string;
    date: string;
    pendingReason: "FIRST_LISTING" | "PROFANITY" | "BOTH";
}
