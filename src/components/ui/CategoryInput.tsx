"use client"

import React, { useEffect, useState } from "react";

export type Category = {
    id: number;
    name: string;
};

export default function CategoryInput({
    inputLabel,
    name,
    value = [],
    onChange,
    options = [],
    validationErrors,
}: {
    inputLabel: string;
    name: string;
    value?: number[];
    onChange: (values: number[]) => void;
    options?: { id: number; name: string }[];
    validationErrors?: any[]; // Zod issues or simple strings
}) {
    const [selected, setSelected] = useState<number[]>(value ?? []);
    const [localOptions, setLocalOptions] = useState(options ?? []);
    const [newNames, setNewNames] = useState<string[]>([]);
    const [inputValue, setInputValue] = useState("");

    useEffect(() => {
        setSelected(value ?? []);
    }, [value]);

    useEffect(() => {
        setLocalOptions(options ?? []);
    }, [options]);

    const toggle = (id: number) => {
        const next = selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id];
        setSelected(next);
        onChange(next);
    };

    const addNewName = (nameStr: string) => {
        const trimmed = nameStr.trim();
        if (!trimmed) return;
        // avoid duplicates in newNames
        if (newNames.includes(trimmed)) return;
        // avoid duplicates with existing option names
        if (localOptions.some((o) => o.name.toLowerCase() === trimmed.toLowerCase())) {
            // if it exists as an option, select it
            const existing = localOptions.find((o) => o.name.toLowerCase() === trimmed.toLowerCase());
            if (existing) toggle(existing.id);
            return;
        }

        setNewNames((s) => [...s, trimmed]);
        setInputValue("");
    };

    const removeNewName = (nameStr: string) => {
        setNewNames((s) => s.filter((n) => n !== nameStr));
    };

    return (
        <div className="flex flex-col">
            <label className="mb-2 font-medium text-black dark:text-gray-200" htmlFor={name}>
                {inputLabel}
            </label>

            <div className="flex flex-wrap gap-2 mb-2">
                {localOptions.length === 0 && newNames.length === 0 && (
                    <div className="text-sm text-gray-500 dark:text-gray-400">At least one category is required</div>
                )}

                {/* Selected existing categories - render as chips */}
                {localOptions.filter(opt => selected.includes(opt.id)).map((opt) => (
                    <span
                        key={opt.id}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-green-50 text-green-800 border border-green-100 text-sm"
                    >
                        {opt.name}
                        <button
                            type="button"
                            onClick={() => toggle(opt.id)}
                            className="ml-2 text-sm text-green-600"
                            aria-label={`Remove ${opt.name}`}
                        >
                            ×
                        </button>
                    </span>
                ))}

                {/* Newly added names as selected chips */}
                {newNames.map((n) => (
                    <span
                        key={n}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-100 dark:border-green-700 text-sm"
                    >
                        {n}
                        <button
                            type="button"
                            onClick={() => removeNewName(n)}
                            className="ml-2 text-sm text-green-600"
                            aria-label={`Remove ${n}`}
                        >
                            ×
                        </button>
                    </span>
                ))}

                {/* Unselected existing categories - render as buttons */}
                {localOptions.filter(opt => !selected.includes(opt.id)).map((opt) => (
                    <button
                        key={opt.id}
                        type="button"
                        onClick={() => toggle(opt.id)}
                        className="px-3 py-1 rounded-md border transition-colors text-sm bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                        aria-pressed={false}
                    >
                        {opt.name}
                    </button>
                ))}
            </div>

            {/* Input to add new category names */}
            <div className="flex items-center gap-2 mb-2">
                <input
                    type="text"
                    className="flex-1 px-3 py-2 border rounded-md"
                    placeholder="Type a category and press Enter"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            e.preventDefault();
                            addNewName(inputValue);
                        } else if (e.key === "Escape") {
                            setInputValue("");
                        }
                    }}
                />
                <button
                    type="button"
                    onClick={() => addNewName(inputValue)}
                    className="px-3 py-2 bg-green text-white rounded-md"
                >
                    Add
                </button>
            </div>

            {/* Hidden inputs for form submission:
                - existing selected category ids (JSON)
                - new category names (JSON) that server action can create
            */}
            <input type="hidden" name={name} value={JSON.stringify(selected)} />
            <input type="hidden" name="newCategoryNames" value={JSON.stringify(newNames)} />

            {validationErrors && validationErrors.length > 0 && (
                <div className="text-red-500 text-sm mt-1">
                    {validationErrors.map((err, idx) => (
                        <div key={idx}>
                            {typeof err === "string" ? err : (err?.message ?? JSON.stringify(err))}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}