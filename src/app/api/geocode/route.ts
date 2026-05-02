import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get("address")?.trim();

    if (!address) {
        return NextResponse.json({ error: "Address is required." }, { status: 400 });
    }

    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(address)}`,
            {
                headers: {
                    Accept: "application/json",
                    "User-Agent": "UNT-Marketplace/1.0",
                },
            }
        );

        if (!response.ok) {
            return NextResponse.json(
                { error: "Could not find the listing location." },
                { status: response.status }
            );
        }

        const results: Array<{ lat: string; lon: string; display_name: string }> = await response.json();
        const firstResult = results[0];

        if (!firstResult) {
            return NextResponse.json({ error: "Could not find the listing location." }, { status: 404 });
        }

        return NextResponse.json({
            lat: Number(firstResult.lat),
            lng: Number(firstResult.lon),
            displayName: firstResult.display_name,
        });
    } catch (error) {
        console.error("Error geocoding address:", error);
        return NextResponse.json({ error: "Could not find the listing location." }, { status: 500 });
    }
}
