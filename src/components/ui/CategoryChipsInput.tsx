"use client"

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
    function toggleCategory(id: number) {
        if (disabled) return;

        const nextValues = value.includes(id)
            ? value.filter((categoryId) => categoryId !== id)
            : [...value, id];

        onChange(nextValues);
    }

    const categoryErrors = validationErrors && name
        ? ErrorHelper.getZodIssuesByPath(validationErrors, name)
        : [];

    return (
        <div>
            <label className="block text-sm font-medium mb-2" htmlFor={name}>
                {inputLabel}
            </label>

            <div className="rounded-2xl border border-gray-300 bg-white p-4">
                {isLoading ? (
                    <div className="text-sm text-gray-500">Loading categories...</div>
                ) : options.length === 0 ? (
                    <div className="text-sm text-gray-500">No categories are available right now.</div>
                ) : (
                    <div className="flex flex-wrap gap-3">
                        {options.map((option) => {
                            const isSelected = value.includes(option.id);

                            return (
                                <button
                                    key={option.id}
                                    type="button"
                                    onClick={() => toggleCategory(option.id)}
                                    disabled={disabled}
                                    className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                                        isSelected
                                            ? "border-green bg-green text-white"
                                            : "border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100"
                                    } disabled:cursor-not-allowed disabled:opacity-50`}
                                    aria-pressed={isSelected}
                                >
                                    {option.name}
                                </button>
                            );
                        })}
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
