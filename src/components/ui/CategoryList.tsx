"use client"

import React, { useEffect, useState } from "react";
import Link from "next/link";

interface Category {
  id: number;
  name: string;
  slug: string;
}

export default function CategoryList() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        console.log("Fetching categories...");
        const res = await fetch("/api/categories");
        console.log("Response status:", res.status);
        
        if (!res.ok) {
          const errorText = await res.text();
          console.error("Error response:", errorText);
          throw new Error(`Failed to fetch categories: ${res.status}`);
        }
        
        const data = await res.json();
        console.log("Categories received:", data);
        setCategories(data);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Unknown error";
        console.error("CategoryList error:", errorMsg);
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  if (loading) return <div className="py-4 text-gray-600">Loading categories...</div>;
  if (error) return <div className="py-4 text-red-500">Error: {error}</div>;
  if (categories.length === 0) return <div className="py-4 text-gray-600">No categories found</div>;

  return (
    <div className="flex flex-wrap gap-3 py-4">
      {categories.map((category) => (
        <Link
          key={category.id}
          href={`/market?category=${category.slug}`}
          className="px-4 py-2 rounded-full bg-green-600 text-white hover:bg-green-700 transition-colors dark:bg-green-700 dark:hover:bg-green-800"
        >
          {category.name}
        </Link>
      ))}
    </div>
  );
}
