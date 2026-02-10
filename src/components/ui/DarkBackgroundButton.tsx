"use client"

import React from "react";

export default function DarkBackgroundButton() {
    const handleClick = () => {
        document.body.style.backgroundColor = '#111827'; // dark gray
        // Also change the main element if exists
        const main = document.querySelector('main');
        if (main) {
            main.style.backgroundColor = '#111827';
        }
        // Change the sidebar background
        const sidebar = document.querySelector('#marketSidebar > div');
        if (sidebar) {
            (sidebar as HTMLElement).style.background = '#111827';
        }
    };

    return (
        <button
            onClick={handleClick}
            className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            title="Change page to dark background"
        >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5 text-gray-600 dark:text-gray-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
            </svg>
        </button>
    );
}
