"use client"

import React from "react";
import * as z from "zod";
import {ErrorHelper} from "@/utils/ErrorHelper";

export default function TextInput({
    inputLabel,
    onChange,
    onKeyDown,
    validationErrors,
    type = "text",
    required,
    value,
    setValue,
    setChecked,
    placeholder,
    name,
    inputClasses = "",
}: {
    inputLabel?: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onKeydown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    validationErrors?: z.core.$ZodIssue[];
    inputClasses?: string;
    setValue?: (newValue: string) => void;
    setChecked?: (newValue: boolean) => void;
} & React.InputHTMLAttributes<HTMLInputElement>) {
    let inputElementClasses = "rounded-md px-3 py-2 border border-black " + inputClasses;

    if (type === "checkbox") {
        inputElementClasses += " w-auto";
    } else {
        inputElementClasses += " w-full";
    }

    function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
        if (setValue && type !== "checkbox") {
            setValue(e.target.value);
        }
        if (type === "checkbox" && setChecked) {
            setChecked(e.currentTarget.checked);
        }
        if (onChange) onChange(e);
    }

    return (
        <div>
            { !!inputLabel && (
                <label className="block text-sm font-medium">{ inputLabel }</label>
            )}
            <input
                type={type}
                value={value}
                placeholder={placeholder}
                onChange={handleInput}
                onKeyDown={onKeyDown}
                required={required}
                name={name}
                className={inputElementClasses}
            />

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
