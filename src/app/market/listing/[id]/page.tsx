import { PrismaClient } from "@/generated/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import ImageCarousel from "@/components/ui/ImageCarousel";

const prisma = new PrismaClient();

export default async function ListingDetail({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await auth.api.getSession({
        headers: await headers()
    });
    const listing = await prisma.listing.findUnique({
        where: {
            id: id
        },
        include: {
            owner: {
                select: {
                    name: true,
                    email: true,
                }
            },
            categories: {
                select: {
                    id: true,
                    name: true,
                }
            },
            images: {
                select: {
                    id: true,
                    url: true,
                    sortOrder: true,
                },
                orderBy: {
                    sortOrder: 'asc',
                }
            }
        }
    });

    await prisma.$disconnect();

    if (!listing) {
        notFound();
    }

    const isOwner = session?.user?.id === listing.ownerId;

    return (
        <main className="min-h-screen px-20 py-10">
            <div className="w-full max-w-4xl mx-auto">
                <Link href="/market" className="text-green hover:underline mb-4 inline-block">
                    ← Back to all listings
                </Link>

                <div className="bg-white rounded-lg shadow-lg p-8">
                    <div className="flex justify-between items-start mb-4">
                        <h1 className="text-4xl font-bold">{listing.title}</h1>
                        {isOwner && (
                            <Link 
                                href={`/market/create-listing?edit=true&id=${listing.id}`}
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                                Edit
                            </Link>
                        )}
                    </div>
                    
                    {/* Image Carousel */}
                    <ImageCarousel images={listing.images} alt={listing.title} />

                    <div className="flex items-center justify-between mb-6 pb-6 border-b">
                        <span className="text-4xl font-bold text-green">${listing.price.toString()}</span>
                        {listing.isProfessorOnly && (
                            <span className="bg-blue-100 text-blue-800 px-4 py-2 rounded">
                                Professor Only
                            </span>
                        )}
                    </div>

                    <div className="mb-6">
                        <h2 className="text-xl font-semibold mb-2">Description</h2>
                        <p className="text-gray-700 whitespace-pre-wrap">{listing.description}</p>
                    </div>

                    {listing.categories.length > 0 && (
                        <div className="mb-6">
                            <h2 className="text-xl font-semibold mb-2">Categories</h2>
                            <div className="flex flex-wrap gap-2">
                                {listing.categories.map((category) => (
                                    <span
                                        key={category.id}
                                        className="bg-gray-100 text-gray-700 px-3 py-1 rounded"
                                    >
                                        {category.name}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="border-t pt-6 mt-6">
                        <h2 className="text-xl font-semibold mb-4">Seller Information</h2>
                        <div className="bg-gray-50 rounded p-4">
                            <p className="font-medium">{listing.owner.name}</p>
                            <p className="text-gray-600">{listing.owner.email}</p>
                            <p className="text-sm text-gray-500 mt-2">
                                Posted: {new Date(listing.createdAt).toLocaleDateString()}
                            </p>
                        </div>
                    </div>

                    {!isOwner && (
                        <div className="flex gap-4 mt-6">
                            <button className="flex-1 bg-green text-white py-3 rounded-lg hover:opacity-90">
                                Contact Seller
                            </button>
                            <button className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50">
                                Share
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
