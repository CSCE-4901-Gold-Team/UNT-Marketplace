"use client"

import React from "react";

export default function TextInput({
    inputLabel,
    onChange,
    type = "text",
    required,
    value,
    placeholder,
}: {
    inputLabel?: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
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
                className="mt-1 w-full rounded-md px-3 py-2 border border-black"
            />
        </div>
    )
}
