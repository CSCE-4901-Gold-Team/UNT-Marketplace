"use client"

import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import * as z from "zod";
import { ErrorHelper } from "@/utils/ErrorHelper";

type CategoryOption = {
    id: number;
    name: string;
};

export default function CategoryChipsInput({
    inputLabel,
    name,
    value = [],
    onChange,
    options = [],
    validationErrors,
    disabled = false,
    isLoading = false,
}: {
    inputLabel: string;
    name: string;
    value?: number[];
    onChange: (values: number[]) => void;
    options?: CategoryOption[];
    validationErrors?: z.core.$ZodIssue[];
    disabled?: boolean;
    isLoading?: boolean;
}) {
    const [searchValue, setSearchValue] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(0);
    const containerRef = useRef<HTMLDivElement | null>(null);

    const selectedOptions = options.filter((option) => value.includes(option.id));
    const normalizedSearch = searchValue.trim().toLowerCase();
    const filteredOptions = options.filter((option) => {
        if (value.includes(option.id)) return false;
        if (!normalizedSearch) return true;

        return option.name.toLowerCase().includes(normalizedSearch);
    });

    useEffect(() => {
        setHighlightedIndex(0);
    }, [searchValue, filteredOptions.length]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (!containerRef.current?.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    function removeCategory(id: number) {
        if (disabled) return;

        onChange(value.filter((categoryId) => categoryId !== id));
    }

    function selectCategory(id: number) {
        if (disabled || value.includes(id)) return;

        onChange([...value, id]);
        setSearchValue("");
        setIsOpen(true);
        setHighlightedIndex(0);
    }

    function handleInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
        if (disabled) return;

        if (event.key === "Backspace" && !searchValue && selectedOptions.length > 0) {
            event.preventDefault();
            removeCategory(selectedOptions[selectedOptions.length - 1].id);
            return;
        }

        if (event.key === "Escape") {
            setIsOpen(false);
            return;
        }

        if (!filteredOptions.length) return;

        if (event.key === "ArrowDown") {
            event.preventDefault();
            setIsOpen(true);
            setHighlightedIndex((prev) => (prev + 1) % filteredOptions.length);
            return;
        }

        if (event.key === "ArrowUp") {
            event.preventDefault();
            setIsOpen(true);
            setHighlightedIndex((prev) => (prev - 1 + filteredOptions.length) % filteredOptions.length);
            return;
        }

        if (event.key === "Enter") {
            event.preventDefault();
            selectCategory(filteredOptions[highlightedIndex].id);
        }
    }

    const categoryErrors = validationErrors && name
        ? ErrorHelper.getZodIssuesByPath(validationErrors, name)
        : [];

    return (
        <div>
            <label className="block text-sm font-medium mb-2" htmlFor={name}>
                {inputLabel}
            </label>

            <div ref={containerRef} className="relative">
                <div className="rounded-2xl border border-gray-300 bg-white p-4 focus-within:border-green">
                    {isLoading ? (
                        <div className="text-sm text-gray-500">Loading categories...</div>
                    ) : options.length === 0 ? (
                        <div className="text-sm text-gray-500">No categories are available right now.</div>
                    ) : (
                        <div className="flex flex-wrap items-center gap-2">
                            {selectedOptions.map((option) => (
                                <span
                                    key={option.id}
                                    className="inline-flex items-center gap-2 rounded-full border border-green bg-green px-4 py-2 text-sm font-medium text-white"
                                >
                                    {option.name}
                                    <button
                                        type="button"
                                        onClick={() => removeCategory(option.id)}
                                        disabled={disabled}
                                        className="text-white/90 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                                        aria-label={`Remove ${option.name}`}
                                    >
                                        x
                                    </button>
                                </span>
                            ))}

                            <input
                                id={name}
                                type="text"
                                value={searchValue}
                                onChange={(event) => {
                                    setSearchValue(event.target.value);
                                    setIsOpen(true);
                                }}
                                onFocus={() => setIsOpen(true)}
                                onKeyDown={handleInputKeyDown}
                                placeholder={selectedOptions.length > 0 ? "Search more categories..." : "Search categories..."}
                                disabled={disabled}
                                className="min-w-[220px] flex-1 border-0 bg-transparent px-1 py-2 text-sm outline-none placeholder:text-gray-400 disabled:cursor-not-allowed"
                                autoComplete="off"
                            />
                        </div>
                    )}
                </div>

                {!isLoading && options.length > 0 && isOpen && !disabled && (
                    <div className="absolute left-0 right-0 z-10 mt-2 max-h-64 overflow-y-auto rounded-2xl border border-gray-200 bg-white py-2 shadow-xl">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((option, index) => (
                                <button
                                    key={option.id}
                                    type="button"
                                    onClick={() => selectCategory(option.id)}
                                    onMouseEnter={() => setHighlightedIndex(index)}
                                    className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm transition ${
                                        highlightedIndex === index ? "bg-green-50 text-green-900" : "text-gray-700 hover:bg-gray-50"
                                    }`}
                                >
                                    <span>{option.name}</span>
                                    <span className="text-xs text-gray-400">Add</span>
                                </button>
                            ))
                        ) : (
                            <div className="px-4 py-3 text-sm text-gray-500">No matching categories found.</div>
                        )}
                    </div>
                )}
            </div>

            <input type="hidden" name={name} value={JSON.stringify(value)} />

            {!!categoryErrors?.length && categoryErrors.map((issue, key) => (
                <p key={key} className="mt-2 text-sm text-red-600 flex gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                    </svg>
                    <span>{issue.message}</span>
                </p>
            ))}
        </div>
    );
}
