"use client";

import React, {useState} from "react";
import {useRouter} from "next/navigation";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

interface ListingDetailClientProps {
    listing: {
        id: string;
        title: string;
        description: string;
        price: number;
        ownerId: string;
        owner: {
            id: string;
            name: string;
            image: string | null;
            email: string;
        };
        images: Array<{id: number; url: string; sortOrder: number}>;
        categories: Array<{id: number; name: string; slug: string}>;
        createdAt: Date;
    };
    currentUserId: string;
}

export default function ListingDetailClient({listing, currentUserId}: ListingDetailClientProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const isOwner = listing.ownerId === currentUserId;

    const handleMessageSeller = async () => {
        if (isOwner) {
            alert("You cannot message yourself about your own listing.");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch("/api/messages/create", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    otherUserId: listing.ownerId,
                    listingId: listing.id,
                }),
            });

            const data = await response.json();
            if (data.success) {
                router.push(`/market/messages/${data.data.id}`);
            } else {
                alert(data.error || "Failed to create conversation");
            }
        } catch (error) {
            console.error("Error creating conversation:", error);
            alert("Failed to create conversation. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const listingPrice = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
    }).format(listing.price);

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Images */}
                <div className="space-y-4">
                    {listing.images.length > 0 ? (
                        <>
                            <div className="aspect-square rounded-lg overflow-hidden bg-gray-200">
                                <img
                                    src={`/images/${listing.images[0].url}`}
                                    alt={listing.title}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            {listing.images.length > 1 && (
                                <div className="grid grid-cols-4 gap-2">
                                    {listing.images.slice(1, 5).map((image) => (
                                        <div
                                            key={image.id}
                                            className="aspect-square rounded-lg overflow-hidden bg-gray-200"
                                        >
                                            <img
                                                src={`/images/${image.url}`}
                                                alt={listing.title}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="aspect-square rounded-lg bg-gray-200 flex items-center justify-center">
                            <p className="text-gray-400">No image available</p>
                        </div>
                    )}
                </div>

                {/* Details */}
                <div className="space-y-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">{listing.title}</h1>
                        <p className="text-3xl font-bold text-green-600">{listingPrice}</p>
                    </div>

                    <div>
                        <h2 className="text-lg font-semibold mb-2">Description</h2>
                        <p className="text-gray-700 whitespace-pre-wrap">{listing.description}</p>
                    </div>

                    {listing.categories.length > 0 && (
                        <div>
                            <h2 className="text-lg font-semibold mb-2">Categories</h2>
                            <div className="flex flex-wrap gap-2">
                                {listing.categories.map((category) => (
                                    <span
                                        key={category.id}
                                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                                    >
                                        {category.name}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    <Card>
                        <div className="flex items-center gap-4 mb-4">
                            {listing.owner.image ? (
                                <img
                                    src={listing.owner.image}
                                    alt={listing.owner.name}
                                    className="w-16 h-16 rounded-full object-cover"
                                />
                            ) : (
                                <div className="w-16 h-16 rounded-full bg-green-600 flex items-center justify-center text-white text-xl font-semibold">
                                    {listing.owner.name.charAt(0).toUpperCase()}
                                </div>
                            )}
                            <div>
                                <h3 className="font-semibold text-lg">{listing.owner.name}</h3>
                                <p className="text-sm text-gray-600">Seller</p>
                            </div>
                        </div>
                        {!isOwner && (
                            <Button
                                onClick={handleMessageSeller}
                                disabled={loading}
                                buttonSize="lg"
                                buttonClasses="w-full"
                            >
                                {loading ? "Loading..." : "Message Seller"}
                            </Button>
                        )}
                        {isOwner && (
                            <p className="text-sm text-gray-500 text-center py-2">
                                This is your listing
                            </p>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
}

