import React from "react";

export default function Loading() {
    const widths = ['w-full','w-3/5','w-4/5','w-2/5','w-4/6','w-3/5','w-4/5','w-2/5','w-4/6','w-1/5'];


    const opacitySteps = [
        'opacity-100',
        'opacity-90',
        'opacity-80',
        'opacity-70',
        'opacity-60',
        'opacity-50',
        'opacity-40',
        'opacity-30',
        'opacity-20',
        'opacity-10'
    ];

    return (
        <main className="min-h-screen px-8 py-4 lg:px-20 lg:py-12">
            <div className="w-full max-w-4xl">

                <div>
                    <div className={`animate-pulse ${opacitySteps[0]}`}>
                        <div className="h-10 bg-gray-300 rounded w-1/3 mb-5"></div>
                    </div>


                    {widths.map((width, index) => (
                        <div
                            key={index}
                            className={`${opacitySteps[index]}`}
                        >
                            <div className={`h-8 bg-gray-300 rounded ${width} my-4 animate-pulse`}></div>
                        </div>
                    ))}
                </div>

            </div>
        </main>
    );
}
