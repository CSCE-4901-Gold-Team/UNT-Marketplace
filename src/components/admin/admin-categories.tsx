"use client"

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FormStatus } from "@/constants/FormStatus";
import { createCategoryAction, deleteCategoryAction, getCategories, getCategoriesCount, updateCategoryAction } from "@/actions/category-actions";
import type { AdminCategory } from "@/types/admin/categories";
import Pagination from "../ui/Pagination";

const CATEGORIES_PER_PAGE = 20;

const initialFormState = {
    status: FormStatus.INITIALIZED
};

export default function AdminCategories({ userRole }: { userRole: string | null }) {
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [actionInProgress, setActionInProgress] = useState(false);
    const [categories, setCategories] = useState<AdminCategory[]>([]);
    const [categoriesPage, setCategoriesPage] = useState(1);
    const [totalCategoriesCount, setTotalCategoriesCount] = useState(0);
    const [newCategoryName, setNewCategoryName] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<AdminCategory | null>(null);

    async function loadCategories(page: number) {
        setLoading(true);

        try {
            const [categoriesData, totalCount] = await Promise.all([
                getCategories(CATEGORIES_PER_PAGE, (page - 1) * CATEGORIES_PER_PAGE),
                getCategoriesCount()
            ]);

            setCategories(categoriesData);
            setTotalCategoriesCount(totalCount);
        } catch (error) {
            console.error("Error loading categories:", error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (userRole !== "ADMIN") {
            router.push("/market");
            return;
        }

        loadCategories(categoriesPage);
    }, [userRole, router, categoriesPage]);

    function handleSelectedCategoryChange(e: React.ChangeEvent<HTMLInputElement>) {
        if (!selectedCategory) return;

        const { name, value } = e.target;
        setSelectedCategory({ ...selectedCategory, [name]: value });
    }

    async function handleCreateCategory() {
        if (!newCategoryName.trim()) {
            alert("Please enter a category name.");
            return;
        }

        setActionInProgress(true);

        try {
            const formData = new FormData();
            formData.set("name", newCategoryName);

            const response = await createCategoryAction(initialFormState, formData);
            if (response.status !== FormStatus.SUCCESS) {
                alert(response.message?.content || "Error creating category");
                return;
            }

            alert(response.message?.content || "Category created successfully.");
            setNewCategoryName("");

            if (categoriesPage !== 1) {
                setCategoriesPage(1);
            } else {
                await loadCategories(1);
            }
        } catch (error) {
            console.error("Error creating category:", error);
            alert("Error creating category");
        } finally {
            setActionInProgress(false);
        }
    }

    async function handleSaveCategory() {
        if (!selectedCategory) return;

        setActionInProgress(true);

        try {
            const formData = new FormData();
            formData.set("categoryId", String(selectedCategory.id));
            formData.set("name", selectedCategory.name);

            const response = await updateCategoryAction(initialFormState, formData);
            if (response.status !== FormStatus.SUCCESS) {
                alert(response.message?.content || "Error updating category");
                return;
            }

            alert(response.message?.content || "Category updated successfully.");
            setSelectedCategory(null);
            await loadCategories(categoriesPage);
        } catch (error) {
            console.error("Error updating category:", error);
            alert("Error updating category");
        } finally {
            setActionInProgress(false);
        }
    }

    async function handleDeleteCategory(categoryId: number, categoryName: string) {
        if (!confirm(`Are you sure you want to delete the category "${categoryName}"?`)) return;

        setActionInProgress(true);

        try {
            const response = await deleteCategoryAction(categoryId);
            if (response.status !== FormStatus.SUCCESS) {
                alert(response.message?.content || "Error deleting category");
                return;
            }

            alert(response.message?.content || "Category deleted successfully.");

            if (categories.length === 1 && categoriesPage > 1) {
                setCategoriesPage((prev) => prev - 1);
            } else {
                await loadCategories(categoriesPage);
            }
        } catch (error) {
            console.error("Error deleting category:", error);
            alert("Error deleting category");
        } finally {
            setActionInProgress(false);
        }
    }

    return (
        <main className="px-20 py-12 flex flex-col gap-6">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-4xl font-bold">Manage Categories</h1>
                    <p className="text-gray-600 mt-2">View, add, edit, and delete marketplace categories</p>
                </div>
                <button
                    onClick={() => router.push("/admin")}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-semibold flex items-center gap-2 whitespace-nowrap"
                >
                    Back to Dashboard
                </button>
            </div>

            <div>
                <h2 className="text-2xl font-bold mb-4">Add Category</h2>
                <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 flex items-end gap-4">
                    <label className="flex-1 flex flex-col text-sm font-medium text-gray-700">
                        Category Name
                        <input
                            type="text"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            maxLength={60}
                            placeholder="Enter a category name..."
                            className="mt-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-green"
                            disabled={actionInProgress}
                        />
                    </label>
                    <button
                        onClick={handleCreateCategory}
                        className="px-6 py-3 bg-green text-white rounded-xl hover:opacity-90 transition disabled:opacity-50"
                        disabled={actionInProgress}
                    >
                        {actionInProgress ? "Saving..." : "Add Category"}
                    </button>
                </div>
            </div>

            <div>
                <h2 className="text-2xl font-bold mb-4">Category Directory</h2>
                <div className="bg-white border-2 border-gray-200 rounded-2xl p-6">
                    <div className="grid grid-cols-4 font-semibold text-gray-700 mb-3">
                        <div>Name</div>
                        <div>Slug</div>
                        <div>Listings</div>
                        <div>Action</div>
                    </div>
                    <div className="h-px my-3 bg-gray-200" />

                    {loading ? (
                        <div className="text-gray-500 text-center py-8">Loading...</div>
                    ) : categories.length === 0 ? (
                        <div className="text-gray-500 text-center py-8">No categories found</div>
                    ) : (
                        categories.map((category) => (
                            <div key={category.id} className="grid grid-cols-4 py-3 items-center hover:bg-green-50 rounded-xl px-2 transition">
                                <div className="truncate font-medium">{category.name}</div>
                                <div className="truncate text-sm text-gray-600">{category.slug}</div>
                                <div>{category.listingCount}</div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setSelectedCategory(category)}
                                        className="px-3 py-1 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition disabled:opacity-50"
                                        disabled={actionInProgress}
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDeleteCategory(category.id, category.name)}
                                        className="px-3 py-1 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition disabled:opacity-50"
                                        disabled={actionInProgress}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <Pagination
                    currentPage={categoriesPage}
                    totalItems={totalCategoriesCount}
                    itemsPerPage={CATEGORIES_PER_PAGE}
                    loading={loading}
                    onPageChange={setCategoriesPage}
                />
            </div>

            {selectedCategory && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl w-[450px] p-6 shadow-lg">
                        <h3 className="text-2xl font-bold mb-4 text-center">Edit Category</h3>
                        <div className="flex flex-col gap-4">
                            <label className="flex flex-col text-sm">
                                Name
                                <input
                                    name="name"
                                    value={selectedCategory.name}
                                    onChange={handleSelectedCategoryChange}
                                    maxLength={60}
                                    className="border border-gray-300 rounded-xl p-2 mt-1"
                                />
                            </label>
                            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                                <p className="text-sm text-gray-600">Slug preview</p>
                                <p className="font-medium text-gray-900 mt-1">
                                    {selectedCategory.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "n-a"}
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => setSelectedCategory(null)}
                                className="px-4 py-2 bg-gray-200 rounded-xl hover:bg-gray-300 transition"
                                disabled={actionInProgress}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveCategory}
                                className="px-4 py-2 bg-green text-white rounded-xl hover:opacity-90 transition disabled:opacity-50"
                                disabled={actionInProgress}
                            >
                                {actionInProgress ? "Saving..." : "Save"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
