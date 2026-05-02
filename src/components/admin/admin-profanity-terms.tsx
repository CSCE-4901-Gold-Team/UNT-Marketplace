"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ProfanityListType } from "@/prisma/generated";
import {
    addProfanityModerationTerm,
    deleteProfanityModerationTerm,
    getProfanityModerationTerms,
    type ProfanityModerationTermRow,
} from "@/actions/admin-actions";

export default function AdminProfanityTerms({ userRole }: { userRole: string | null }) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [terms, setTerms] = useState<ProfanityModerationTermRow[]>([]);
    const [whitelistInput, setWhitelistInput] = useState("");
    const [blacklistInput, setBlacklistInput] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function load() {
        setLoading(true);
        setError(null);
        try {
            const data = await getProfanityModerationTerms();
            setTerms(data);
        } catch (e) {
            console.error(e);
            setError("Could not load terms.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (userRole !== "ADMIN") {
            router.push("/market");
            return;
        }
        void load();
    }, [userRole, router]);

    async function handleAdd(listType: ProfanityListType, raw: string) {
        const trimmed = raw.trim();
        if (!trimmed) return;
        setSaving(true);
        setError(null);
        const res = await addProfanityModerationTerm(listType, trimmed);
        setSaving(false);
        if (!res.success) {
            setError(res.error ?? "Could not add term.");
            return;
        }
        if (listType === ProfanityListType.WHITELIST) setWhitelistInput("");
        else setBlacklistInput("");
        await load();
    }

    async function handleDelete(id: string) {
        if (!confirm("Remove this term from the list?")) return;
        setSaving(true);
        setError(null);
        await deleteProfanityModerationTerm(id);
        setSaving(false);
        await load();
    }

    const whitelist = terms.filter((t) => t.listType === ProfanityListType.WHITELIST);
    const blacklist = terms.filter((t) => t.listType === ProfanityListType.BLACKLIST);

    return (
        <div className="flex flex-col gap-8">
            <p className="text-gray-600 text-sm max-w-3xl">
                <strong>Whitelist</strong> terms are never censored and do not trigger listing review.{" "}
                <strong>Blacklist</strong> terms are censored like built-in profanity and can trigger review. Terms are
                stored lowercase; multi-word phrases use the same word-boundary rules as the built-in list.
            </p>

            {error ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">{error}</div>
            ) : null}

            {loading ? (
                <div className="text-gray-500">Loading…</div>
            ) : (
                <div className="grid md:grid-cols-2 gap-8">
                    <div className="border border-gray-200 rounded-xl p-5 bg-white">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Whitelist</h3>
                        <p className="text-xs text-gray-500 mb-3">Allowed words or phrases (e.g. place names, course jargon).</p>
                        <div className="flex gap-2 mb-4">
                            <input
                                type="text"
                                value={whitelistInput}
                                onChange={(e) => setWhitelistInput(e.target.value)}
                                placeholder="e.g. scunthorpe"
                                className="flex-1 border rounded-lg px-3 py-2 text-sm"
                                disabled={saving}
                            />
                            <button
                                type="button"
                                disabled={saving}
                                onClick={() => void handleAdd(ProfanityListType.WHITELIST, whitelistInput)}
                                className="px-4 py-2 rounded-lg bg-green text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50"
                            >
                                Add
                            </button>
                        </div>
                        <ul className="space-y-2 max-h-72 overflow-y-auto text-sm">
                            {whitelist.length === 0 ? (
                                <li className="text-gray-400">No whitelist entries.</li>
                            ) : (
                                whitelist.map((t) => (
                                    <li
                                        key={t.id}
                                        className="flex justify-between items-center gap-2 rounded-lg bg-gray-50 px-3 py-2"
                                    >
                                        <span className="font-mono break-all">{t.term}</span>
                                        <button
                                            type="button"
                                            disabled={saving}
                                            onClick={() => void handleDelete(t.id)}
                                            className="shrink-0 text-red-600 text-xs font-semibold hover:underline"
                                        >
                                            Remove
                                        </button>
                                    </li>
                                ))
                            )}
                        </ul>
                    </div>

                    <div className="border border-gray-200 rounded-xl p-5 bg-white">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Blacklist</h3>
                        <p className="text-xs text-gray-500 mb-3">Extra words or phrases to censor and flag for review.</p>
                        <div className="flex gap-2 mb-4">
                            <input
                                type="text"
                                value={blacklistInput}
                                onChange={(e) => setBlacklistInput(e.target.value)}
                                placeholder="word or multi word phrase"
                                className="flex-1 border rounded-lg px-3 py-2 text-sm"
                                disabled={saving}
                            />
                            <button
                                type="button"
                                disabled={saving}
                                onClick={() => void handleAdd(ProfanityListType.BLACKLIST, blacklistInput)}
                                className="px-4 py-2 rounded-lg bg-gray-800 text-white text-sm font-semibold hover:bg-gray-900 disabled:opacity-50"
                            >
                                Add
                            </button>
                        </div>
                        <ul className="space-y-2 max-h-72 overflow-y-auto text-sm">
                            {blacklist.length === 0 ? (
                                <li className="text-gray-400">No blacklist entries.</li>
                            ) : (
                                blacklist.map((t) => (
                                    <li
                                        key={t.id}
                                        className="flex justify-between items-center gap-2 rounded-lg bg-amber-50 px-3 py-2"
                                    >
                                        <span className="font-mono break-all">{t.term}</span>
                                        <button
                                            type="button"
                                            disabled={saving}
                                            onClick={() => void handleDelete(t.id)}
                                            className="shrink-0 text-red-600 text-xs font-semibold hover:underline"
                                        >
                                            Remove
                                        </button>
                                    </li>
                                ))
                            )}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
}
