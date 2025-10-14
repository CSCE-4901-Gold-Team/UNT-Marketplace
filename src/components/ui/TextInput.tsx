"use client"

import React from "react";
import * as z from "zod";
import {ErrorHelper} from "@/utils/ErrorHelper";

export default function TextInput({
    inputLabel,
    onChange,
    validationErrors,
    type = "text",
    required,
    value,
    placeholder,
    name
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
            <input
                type={type}
                value={value}
                placeholder={placeholder}
                onChange={onChange}
                required={required}
                name={name}
                className="mt-1 w-full rounded-md px-3 py-2 border border-black"
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
