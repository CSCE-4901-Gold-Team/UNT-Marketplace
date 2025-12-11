"use client"

import React from "react";
import * as z from "zod";
import {ErrorHelper} from "@/utils/ErrorHelper";

export default function PriceInput({
    inputLabel,
    onChange,
    validationErrors,
    required,
    name,
    placeholder = "0.00",
    step = "0.01",
}: {
    inputLabel?: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    validationErrors?: z.core.$ZodIssue[]
} & React.InputHTMLAttributes<HTMLInputElement>) {

    return (
        <div>
            { !!inputLabel && (
                <label className="block text-sm font-medium">{ inputLabel }</label>
            )}
            <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                    type="number"
                    id={name}
                    name={name}
                    placeholder={placeholder}
                    min="0"
                    step={step}
                    required={required}
                    onChange={onChange}
                    className="mt-1 w-full rounded-md pl-8 pr-3 py-2 border border-black"
                    onInput={(e) => {
                        const value = e.currentTarget.value;
                        const [, decimal] = value.split('.');
                        if (decimal && decimal.length > 2) {
                            e.currentTarget.value = parseFloat(value).toFixed(2);
                        }
                    }}
                />
            </div>

            { !!name && !!validationErrors && 
                ErrorHelper.getZodIssuesByPath(validationErrors, name)?.map((issue, key) => {return (
                    <p key={key} className="mt-2 text-sm text-red-600 flex gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5}
                             stroke="currentColor" className="size-6">
                            <path strokeLinecap="round" strokeLinejoin="round"
                                  d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"/>
                        </svg>
                        <span>{issue.message}</span>
                    </p>
                )
                })
            }
        </div>
    )
}
