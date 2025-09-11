"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Invoice = {
    _id: string;
    invoiceNumber: string;
    issuedAt: string;
    amount: number;
    amountPaid: number;
    balance: number;
    customer: string;
    saleId: string;
    status: "unpaid" | "partially_paid" | "paid";
};

type PaginationInfo = {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
};

export default function InvoicesPage() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [pagination, setPagination] = useState<PaginationInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>("");
    const [paying, setPaying] = useState<Invoice | null>(null);
    const router = useRouter();

    const fetchInvoices = async (status?: string, offset = 0) => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (status) params.set("status", status);
            if (offset > 0) params.set("offset", offset.toString());

            const response = await fetch(`/api/invoices?${params}`);
            if (!response.ok) throw new Error("Failed to fetch invoices");

            const data = await response.json();
            if (offset === 0) {
                setInvoices(data.invoices);
            } else {
                setInvoices(prev => [...prev, ...data.invoices]);
            }
            setPagination(data.pagination);
        } catch (error) {
            console.error("Error fetching invoices:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInvoices(statusFilter);
    }, [statusFilter]);

    const handleStatusFilter = (status: string) => {
        setStatusFilter(status);
    };

    const loadMore = () => {
        if (pagination?.hasMore) {
            fetchInvoices(statusFilter, pagination.offset + pagination.limit);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "paid": return "text-green-600 bg-green-100";
            case "partially_paid": return "text-yellow-600 bg-yellow-100";
            case "unpaid": return "text-red-600 bg-red-100";
            default: return "text-gray-600 bg-gray-100";
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD"
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric"
        });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Invoices</h1>
                <Link
                    href="/dashboard/sales"
                    className="btn btn-primary"
                >
                    Create Sale
                </Link>
            </div>

            {/* Filters */}
            <div className="flex gap-4">
                <button
                    onClick={() => handleStatusFilter("")}
                    className={`btn ${statusFilter === "" ? "btn-primary" : "btn-secondary"}`}
                >
                    All
                </button>
                <button
                    onClick={() => handleStatusFilter("unpaid")}
                    className={`btn ${statusFilter === "unpaid" ? "btn-primary" : "btn-secondary"}`}
                >
                    Unpaid
                </button>
                <button
                    onClick={() => handleStatusFilter("partially_paid")}
                    className={`btn ${statusFilter === "partially_paid" ? "btn-primary" : "btn-secondary"}`}
                >
                    Partially Paid
                </button>
                <button
                    onClick={() => handleStatusFilter("paid")}
                    className={`btn ${statusFilter === "paid" ? "btn-primary" : "btn-secondary"}`}
                >
                    Paid
                </button>
            </div>

            {/* Invoices List */}
            <div className="rounded card p-0 overflow-hidden">
                {loading && invoices.length === 0 ? (
                    <div className="p-8">
                        <div className="animate-pulse space-y-3">
                            <div className="h-4 bg-black/10 rounded"></div>
                            <div className="h-4 bg-black/10 rounded"></div>
                            <div className="h-4 bg-black/10 rounded"></div>
                        </div>
                    </div>
                ) : invoices.length === 0 ? (
                    <div className="p-8 text-center text-muted">
                        No invoices found. Create a sale and generate an invoice to get started.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead className="bg-black/5">
                                <tr>
                                    <th className="text-left p-4">Invoice #</th>
                                    <th className="text-left p-4">Date</th>
                                    <th className="text-left p-4">Customer</th>
                                    <th className="text-right p-4">Amount</th>
                                    <th className="text-right p-4">Paid</th>
                                    <th className="text-right p-4">Balance</th>
                                    <th className="text-center p-4">Status</th>
                                    <th className="text-center p-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoices.map((invoice) => (
                                    <tr key={invoice._id} className="border-t hover:bg-black/5">
                                        <td className="p-4 font-medium">
                                            {invoice.invoiceNumber}
                                        </td>
                                        <td className="p-4 text-muted">
                                            {formatDate(invoice.issuedAt)}
                                        </td>
                                        <td className="p-4">
                                            {invoice.customer}
                                        </td>
                                        <td className="p-4 text-right font-medium">
                                            {formatCurrency(invoice.amount)}
                                        </td>
                                        <td className="p-4 text-right text-green-600">
                                            {formatCurrency(invoice.amountPaid)}
                                        </td>
                                        <td className="p-4 text-right font-medium">
                                            {formatCurrency(invoice.balance)}
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(invoice.status)}`}>
                                                {invoice.status.replace("_", " ")}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center space-x-2">
                                            <Link href={`/dashboard/invoices/${invoice._id}/print`} target="_blank" className="btn btn-secondary text-sm">Print</Link>
                                            {invoice.balance > 0 && (
                                                <button className="btn btn-primary text-sm" onClick={() => setPaying(invoice)}>Add Payment</button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
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

            {/* Summary */}
            {invoices.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="rounded card p-4 text-center">
                        <div className="text-sm text-muted">Total Invoices</div>
                        <div className="text-2xl font-bold">{pagination?.total || invoices.length}</div>
                    </div>
                    <div className="rounded card p-4 text-center">
                        <div className="text-sm text-muted">Total Amount</div>
                        <div className="text-2xl font-bold">
                            {formatCurrency(invoices.reduce((sum, inv) => sum + inv.amount, 0))}
                        </div>
                    </div>
                    <div className="rounded card p-4 text-center">
                        <div className="text-sm text-muted">Total Paid</div>
                        <div className="text-2xl font-bold text-green-600">
                            {formatCurrency(invoices.reduce((sum, inv) => sum + inv.amountPaid, 0))}
                        </div>
                    </div>
                    <div className="rounded card p-4 text-center">
                        <div className="text-sm text-muted">Outstanding</div>
                        <div className="text-2xl font-bold text-red-600">
                            {formatCurrency(invoices.reduce((sum, inv) => sum + inv.balance, 0))}
                        </div>
                    </div>
                </div>
            )}
            {paying && (
                <RecordPaymentModal invoice={paying} onClose={() => setPaying(null)} onSaved={() => { setPaying(null); fetchInvoices(statusFilter); }} />
            )}
        </div>
    );
}

function RecordPaymentModal({ invoice, onClose, onSaved }: { invoice: Invoice; onClose: () => void; onSaved: () => void }) {
    const [amount, setAmount] = useState<number>(0);
    const [method, setMethod] = useState<string>("cash");
    const [paidAt, setPaidAt] = useState<string>(() => new Date().toISOString().slice(0, 10));
    const canSubmit = useMemo(() => amount > 0, [amount]);

    async function submit(e: React.FormEvent) {
        e.preventDefault();
        const res = await fetch("/api/payments", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ invoice: invoice._id, amount, method: method as any, paidAt }),
        });
        if (res.ok) onSaved();
    }

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
            <div className="w-full max-w-md card rounded-lg shadow">
                <div className="flex items-center justify-between px-4 py-3 border-b">
                    <div className="font-medium text-black">Record payment for {invoice.invoiceNumber}</div>
                    <button onClick={onClose} className="text-sm">✕</button>
                </div>
                <form onSubmit={submit} className="p-4 space-y-3">
                    <div>
                        <label className="text-xs text-gray-600">Amount</label>
                        <input type="number" min={0.01} step="0.01" className="w-full px-3 py-2 rounded border" value={amount} onChange={(e) => setAmount(Number(e.target.value) || 0)} placeholder="0.00" />
                    </div>
                    <div>
                        <label className="text-xs text-gray-600">Method</label>
                        <select className="w-full px-3 py-2 rounded border bg-white text-black" value={method} onChange={(e) => setMethod(e.target.value)}>
                            <option value="cash">Cash</option>
                            <option value="bank">Bank</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs text-gray-600">Paid at</label>
                        <input type="date" className="w-full px-3 py-2 rounded border" value={paidAt} onChange={(e) => setPaidAt(e.target.value)} />
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-1">
                        <button type="button" onClick={onClose} className="btn btn-outline">Cancel</button>
                        <button disabled={!canSubmit} className="btn btn-primary disabled:opacity-50">Save</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
