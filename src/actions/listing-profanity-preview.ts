"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { censorProfanity } from "@/lib/profanity-filter";
import { getProfanityModerationTermLists } from "@/lib/profanity-moderation-db";

export type ListingProfanityPreview = {
    titleMatches: string[];
    descriptionMatches: string[];
    willHoldForReview: boolean;
};

/**
 * Live preview for the listing form: which filter patterns match and whether the listing would be held for review.
 */
export async function previewListingProfanityForForm(
    title: string,
    description: string
): Promise<ListingProfanityPreview> {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.user) {
        return { titleMatches: [], descriptionMatches: [], willHoldForReview: false };
    }

    const { whitelist, blacklist } = await getProfanityModerationTermLists();

    const titleR = censorProfanity(title.trim(), {
        whitelist,
        blacklist,
        collectMatches: true,
    });
    const descR = censorProfanity(description.trim(), {
        whitelist,
        blacklist,
        collectMatches: true,
    });

    return {
        titleMatches: titleR.matches ?? [],
        descriptionMatches: descR.matches ?? [],
        willHoldForReview: titleR.wasCensored || descR.wasCensored,
    };
}
