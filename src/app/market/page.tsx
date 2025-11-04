import { PrismaClient } from "../../../generated/prisma";
import Link from "next/link";

const prisma = new PrismaClient();

export default async function Market() {
    const listings = await prisma.listing.findMany({
        include: {
            owner: {
                select: {
                    name: true,
                }
            },
            categories: {
                select: {
                    id: true,
                    name: true,
                }
            },
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    await prisma.$disconnect();

    // Create array of 9 slots - fill with listings or placeholders
    const displayItems = Array.from({ length: 9 }, (_, i) => listings[i] || null);

    return (
        <main className="px-20 py-12 flex flex-col gap-6">
            <div>
                <h1 className="text-4xl">Current Listings</h1>
            </div>

            <div className="grid grid-cols-3 gap-6">
                {displayItems.map((listing, index) => 
                    listing ? (
                        <Link 
                            key={listing.id} 
                            href={`/market/listing/${listing.id}`}
                            className="bg-white rounded-3xl shadow-md hover:shadow-xl transition-shadow overflow-hidden"
                        >
                            <div className="h-[200px] bg-gradient-to-br from-green to-green-600 flex items-center justify-center text-white text-2xl font-bold">
                                ${listing.price.toString()}
                            </div>
                            <div className="p-4">
                                <h3 className="text-xl font-semibold mb-2 truncate">{listing.title}</h3>
                                <p className="text-gray-600 text-sm line-clamp-2 mb-3">{listing.description}</p>
                                
                                {listing.categories.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mb-3">
                                        {listing.categories.slice(0, 2).map((category) => (
                                            <span 
                                                key={category.id}
                                                className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                                            >
                                                {category.name}
                                            </span>
                                        ))}
                                        {listing.categories.length > 2 && (
                                            <span className="text-xs text-gray-500">
                                                +{listing.categories.length - 2} more
                                            </span>
                                        )}
                                    </div>
                                )}

                                <div className="text-sm text-gray-500 border-t pt-3">
                                    <p>Seller: {listing.owner.name}</p>
                                </div>
                            </div>
                        </Link>
                    ) : (
                        <div key={`placeholder-${index}`} className="bg-green rounded-3xl h-[300px] opacity-20"></div>
                    )
                )}
            </div>
        </main>
    );
}
