import React from "react";

export default function Loading() {

    return (
        <main className="min-h-screen px-8 py-4 lg:px-20 lg:py-12">
            <div className="w-full max-w-4xl">

                <div className={`h-6 bg-gray-300 rounded w-1/4 mb-4 animate-pulse`}></div>

                <div className="h-10 bg-gray-300 rounded w-1/3 mb-5"></div>

                <div className={`h-112 bg-gray-300 rounded my-4 animate-pulse`}></div>

                <div className={`h-10 bg-gray-300 rounded w-1/6 my-8 animate-pulse`}></div>

                <div className={`h-6 bg-gray-300 rounded w-1/5 my-4 animate-pulse`}></div>

                <div className={`h-6 bg-gray-300 rounded w-1/4 my-4 animate-pulse`}></div>

            </div>
        </main>
    );
}
