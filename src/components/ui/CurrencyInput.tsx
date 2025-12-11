"use client"

import React from "react";
import * as z from "zod";
import {ErrorHelper} from "@/utils/ErrorHelper";
import {FaDollarSign} from "react-icons/fa";

export default function CurrencyInput({
    inputLabel,
    onChange,
    onKeyDown,
    validationErrors,
    type = "text",
    required,
    value,
    setValue,
    placeholder,
    name,
    inputClasses = "",
}: {
    inputLabel?: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onKeydown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    validationErrors?: z.core.$ZodIssue[];
    inputClasses?: string;
    setValue: (newValue: string) => void;
} & React.InputHTMLAttributes<HTMLInputElement>) {

    function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
        if (/^\d*\.?\d{0,2}$/.test(e.target.value)) {
            setValue(e.target.value);
        }

        if (onChange) onChange(e);
    }

    return (
        <div>
            { !!inputLabel && (
                <label className="block text-sm font-medium">{ inputLabel }</label>
            )}

            <div className="flex">
                <div className="bg-gray-100 text-green border border-gray-700 border-r-0 flex items-center justify-center px-2 rounded-l-md">
                    <FaDollarSign />
                </div>
                <input
                    type={type}
                    value={value}
                    placeholder={placeholder}
                    onChange={handleInput}
                    onKeyDown={onKeyDown}
                    required={required}
                    name={name}
                    className={"w-full rounded-r-md px-3 py-2 border border-gray-700 border-l-0 " + inputClasses}
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
