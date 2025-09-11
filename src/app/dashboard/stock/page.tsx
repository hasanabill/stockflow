"use client";

import { useEffect, useState } from "react";

type ProductVariant = {
    sku: string;
    size?: string;
    color?: string;
    stockQuantity: number;
    reorderLevel: number;
};

type Product = {
    _id: string;
    name: string;
    variants: ProductVariant[];
    totalStock: number;
    averageCost: number;
    stockValue: number;
    isLowStock: boolean;
};

type PaginationInfo = {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
};

export default function StockPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [pagination, setPagination] = useState<PaginationInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [showLowStock, setShowLowStock] = useState(false);
    const [showAddStock, setShowAddStock] = useState(false);

    // Add stock form state
    const [addStockSku, setAddStockSku] = useState("");
    const [addStockQuantity, setAddStockQuantity] = useState<number>(0);
    const [addStockUnitCost, setAddStockUnitCost] = useState<number>(0);
    const [addStockMessage, setAddStockMessage] = useState<string>("");

    const fetchStock = async (searchTerm?: string, lowStockFilter?: boolean, offset = 0) => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (searchTerm) params.set("search", searchTerm);
            if (lowStockFilter) params.set("lowStock", "true");
            if (offset > 0) params.set("offset", offset.toString());

            const response = await fetch(`/api/products/stock?${params}`);
            if (!response.ok) throw new Error("Failed to fetch stock");

            const data = await response.json();
            if (offset === 0) {
                setProducts(data.products);
            } else {
                setProducts(prev => [...prev, ...data.products]);
            }
            setPagination(data.pagination);
        } catch (error) {
            console.error("Error fetching stock:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStock(search, showLowStock);
    }, [search, showLowStock]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchStock(search, showLowStock);
    };

    const handleLowStockToggle = () => {
        setShowLowStock(!showLowStock);
    };

    const loadMore = () => {
        if (pagination?.hasMore) {
            fetchStock(search, showLowStock, pagination.offset + pagination.limit);
        }
    };

    const addStock = async (e: React.FormEvent) => {
        e.preventDefault();
        setAddStockMessage("");

        if (!addStockSku || addStockQuantity <= 0) {
            setAddStockMessage("Please provide a valid SKU and quantity");
            return;
        }

        try {
            const response = await fetch("/api/products/stock", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    sku: addStockSku,
                    quantity: addStockQuantity,
                    unitCost: addStockUnitCost > 0 ? addStockUnitCost : undefined
                }),
            });

            if (response.ok) {
                setAddStockMessage("Stock updated successfully");
                setAddStockSku("");
                setAddStockQuantity(0);
                setAddStockUnitCost(0);
                // Refresh the stock data
                fetchStock(search, showLowStock);
            } else {
                const error = await response.json();
                setAddStockMessage(error.error || "Failed to update stock");
            }
        } catch (error) {
            setAddStockMessage("Network error occurred");
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD"
        }).format(amount);
    };

    const totalValue = products.reduce((sum, product) => sum + product.stockValue, 0);
    const lowStockCount = products.filter(product => product.isLowStock).length;
    const totalItems = pagination?.total || 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Stock Management</h1>
                <button
                    onClick={() => setShowAddStock(!showAddStock)}
                    className="btn btn-primary"
                >
                    {showAddStock ? "Hide Add Stock" : "Add Stock"}
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="rounded card p-4 text-center">
                    <div className="text-sm text-muted">Total Items</div>
                    <div className="text-2xl font-bold">{totalItems}</div>
                </div>
                <div className="rounded card p-4 text-center">
                    <div className="text-sm text-muted">Low Stock Items</div>
                    <div className="text-2xl font-bold text-orange-600">{lowStockCount}</div>
                </div>
                <div className="rounded card p-4 text-center">
                    <div className="text-sm text-muted">Total Stock Value</div>
                    <div className="text-2xl font-bold text-green-600">
                        {formatCurrency(totalValue)}
                    </div>
                </div>
                <div className="rounded card p-4 text-center">
                    <div className="text-sm text-muted">In Stock</div>
                    <div className="text-2xl font-bold">
                        {products.filter(p => p.totalStock > 0).length}
                    </div>
                </div>
            </div>

            {/* Add Stock Form */}
            {showAddStock && (
                <div className="rounded card p-6">
                    <h2 className="text-xl font-semibold mb-4">Add to Stock</h2>
                    <form onSubmit={addStock} className="space-y-4 max-w-md">
                        <div>
                            <input
                                value={addStockSku}
                                onChange={(e) => setAddStockSku(e.target.value)}
                                placeholder="SKU"
                                className="w-full px-3 py-2 rounded border bg-white text-black"
                                required
                            />
                        </div>
                        <div>
                            <input
                                value={addStockQuantity}
                                onChange={(e) => setAddStockQuantity(Number(e.target.value))}
                                type="number"
                                placeholder="Quantity"
                                min="1"
                                step="1"
                                className="w-full px-3 py-2 rounded border bg-white text-black"
                                required
                            />
                        </div>
                        <div>
                            <input
                                value={addStockUnitCost}
                                onChange={(e) => setAddStockUnitCost(Number(e.target.value))}
                                type="number"
                                placeholder="Unit Cost (optional)"
                                min="0"
                                step="0.01"
                                className="w-full px-3 py-2 rounded border bg-white text-black"
                            />
                        </div>
                        <button type="submit" className="btn btn-primary">
                            Add Stock
                        </button>
                    </form>
                    {addStockMessage && (
                        <p className={`mt-4 text-sm ${addStockMessage.includes("successfully") ? "text-green-600" : "text-red-600"}`}>
                            {addStockMessage}
                        </p>
                    )}
                </div>
            )}

            {/* Search and Filters */}
            <div className="rounded card p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    <form onSubmit={handleSearch} className="flex-1">
                        <div className="relative">
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by product name or SKU..."
                                className="w-full px-4 py-2 pl-10 rounded border bg-white text-black"
                            />
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                        </div>
                    </form>

                    <button
                        onClick={handleLowStockToggle}
                        className={`btn ${showLowStock ? "btn-primary" : "btn-secondary"}`}
                    >
                        {showLowStock ? "Show All Stock" : "Show Low Stock"}
                    </button>
                </div>
            </div>

            {/* Stock Table */}
            <div className="rounded card p-0 overflow-hidden">
                {loading && products.length === 0 ? (
                    <div className="p-8">
                        <div className="animate-pulse space-y-3">
                            <div className="h-4 bg-black/10 rounded"></div>
                            <div className="h-4 bg-black/10 rounded"></div>
                            <div className="h-4 bg-black/10 rounded"></div>
                        </div>
                    </div>
                ) : products.length === 0 ? (
                    <div className="p-8 text-center text-muted">
                        {showLowStock ? "No low stock items found." : "No products found."}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead className="bg-black/5">
                                <tr>
                                    <th className="text-left p-4">Product</th>
                                    <th className="text-left p-4">SKU</th>
                                    <th className="text-left p-4">Size</th>
                                    <th className="text-left p-4">Color</th>
                                    <th className="text-right p-4">Stock</th>
                                    <th className="text-right p-4">Reorder</th>
                                    <th className="text-right p-4">Avg Cost</th>
                                    <th className="text-right p-4">Value</th>
                                    <th className="text-center p-4">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.map((product) =>
                                    product.variants.map((variant, variantIndex) => (
                                        <tr key={`${product._id}-${variantIndex}`} className="border-t hover:bg-black/5">
                                            {variantIndex === 0 && (
                                                <td className="p-4 font-medium" rowSpan={product.variants.length}>
                                                    {product.name}
                                                </td>
                                            )}
                                            <td className="p-4 font-mono text-sm">{variant.sku}</td>
                                            <td className="p-4">{variant.size || "-"}</td>
                                            <td className="p-4">{variant.color || "-"}</td>
                                            <td className="p-4 text-right font-medium">
                                                {variant.stockQuantity}
                                            </td>
                                            <td className="p-4 text-right text-muted">
                                                {variant.reorderLevel}
                                            </td>
                                            {variantIndex === 0 && (
                                                <>
                                                    <td className="p-4 text-right" rowSpan={product.variants.length}>
                                                        {formatCurrency(product.averageCost)}
                                                    </td>
                                                    <td className="p-4 text-right font-medium" rowSpan={product.variants.length}>
                                                        {formatCurrency(product.stockValue)}
                                                    </td>
                                                    <td className="p-4 text-center" rowSpan={product.variants.length}>
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                            product.isLowStock
                                                                ? "text-orange-600 bg-orange-100"
                                                                : "text-green-600 bg-green-100"
                                                        }`}>
                                                            {product.isLowStock ? "Low Stock" : "In Stock"}
                                                        </span>
                                                    </td>
                                                </>
                                            )}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Load More */}
            {pagination?.hasMore && (
                <div className="text-center">
                    <button
                        onClick={loadMore}
                        className="btn btn-secondary"
                        disabled={loading}
                    >
                        {loading ? "Loading..." : "Load More"}
                    </button>
                </div>
            )}
        </div>
    );
}
