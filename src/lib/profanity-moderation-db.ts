import { prisma } from "@/lib/prisma";
import { ProfanityListType } from "@/prisma/generated";

type Cache = {
    whitelist: string[];
    blacklist: string[];
    fetchedAt: number;
};

const TTL_MS = 30_000;
let cache: Cache | null = null;

export function invalidateProfanityModerationTermCache(): void {
    cache = null;
}

export async function getProfanityModerationTermLists(): Promise<{
    whitelist: string[];
    blacklist: string[];
}> {
    const now = Date.now();
    if (cache && now - cache.fetchedAt < TTL_MS) {
        return { whitelist: cache.whitelist, blacklist: cache.blacklist };
    }

    const rows = await prisma.profanityModerationTerm.findMany({
        select: { listType: true, term: true },
    });

    const whitelist = rows
        .filter((r) => r.listType === ProfanityListType.WHITELIST)
        .map((r) => r.term);
    const blacklist = rows
        .filter((r) => r.listType === ProfanityListType.BLACKLIST)
        .map((r) => r.term);

    cache = { whitelist, blacklist, fetchedAt: now };
    return { whitelist, blacklist };
}
