"use client";

import React, {useEffect, useState} from "react";

const FONT_SCALE_STEP = 0.1;
const MIN_FONT_SCALE = 1;
const MAX_FONT_SCALE = 1.5;

function getReadableText() {
    const selectionText = window.getSelection()?.toString().trim();
    if (selectionText) {
        return selectionText;
    }

    const mainText = document.querySelector("main")?.textContent?.trim();
    if (mainText) {
        return mainText;
    }

    return document.body.textContent?.trim() ?? "";
}

export default function AccessibilityTools() {
    const [isOpen, setIsOpen] = useState(false);
    const [fontScale, setFontScale] = useState(MIN_FONT_SCALE);
    const [statusMessage, setStatusMessage] = useState("Accessibility tools ready.");

    useEffect(() => {
        document.documentElement.style.setProperty("--accessibility-font-scale", String(fontScale));
    }, [fontScale]);

    useEffect(() => {
        return () => {
            if ("speechSynthesis" in window) {
                window.speechSynthesis.cancel();
            }
        };
    }, []);

    const increaseText = () => {
        const nextScale = Math.min(MAX_FONT_SCALE, Number((fontScale + FONT_SCALE_STEP).toFixed(1)));
        setFontScale(nextScale);
        setStatusMessage(
            nextScale === fontScale
                ? "Text is already at the maximum size."
                : `Text size increased to ${Math.round(nextScale * 100)}%.`
        );
        setIsOpen(true);
    };

    const decreaseText = () => {
        const nextScale = Math.max(MIN_FONT_SCALE, Number((fontScale - FONT_SCALE_STEP).toFixed(1)));
        setFontScale(nextScale);
        setStatusMessage(
            nextScale === fontScale
                ? "Text is already at the minimum size."
                : `Text size decreased to ${Math.round(nextScale * 100)}%.`
        );
        setIsOpen(true);
    };

    const readPage = () => {
        if (!("speechSynthesis" in window)) {
            setStatusMessage("Text reader is not supported in this browser.");
            setIsOpen(true);
            return;
        }

        const readableText = getReadableText();
        if (!readableText) {
            setStatusMessage("No readable text was found on this page.");
            setIsOpen(true);
            return;
        }

        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(readableText.slice(0, 4000));
        utterance.rate = 0.98;
        utterance.pitch = 1;
        utterance.onend = () => {
            setStatusMessage("Finished reading the page.");
        };
        utterance.onerror = () => {
            setStatusMessage("The text reader could not start.");
        };

        window.speechSynthesis.speak(utterance);
        setStatusMessage("Reading page text aloud.");
        setIsOpen(true);
    };

    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3">
            {isOpen ? (
                <div id="accessibility-tools-panel" className="w-72 rounded-xl border border-gray-200 bg-white p-4 shadow-lg dark:border-gray-700 dark:bg-gray-900">
                    <div className="mb-3 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">Accessibility</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Text size and reading tools</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="rounded-full px-2 py-1 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-50"
                            aria-label="Close accessibility tools"
                        >
                            Close
                        </button>
                    </div>

                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800">
                        <div className="mb-2 flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Text Size</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">{Math.round(fontScale * 100)}%</span>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={decreaseText}
                                className="flex h-9 w-9 items-center justify-center rounded-md border border-gray-300 bg-white text-lg font-semibold text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-700"
                                aria-label="Decrease text size"
                            >
                                -
                            </button>

                            <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                                <div
                                    className="h-full rounded-full bg-green-600 transition-[width] duration-200 ease-out"
                                    style={{width: `${((fontScale - MIN_FONT_SCALE) / (MAX_FONT_SCALE - MIN_FONT_SCALE)) * 100}%`}}
                                />
                            </div>

                            <button
                                type="button"
                                onClick={increaseText}
                                className="flex h-9 w-9 items-center justify-center rounded-md border border-gray-300 bg-white text-lg font-semibold text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-700"
                                aria-label="Increase text size"
                            >
                                +
                            </button>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={readPage}
                        className="mt-3 w-full rounded-xl bg-gray-900 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white dark:focus:ring-offset-gray-900"
                    >
                        Read Page
                    </button>

                    <p className="mt-3 text-sm text-gray-600 dark:text-gray-300" aria-live="polite">
                        {statusMessage}
                    </p>
                </div>
            ) : null}

            <button
                type="button"
                onClick={() => setIsOpen((currentOpen) => !currentOpen)}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-green-600 text-white shadow-lg shadow-green-600/30 transition-transform hover:scale-105 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                aria-label="Open accessibility tools"
                aria-expanded={isOpen}
                aria-controls="accessibility-tools-panel"
            >
                <span className="text-lg font-black">Aa</span>
            </button>
        </div>
    );
}
