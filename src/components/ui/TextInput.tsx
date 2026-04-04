"use client"

import React, {useEffect, useRef, useState} from "react";
import * as z from "zod";
import {ErrorHelper} from "@/utils/ErrorHelper";

type SpeechRecognitionLike = {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    onstart: null | (() => void);
    onresult: null | ((event: {results: ArrayLike<ArrayLike<{transcript: string}>>}) => void);
    onerror: null | ((event: {error?: string}) => void);
    onend: null | (() => void);
    start: () => void;
    stop: () => void;
};

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

export default function TextInput({
    inputLabel,
    onChange,
    onKeyDown,
    validationErrors,
    type = "text",
    required,
    value,
    setValue,
    checked,
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
    const inputRef = useRef<HTMLInputElement>(null);
    const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
    const [isListening, setIsListening] = useState(false);

    let inputElementClasses = "rounded-md px-3 py-2 border border-black text-black dark:text-white bg-white dark:bg-gray-700 placeholder:text-gray-500 dark:placeholder:text-gray-400 dark:border-gray-600 " + inputClasses;

    const micEnabledInputTypes = new Set(["text", "search", "email", "tel", "url", "password"]);
    const inputType = type ?? "text";
    const showMic = micEnabledInputTypes.has(inputType);

    if (type === "checkbox") {
        inputElementClasses += " w-auto";
    } else {
        inputElementClasses += showMic ? " w-full pr-10" : " w-full";
    }

    useEffect(() => {
        return () => {
            recognitionRef.current?.stop();
        };
    }, []);

    function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
        if (setValue && type !== "checkbox") {
            setValue(e.target.value);
        }
        if (type === "checkbox" && setChecked) {
            setChecked(e.currentTarget.checked);
        }
        if (onChange) onChange(e);
    }

    function toggleMic() {
        if (isListening) {
            recognitionRef.current?.stop();
            return;
        }

        const recognitionOwner = window as Window & {
            SpeechRecognition?: SpeechRecognitionCtor;
            webkitSpeechRecognition?: SpeechRecognitionCtor;
        };

        const RecognitionConstructor =
            recognitionOwner.SpeechRecognition ?? recognitionOwner.webkitSpeechRecognition;

        if (!RecognitionConstructor) {
            return;
        }

        const recognition = new RecognitionConstructor();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = "en-US";

        recognition.onstart = () => {
            setIsListening(true);
        };

        recognition.onresult = (event) => {
            const transcript = `${event.results[0]?.[0]?.transcript?.trim() ?? ""} `;
            if (!transcript.trim()) {
                return;
            }

            const inputElement = inputRef.current;
            if (!inputElement) {
                return;
            }

            const selectionStart = inputElement.selectionStart ?? inputElement.value.length;
            const selectionEnd = inputElement.selectionEnd ?? inputElement.value.length;
            const nextValue = inputElement.value.slice(0, selectionStart) + transcript + inputElement.value.slice(selectionEnd);

            const valueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
            valueSetter?.call(inputElement, nextValue);
            inputElement.dispatchEvent(new Event("input", {bubbles: true}));

            const nextCursor = selectionStart + transcript.length;
            inputElement.setSelectionRange(nextCursor, nextCursor);
            inputElement.focus();
        };

        recognition.onerror = () => {
            setIsListening(false);
        };

        recognition.onend = () => {
            setIsListening(false);
            recognitionRef.current = null;
        };

        recognitionRef.current = recognition;
        recognition.start();
    }

    return (
        <div>
            { !!inputLabel && (
                <label className="block text-sm font-medium">{ inputLabel }</label>
            )}
            <div className="relative">
                <input
                    ref={inputRef}
                    type={type}
                    value={value}
                    checked={checked}
                    placeholder={placeholder}
                    onChange={handleInput}
                    onKeyDown={onKeyDown}
                    required={required}
                    name={name}
                    className={inputElementClasses}
                />

                {showMic ? (
                    <button
                        type="button"
                        onClick={toggleMic}
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 dark:text-gray-300 dark:hover:bg-gray-600 dark:hover:text-white"
                        aria-label={isListening ? "Stop speech to text" : "Start speech to text"}
                        title={isListening ? "Stop speech to text" : "Start speech to text"}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                            <path d="M8.25 6.75a3.75 3.75 0 1 1 7.5 0v4.5a3.75 3.75 0 1 1-7.5 0v-4.5Z" />
                            <path d="M6 10.5a.75.75 0 0 1 .75.75v.75a5.25 5.25 0 0 0 10.5 0v-.75a.75.75 0 0 1 1.5 0v.75a6.752 6.752 0 0 1-6 6.709V21h2.25a.75.75 0 0 1 0 1.5H9a.75.75 0 0 1 0-1.5h2.25v-2.291a6.752 6.752 0 0 1-6-6.709v-.75A.75.75 0 0 1 6 10.5Z" />
                        </svg>
                    </button>
                ) : null}
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
