/**
 * Censors profanity in user-generated text by replacing matched words/phrases
 * with asterisks. Supports admin-defined blacklist (extra matches) and whitelist
 * (allowed phrases/words skipped by the built-in list and blacklist).
 */

function escapeRegExp(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Multi-word phrases (spaces normalized to \\s+ in the regex). */
const PHRASES: string[] = [
    "piece of shit",
    "son of a bitch",
    "mother fucker",
    "motherfucker",
    "god damn",
    "goddamn",
    "cluster fuck",
    "clusterfuck",
    "dumb ass",
    "dumbass",
    "jack ass",
    "jackass",
    "shut the fuck up",
    "what the fuck",
    "fuck off",
    "fuck you",
    "go fuck yourself",
    "suck my dick",
    "eat shit",
    "bull shit",
    "bullshit",
    "dick head",
    "dickhead",
    "prick head",
    "ass hole",
    "asshole",
];

/** Single words and short tokens matched with word boundaries. */
const WORDS: string[] = [
    "fuck",
    "fucking",
    "fucked",
    "fucker",
    "fucks",
    "shit",
    "shitting",
    "shitty",
    "bitch",
    "bitches",
    "bitching",
    "bastard",
    "bastards",
    "cunt",
    "cunts",
    "dick",
    "dicks",
    "cock",
    "cocks",
    "pussy",
    "pussies",
    "slut",
    "sluts",
    "whore",
    "whores",
    "nigger",
    "niggers",
    "faggot",
    "faggots",
    "retard",
    "retards",
    "retarded",
    "spic",
    "chink",
    "kike",
    "twat",
    "wank",
    "wanker",
    "bollocks",
    "dammit",
    "damnit",
    "piss",
    "pissed",
    "crap",
    "douche",
    "douchebag",
    "prick",
    "pricks",
    "arse",
    "arsehole",
    "ballsack",
    "jizz",
    "cumming",
    "orgasm",
    "rape",
    "raping",
    "nazi",
];

const ENTRIES = [...PHRASES, ...WORDS].sort((a, b) => b.length - a.length);

export function buildEntryRegex(entry: string): RegExp {
    const parts = entry.trim().split(/\s+/).map(escapeRegExp);
    const body =
        parts.length === 1 ? `\\b${parts[0]}\\b` : `\\b${parts.join("\\s+")}\\b`;
    return new RegExp(body, "gi");
}

const BUILTIN_LABELED: { label: string; re: RegExp }[] = ENTRIES.map((entry) => ({
    label: entry,
    re: buildEntryRegex(entry),
}));

const PLACEHOLDER_START = "\uE000";
const PLACEHOLDER_END = "\uE001";

function maskWhitelistSegments(
    text: string,
    whitelist: string[]
): { masked: string; placeholders: Map<string, string> } {
    const placeholders = new Map<string, string>();
    const sorted = [...whitelist]
        .map((t) => t.trim())
        .filter(Boolean)
        .sort((a, b) => b.length - a.length);

    let out = text;
    let idx = 0;
    for (const term of sorted) {
        const re = buildEntryRegex(term);
        out = out.replace(re, (match) => {
            const key = `${PLACEHOLDER_START}WL${idx++}${PLACEHOLDER_END}`;
            placeholders.set(key, match);
            return key;
        });
    }
    return { masked: out, placeholders };
}

function restoreWhitelistSegments(text: string, placeholders: Map<string, string>): string {
    let out = text;
    for (const [key, val] of placeholders) {
        out = out.split(key).join(val);
    }
    return out;
}

function buildLabeledPatterns(
    extraBlacklist: string[]
): { label: string; re: RegExp }[] {
    const extras = [...extraBlacklist]
        .map((t) => t.trim())
        .filter(Boolean)
        .sort((a, b) => b.length - a.length)
        .map((entry) => ({
            label: entry,
            re: buildEntryRegex(entry),
        }));
    return [...BUILTIN_LABELED, ...extras];
}

export interface CensorProfanityOptions {
    /** Phrases/words that must not be censored (e.g. academic or place names). */
    whitelist?: string[];
    /** Extra phrases/words to censor like the built-in list. */
    blacklist?: string[];
    /** When true, `matches` lists which patterns fired (built-in label or custom term). */
    collectMatches?: boolean;
}

export interface CensorProfanityResult {
    censored: string;
    wasCensored: boolean;
    /** Populated when `collectMatches` is true. */
    matches?: string[];
}

/**
 * Returns censored text, whether anything was censored, and optional match labels.
 */
export function censorProfanity(text: string, options?: CensorProfanityOptions): CensorProfanityResult {
    const whitelist = options?.whitelist ?? [];
    const blacklist = options?.blacklist ?? [];
    const collectMatches = options?.collectMatches ?? false;
    const matches: string[] = [];

    const { masked, placeholders } = maskWhitelistSegments(text, whitelist);
    const labeled = buildLabeledPatterns(blacklist);

    let result = masked;
    let wasCensored = false;

    for (const { label, re } of labeled) {
        result = result.replace(re, (match) => {
            wasCensored = true;
            if (collectMatches) {
                matches.push(label);
            }
            return "*".repeat(match.length);
        });
    }

    result = restoreWhitelistSegments(result, placeholders);

    if (collectMatches && matches.length > 0) {
        const seen = new Set<string>();
        const deduped = matches.filter((m) => {
            if (seen.has(m)) return false;
            seen.add(m);
            return true;
        });
        return { censored: result, wasCensored, matches: deduped };
    }

    return { censored: result, wasCensored };
}
