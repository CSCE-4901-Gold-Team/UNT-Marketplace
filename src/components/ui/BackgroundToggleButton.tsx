"use client"

import React, { useState } from "react";

export default function BackgroundToggleButton() {
    const [isDark, setIsDark] = useState(false);

    const handleClick = () => {
        if (isDark) {
            // Switch to white
            document.body.style.backgroundColor = 'white';
            document.body.style.color = 'black';
            const main = document.querySelector('main');
            if (main) {
                main.style.backgroundColor = 'white';
                (main as HTMLElement).style.color = 'black';
            }
            const sidebar = document.querySelector('#marketSidebar > div');
            if (sidebar) {
                (sidebar as HTMLElement).style.background = 'white';
                (sidebar as HTMLElement).style.color = 'black';
            }
            const marketContent = document.querySelector('#marketContent');
            if (marketContent) {
                (marketContent as HTMLElement).style.color = 'black';
            }
            const marketSection = document.querySelector('#marketSectionWrapper');
            if (marketSection) {
                (marketSection as HTMLElement).style.color = 'black';
            }
            // Update all headings and paragraphs
            document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, div, input, textarea, label').forEach(el => {
                (el as HTMLElement).style.color = 'black';
            });
            setIsDark(false);
        } else {
            // Switch to dark
            document.body.style.backgroundColor = '#111827';
            document.body.style.color = 'white';
            const main = document.querySelector('main');
            if (main) {
                main.style.backgroundColor = '#111827';
                (main as HTMLElement).style.color = 'white';
            }
            const sidebar = document.querySelector('#marketSidebar > div');
            if (sidebar) {
                (sidebar as HTMLElement).style.background = '#111827';
                (sidebar as HTMLElement).style.color = 'white';
            }
            const marketContent = document.querySelector('#marketContent');
            if (marketContent) {
                (marketContent as HTMLElement).style.color = 'white';
            }
            const marketSection = document.querySelector('#marketSectionWrapper');
            if (marketSection) {
                (marketSection as HTMLElement).style.color = 'white';
            }
            // Update all headings and paragraphs
            document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, div, input, textarea, label').forEach(el => {
                (el as HTMLElement).style.color = 'white';
            });
            setIsDark(true);
        }
    };

    return (
        <button
            onClick={handleClick}
            className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            title={isDark ? "Change to white background" : "Change to dark background"}
        >
            {isDark ? (
                // Sun icon (when dark, show sun to indicate switching to light)
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5 text-gray-600 dark:text-gray-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
                </svg>
            ) : (
                // Moon icon (when light, show moon to indicate switching to dark)
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5 text-gray-600 dark:text-gray-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
                </svg>
            )}
        </button>
    );
}
