"use client"

import React from "react";

export default function WhiteBackgroundButton() {
    const handleClick = () => {
        document.body.style.backgroundColor = 'white';
        // Also change the main element if exists
        const main = document.querySelector('main');
        if (main) {
            main.style.backgroundColor = 'white';
        }
        // Change the sidebar background
        const sidebar = document.querySelector('#marketSidebar > div');
        if (sidebar) {
            (sidebar as HTMLElement).style.background = 'white';
        }
    };

    return (
        <button
            onClick={handleClick}
            className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            title="Change page to white background"
        >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5 text-gray-600 dark:text-gray-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
            </svg>
        </button>
    );
}
