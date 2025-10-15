"use client"

import Link from "next/link";

export default function Market() {

    return (
        <main className="px-20 py-12 flex flex-col gap-6">

            <div>
                <h1 className="text-4xl">Current Listings</h1>
            </div>

            <div className="grid grid-cols-3 gap-6 opacity-20">

                <div className="bg-green rounded-3xl h-[300px]"></div>
                <div className="bg-green rounded-3xl h-[300px]"></div>
                <div className="bg-green rounded-3xl h-[300px]"></div>
                <div className="bg-green rounded-3xl h-[300px]"></div>
                <div className="bg-green rounded-3xl h-[300px]"></div>
                <div className="bg-green rounded-3xl h-[300px]"></div>
                <div className="bg-green rounded-3xl h-[300px]"></div>
                <div className="bg-green rounded-3xl h-[300px]"></div>
                <div className="bg-green rounded-3xl h-[300px]"></div>

            </div>

        </main>
    );
}
