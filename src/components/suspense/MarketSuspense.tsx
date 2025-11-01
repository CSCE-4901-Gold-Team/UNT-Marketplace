"use client"

export default function MarketSuspense() {

    return (
        <div className="animate-pulse grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {
                [...Array(6)].map(i =>
                    <div key={i} className="h-[350px] bg-gray-300 rounded-sm"></div>
                )
            }
        </div>
    );
}
