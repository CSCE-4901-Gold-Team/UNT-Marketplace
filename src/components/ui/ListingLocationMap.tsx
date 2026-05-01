"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";

type GeocodeResult = {
    lat: number;
    lng: number;
};

type ListingLocationMapProps = {
    address: string;
};

const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), {
    ssr: false,
}) as unknown as React.ComponentType<any>;

const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), {
    ssr: false,
}) as unknown as React.ComponentType<any>;

const Circle = dynamic(() => import("react-leaflet").then((mod) => mod.Circle), {
    ssr: false,
}) as unknown as React.ComponentType<any>;

const DEFAULT_CENTER: [number, number] = [33.2148, -97.1331];

export default function ListingLocationMap({ address }: ListingLocationMapProps) {
    const [location, setLocation] = useState<GeocodeResult | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const normalizedAddress = useMemo(() => address.trim(), [address]);

    useEffect(() => {
        const controller = new AbortController();

        const loadLocation = async () => {
            if (!normalizedAddress) {
                setLocation(null);
                setError(null);
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            setError(null);

            try {
                const response = await fetch(
                    `/api/geocode?address=${encodeURIComponent(normalizedAddress)}`,
                    { signal: controller.signal }
                );

                if (!response.ok) {
                    const payload = await response.json().catch(() => null);
                    throw new Error(payload?.error || "Could not find the listing location.");
                }

                const data = (await response.json()) as GeocodeResult;
                setLocation(data);
            } catch (fetchError) {
                if ((fetchError as Error).name === "AbortError") {
                    return;
                }

                setLocation(null);
                setError(fetchError instanceof Error ? fetchError.message : "Could not load the map.");
            } finally {
                if (!controller.signal.aborted) {
                    setIsLoading(false);
                }
            }
        };

        void loadLocation();

        return () => controller.abort();
    }, [normalizedAddress]);

    const center = location ? ([location.lat, location.lng] as [number, number]) : DEFAULT_CENTER;

    if (isLoading) {
        return (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-6">
                <h2 className="mb-2 text-xl font-semibold">Pickup location</h2>
                <p className="text-sm text-gray-600">Loading map…</p>
                <div className="mt-4 h-80 animate-pulse rounded-lg bg-gray-200" />
            </div>
        );
    }

    if (error || !location) {
        return (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-6">
                <h2 className="mb-2 text-xl font-semibold">Pickup location</h2>
                <p className="text-sm text-gray-600">{error || "Map unavailable for this address."}</p>
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-3">
                <h2 className="text-xl font-semibold">Pickup location</h2>
            </div>

            <MapContainer
                center={center}
                zoom={16}
                scrollWheelZoom
                className="h-80 w-full overflow-hidden rounded-lg"
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <Circle
                    center={center}
                    radius={800}
                    pathOptions={{ color: "#15803d", fillColor: "#22c55e", fillOpacity: 0.15 }}
                />
            </MapContainer>
        </div>
    );
}
