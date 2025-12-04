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
        const res = await fetch("/api/categories");
        if (!res.ok) throw new Error("Failed to fetch categories");
        const data = await res.json();
        setCategories(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  if (loading) return <div className=" py-4">Loading categories...</div>;
  if (error) return <div className="text-center py-4 text-red-500">Error: {error}</div>;
  if (categories.length === 0) return <div className="left-0  py-4">No categories found</div>;

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
