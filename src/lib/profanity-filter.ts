/**
 * Censors profanity in user-generated text (e.g. direct messages, listings) by replacing matched words/phrases
 * with asterisks (same length as the match). Longer patterns are applied first.
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

const CENSOR_REGEXES: RegExp[] = ENTRIES.map((entry) => {
    const parts = entry.trim().split(/\s+/).map(escapeRegExp);
    const body =
        parts.length === 1 ? `\\b${parts[0]}\\b` : `\\b${parts.join("\\s+")}\\b`;
    return new RegExp(body, "gi");
});

export interface CensorProfanityResult {
    /** Text with matches replaced by asterisks (same length per match). */
    censored: string;
    /** True if any pattern matched. */
    wasCensored: boolean;
}

/**
 * Returns a copy of `text` with profane words/phrases replaced by asterisks
 * (one asterisk per character in the match), and whether anything was censored.
 */
export function censorProfanity(text: string): CensorProfanityResult {
    let result = text;
    let wasCensored = false;
    for (const re of CENSOR_REGEXES) {
        result = result.replace(re, (match) => {
            wasCensored = true;
            return "*".repeat(match.length);
        });
    }
    return { censored: result, wasCensored };
}
