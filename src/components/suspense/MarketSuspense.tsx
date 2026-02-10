"use client"

export default function MarketSuspense() {

    return (
        <>
            <div className="flex justify-between mb-4">
                <div className="h-10 bg-gray-300 rounded w-1/4 mb-4 animate-pulse"></div>
                <div className="h-10 bg-gray-300 rounded w-1/6 mb-4 animate-pulse"></div>
            </div>

            <div className="animate-pulse grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {
                    [...Array(6)].map((i, k) =>
                        <div key={k} className="h-[350px] bg-gray-300 rounded-sm"></div>
                    )
                }
            </div>
        </>
    );
}
