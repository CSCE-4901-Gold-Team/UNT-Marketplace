"use client";

import { useState, useEffect } from "react";
import { getSavedQueries, createSavedQuery, updateSavedQuery, deleteSavedQuery } from "@/actions/saved-query-actions";

interface SavedQuery {
    id: string;
    name: string;
    searchTerm: string | null;
    minPrice?: string;
    maxPrice?: string;
    categories: Array<{ id: number; name: string; slug: string }>;
    enabled: boolean;
    createdAt: string | Date;
    lastEmailSentAt?: string | Date | null;
}

interface ToggleableQuery extends SavedQuery {
    isToggling?: boolean;
    isDeleting?: boolean;
}

interface EditingQuery {
    id: string;
    name: string;
    searchTerm: string | null;
    minPrice: string | null;
    maxPrice: string | null;
}

export function SavedQueriesManager() {
    const [queries, setQueries] = useState<ToggleableQuery[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [editingQuery, setEditingQuery] = useState<EditingQuery | null>(null);

    useEffect(() => {
        loadQueries();
    }, []);

    const loadQueries = async () => {
        try {
            setLoading(true);
            const result = await getSavedQueries();
            if (result.success && result.queries) {
                setQueries(result.queries);
                setError(null);
            } else {
                setError(result.error || "Failed to load queries");
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unknown error");
        } finally {
            setLoading(false);
        }
    };

    const handleToggleEnabled = async (id: string, currentEnabled: boolean) => {
        try {
            setQueries((prev) =>
                prev.map((q) =>
                    q.id === id ? { ...q, isToggling: true } : q
                )
            );

            const result = await updateSavedQuery(id, {
                enabled: !currentEnabled,
            });

            if (result.success && result.query) {
                setQueries((prev) =>
                    prev.map((q) =>
                        q.id === id
                            ? {
                                id: result.query.id,
                                name: result.query.name,
                                searchTerm: result.query.searchTerm,
                                minPrice: result.query.minPrice,
                                maxPrice: result.query.maxPrice,
                                categories: result.query.categories,
                                enabled: result.query.enabled,
                                createdAt: result.query.createdAt,
                                lastEmailSentAt: result.query.lastEmailSentAt,
                                isToggling: false,
                            }
                            : q
                    )
                );
            } else {
                setError(result.error || "Failed to update query");
                setQueries((prev) =>
                    prev.map((q) =>
                        q.id === id ? { ...q, isToggling: false } : q
                    )
                );
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unknown error");
            setQueries((prev) =>
                prev.map((q) =>
                    q.id === id ? { ...q, isToggling: false } : q
                )
            );
        }
    };

    const handleDeleteQuery = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this saved query?")) {
            return;
        }

        try {
            setQueries((prev) =>
                prev.map((q) =>
                    q.id === id ? { ...q, isDeleting: true } : q
                )
            );

            const result = await deleteSavedQuery(id);
            if (result.success) {
                setQueries((prev) => prev.filter((q) => q.id !== id));
            } else {
                setError(result.error || "Failed to delete query");
                setQueries((prev) =>
                    prev.map((q) =>
                        q.id === id ? { ...q, isDeleting: false } : q
                    )
                );
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unknown error");
            setQueries((prev) =>
                prev.map((q) =>
                    q.id === id ? { ...q, isDeleting: false } : q
                )
            );
        }
    };

    const handleEditQuery = (query: ToggleableQuery) => {
        setEditingQuery({
            id: query.id,
            name: query.name,
            searchTerm: query.searchTerm,
            minPrice: query.minPrice || null,
            maxPrice: query.maxPrice || null,
        });
    };

    const handleSaveEdit = async (updatedQuery: EditingQuery) => {
        try {
            const result = await updateSavedQuery(updatedQuery.id, {
                name: updatedQuery.name,
                searchTerm: updatedQuery.searchTerm,
                minPrice: updatedQuery.minPrice,
                maxPrice: updatedQuery.maxPrice,
            });

            if (result.success && result.query) {
                setQueries((prev) =>
                    prev.map((q) =>
                        q.id === updatedQuery.id
                            ? {
                                id: result.query.id,
                                name: result.query.name,
                                searchTerm: result.query.searchTerm,
                                minPrice: result.query.minPrice,
                                maxPrice: result.query.maxPrice,
                                categories: result.query.categories,
                                enabled: result.query.enabled,
                                createdAt: result.query.createdAt,
                                lastEmailSentAt: result.query.lastEmailSentAt,
                            }
                            : q
                    )
                );
                setEditingQuery(null);
                setError(null);
            } else {
                setError(result.error || "Failed to update query");
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unknown error");
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
                    {error}
                </div>
            )}

            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Saved Searches</h2>
                <button
                    onClick={() => setShowCreateForm(!showCreateForm)}
                    className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark"
                >
                    {showCreateForm ? "Cancel" : "New Saved Search"}
                </button>
            </div>

            {showCreateForm && (
                <CreateQueryForm
                    onSuccess={() => {
                        setShowCreateForm(false);
                        loadQueries();
                    }}
                    onCancel={() => setShowCreateForm(false)}
                />
            )}

            {editingQuery && (
                <EditQueryForm
                    query={editingQuery}
                    onSave={handleSaveEdit}
                    onCancel={() => setEditingQuery(null)}
                />
            )}

            {queries.length === 0 ? (
                <div className="text-center p-8 bg-gray-50 rounded">
                    <p className="text-gray-600 mb-4">You haven't saved any searches yet.</p>
                    <button
                        onClick={() => setShowCreateForm(true)}
                        className="text-primary hover:underline"
                    >
                        Create your first saved search
                    </button>
                </div>
            ) : (
                <div className="grid gap-4">
                    {queries.map((query) => (
                        <QueryCard
                            key={query.id}
                            query={query}
                            onToggle={(enabled) => handleToggleEnabled(query.id, enabled)}
                            onEdit={() => handleEditQuery(query)}
                            onDelete={() => handleDeleteQuery(query.id)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function CreateQueryForm({
    onSuccess,
    onCancel,
}: {
    onSuccess: () => void;
    onCancel: () => void;
}) {
    const [formData, setFormData] = useState({
        name: "",
        searchTerm: "",
        minPrice: "",
        maxPrice: "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            setError("Query name is required");
            return;
        }

        try {
            setIsSubmitting(true);
            const result = await createSavedQuery({
                name: formData.name,
                searchTerm: formData.searchTerm || undefined,
                minPrice: formData.minPrice || undefined,
                maxPrice: formData.maxPrice || undefined,
            });

            if (result.success) {
                onSuccess();
            } else {
                setError(result.error || "Failed to create query");
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unknown error");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="border rounded-lg p-6 bg-white shadow">
            <h3 className="text-lg font-semibold mb-4">Create New Saved Search</h3>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-2 rounded mb-4">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Search Name *</label>
                    <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., Budget Laptops"
                        className="w-full px-3 py-2 border rounded"
                        disabled={isSubmitting}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Search Term</label>
                    <input
                        type="text"
                        value={formData.searchTerm}
                        onChange={(e) => setFormData({ ...formData, searchTerm: e.target.value })}
                        placeholder="e.g., laptop, textbook"
                        className="w-full px-3 py-2 border rounded"
                        disabled={isSubmitting}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Min Price</label>
                        <input
                            type="number"
                            value={formData.minPrice}
                            onChange={(e) => setFormData({ ...formData, minPrice: e.target.value })}
                            placeholder="0"
                            step="0.01"
                            className="w-full px-3 py-2 border rounded"
                            disabled={isSubmitting}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Max Price</label>
                        <input
                            type="number"
                            value={formData.maxPrice}
                            onChange={(e) => setFormData({ ...formData, maxPrice: e.target.value })}
                            placeholder="No limit"
                            step="0.01"
                            className="w-full px-3 py-2 border rounded"
                            disabled={isSubmitting}
                        />
                    </div>
                </div>

                <div className="flex gap-2 pt-4">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark disabled:opacity-50"
                    >
                        {isSubmitting ? "Creating..." : "Create Saved Search"}
                    </button>
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isSubmitting}
                        className="flex-1 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}

function EditQueryForm({
    query,
    onSave,
    onCancel,
}: {
    query: EditingQuery;
    onSave: (query: EditingQuery) => void;
    onCancel: () => void;
}) {
    const [formData, setFormData] = useState(query);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            setError("Query name is required");
            return;
        }

        try {
            setIsSubmitting(true);
            onSave(formData);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unknown error");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="border rounded-lg p-6 bg-white shadow">
            <h3 className="text-lg font-semibold mb-4">Edit Saved Search</h3>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-2 rounded mb-4">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Search Name *</label>
                    <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., Budget Laptops"
                        className="w-full px-3 py-2 border rounded"
                        disabled={isSubmitting}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Search Term</label>
                    <input
                        type="text"
                        value={formData.searchTerm || ""}
                        onChange={(e) => setFormData({ ...formData, searchTerm: e.target.value || null })}
                        placeholder="e.g., laptop, textbook"
                        className="w-full px-3 py-2 border rounded"
                        disabled={isSubmitting}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Min Price</label>
                        <input
                            type="number"
                            value={formData.minPrice || ""}
                            onChange={(e) => setFormData({ ...formData, minPrice: e.target.value || null })}
                            placeholder="0"
                            step="0.01"
                            className="w-full px-3 py-2 border rounded"
                            disabled={isSubmitting}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Max Price</label>
                        <input
                            type="number"
                            value={formData.maxPrice || ""}
                            onChange={(e) => setFormData({ ...formData, maxPrice: e.target.value || null })}
                            placeholder="No limit"
                            step="0.01"
                            className="w-full px-3 py-2 border rounded"
                            disabled={isSubmitting}
                        />
                    </div>
                </div>

                <div className="flex gap-2 pt-4">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark disabled:opacity-50"
                    >
                        {isSubmitting ? "Saving..." : "Save Changes"}
                    </button>
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isSubmitting}
                        className="flex-1 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}

function QueryCard({
    query,
    onToggle,
    onEdit,
    onDelete,
}: {
    query: ToggleableQuery;
    onToggle: (enabled: boolean) => void;
    onEdit: () => void;
    onDelete: () => void;
}) {
    return (
        <div className="border rounded-lg p-4 bg-white shadow hover:shadow-md transition">
            <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                    <h3 className="text-lg font-semibold">{query.name}</h3>
                    {query.searchTerm && (
                        <p className="text-sm text-gray-600">Search: {query.searchTerm}</p>
                    )}
                </div>
                <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${query.enabled
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                        }`}
                >
                    {query.enabled ? "Active" : "Inactive"}
                </span>
            </div>

            <div className="text-sm text-gray-600 mb-3">
                {query.minPrice && <p>Min: ${parseFloat(query.minPrice).toFixed(2)}</p>}
                {query.maxPrice && <p>Max: ${parseFloat(query.maxPrice).toFixed(2)}</p>}
                {query.categories.length > 0 && (
                    <p>
                        Categories: {query.categories.map((c) => c.name).join(", ")}
                    </p>
                )}
                {query.lastEmailSentAt && (
                    <p>Last email: {new Date(query.lastEmailSentAt).toLocaleDateString()}</p>
                )}
            </div>

            <div className="flex gap-2">
                <button
                    onClick={() => onToggle(query.enabled)}
                    disabled={query.isToggling || query.isDeleting}
                    className="flex-1 px-3 py-2 text-sm border rounded hover:bg-gray-50 disabled:opacity-50"
                >
                    {query.isToggling
                        ? "Updating..."
                        : query.enabled
                            ? "Disable Alerts"
                            : "Enable Alerts"}
                </button>
                <button
                    onClick={onEdit}
                    disabled={query.isToggling || query.isDeleting}
                    className="flex-1 px-3 py-2 text-sm border border-blue-600 text-blue-600 rounded hover:bg-blue-50 disabled:opacity-50"
                >
                    Edit
                </button>
                <button
                    onClick={onDelete}
                    disabled={query.isDeleting}
                    className="flex-1 px-3 py-2 text-sm text-red-600 border border-red-600 rounded hover:bg-red-50 disabled:opacity-50"
                >
                    {query.isDeleting ? "Deleting..." : "Delete"}
                </button>
            </div>
        </div>
    );
}
