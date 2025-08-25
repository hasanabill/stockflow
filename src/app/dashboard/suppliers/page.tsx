"use client";
import { useEffect, useMemo, useState } from "react";

type Supplier = { _id: string; name: string; email?: string; phone?: string };
type Product = {
  _id: string;
  name: string;
  variants: { sku: string; size?: string; color?: string }[];
};

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [openSupplier, setOpenSupplier] = useState(false);
  const [openPO, setOpenPO] = useState(false);
  const [supplierForm, setSupplierForm] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [poForm, setPoForm] = useState<{
    reference: string;
    supplier: string;
    items: {
      product: string;
      variantSku: string;
      quantityOrdered: number;
      unitCost: number;
    }[];
    expectedDate: string;
    tax: string;
    notes: string;
  }>({
    reference: "",
    supplier: "",
    items: [{ product: "", variantSku: "", quantityOrdered: 1, unitCost: 0 }],
    expectedDate: "",
    tax: "",
    notes: "",
  });

  useEffect(() => {
    (async () => {
      const [sRes, pRes] = await Promise.all([
        fetch("/api/suppliers"),
        fetch("/api/products"),
      ]);
      setSuppliers(await sRes.json());
      setProducts(await pRes.json());
      setLoading(false);
    })();
  }, []);

  async function createSupplier(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/suppliers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(supplierForm),
    });
    if (!res.ok) return;
    const created = await res.json();
    setSuppliers([created, ...suppliers]);
    setOpenSupplier(false);
    setSupplierForm({ name: "", email: "", phone: "" });
  }

  function updatePOItem(
    index: number,
    change: Partial<{
      product: string;
      variantSku: string;
      quantityOrdered: number;
      unitCost: number;
    }>
  ) {
    setPoForm((prev) => ({
      ...prev,
      items: prev.items.map((it, i) =>
        i === index ? { ...it, ...change } : it
      ),
    }));
  }
  function addPOItem() {
    setPoForm((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        { product: "", variantSku: "", quantityOrdered: 1, unitCost: 0 },
      ],
    }));
  }
  function removePOItem(index: number) {
    setPoForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  }

  async function createPO(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      reference: poForm.reference,
      supplier: poForm.supplier,
      expectedDate: poForm.expectedDate
        ? new Date(poForm.expectedDate)
        : undefined,
      tax: Number(poForm.tax || 0),
      notes: poForm.notes || undefined,
      items: poForm.items,
    };
    const res = await fetch("/api/purchase-orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return;
    setOpenPO(false);
    setPoForm({
      reference: "",
      supplier: "",
      items: [{ product: "", variantSku: "", quantityOrdered: 1, unitCost: 0 }],
      expectedDate: "",
      tax: "",
      notes: "",
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Suppliers</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setOpenSupplier(true)}
            className="btn btn-primary"
          >
            Add supplier
          </button>
          <button onClick={() => setOpenPO(true)} className="btn btn-outline">
            New PO
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded card">
        <table className="min-w-full text-sm">
          <thead className="bg-black/5">
            <tr>
              <th className="text-left p-3">Name</th>
              <th className="text-left p-3">Email</th>
              <th className="text-left p-3">Phone</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="p-3" colSpan={3}>
                  Loading…
                </td>
              </tr>
            ) : suppliers.length === 0 ? (
              <tr>
                <td className="p-3" colSpan={3}>
                  No suppliers
                </td>
              </tr>
            ) : (
              suppliers.map((s) => (
                <tr key={s._id} className="border-t">
                  <td className="p-3">{s.name}</td>
                  <td className="p-3">{s.email || "-"}</td>
                  <td className="p-3">{s.phone || "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {openSupplier && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md card rounded-lg shadow">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div className="font-medium text-black">Add supplier</div>
              <button
                onClick={() => setOpenSupplier(false)}
                className="text-sm"
              >
                ✕
              </button>
            </div>
            <form onSubmit={createSupplier} className="p-4 space-y-3">
              <div className="space-y-1">
                <label
                  htmlFor="supplier-name"
                  className="text-xs text-gray-600"
                >
                  Name
                </label>
                <input
                  id="supplier-name"
                  value={supplierForm.name}
                  onChange={(e) =>
                    setSupplierForm({ ...supplierForm, name: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded border"
                  placeholder="Name"
                />
              </div>
              <div className="space-y-1">
                <label
                  htmlFor="supplier-email"
                  className="text-xs text-gray-600"
                >
                  Email
                </label>
                <input
                  id="supplier-email"
                  value={supplierForm.email}
                  onChange={(e) =>
                    setSupplierForm({ ...supplierForm, email: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded border"
                  placeholder="Email"
                />
              </div>
              <div className="space-y-1">
                <label
                  htmlFor="supplier-phone"
                  className="text-xs text-gray-600"
                >
                  Phone
                </label>
                <input
                  id="supplier-phone"
                  value={supplierForm.phone}
                  onChange={(e) =>
                    setSupplierForm({ ...supplierForm, phone: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded border"
                  placeholder="Phone"
                />
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOpenSupplier(false)}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <button className="btn btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {openPO && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-3xl card rounded-lg shadow">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div className="font-medium text-black">New purchase order</div>
              <button onClick={() => setOpenPO(false)} className="text-sm">
                ✕
              </button>
            </div>
            <form onSubmit={createPO} className="p-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label htmlFor="po-ref" className="text-xs text-gray-600">
                    Reference
                  </label>
                  <input
                    id="po-ref"
                    value={poForm.reference}
                    onChange={(e) =>
                      setPoForm({ ...poForm, reference: e.target.value })
                    }
                    className="px-3 py-2 rounded border w-full"
                    placeholder="Reference"
                  />
                </div>
                <div className="space-y-1">
                  <label
                    htmlFor="po-supplier"
                    className="text-xs text-gray-600"
                  >
                    Supplier
                  </label>
                  <select
                    id="po-supplier"
                    value={poForm.supplier}
                    onChange={(e) =>
                      setPoForm({ ...poForm, supplier: e.target.value })
                    }
                    className="px-3 py-2 rounded border w-full"
                  >
                    <option value="">Select supplier</option>
                    {suppliers.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label
                    htmlFor="po-expected"
                    className="text-xs text-gray-600"
                  >
                    Expected date
                  </label>
                  <input
                    id="po-expected"
                    type="date"
                    value={poForm.expectedDate}
                    onChange={(e) =>
                      setPoForm({ ...poForm, expectedDate: e.target.value })
                    }
                    className="px-3 py-2 rounded border w-full"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-medium text-black">Items</div>
                  <button
                    type="button"
                    onClick={addPOItem}
                    className="text-sm px-2 py-1 btn-outline rounded"
                  >
                    Add item
                  </button>
                </div>
                <div className="space-y-2">
                  {poForm.items.map((it, idx) => {
                    const product = products.find((p) => p._id === it.product);
                    const variants = product?.variants ?? [];
                    return (
                      <div
                        key={idx}
                        className="grid grid-cols-1 md:grid-cols-5 gap-2"
                      >
                        <div className="space-y-1">
                          <label
                            htmlFor={`po-item-${idx}-product`}
                            className="text-xs text-gray-600"
                          >
                            Product
                          </label>
                          <select
                            id={`po-item-${idx}-product`}
                            value={it.product}
                            onChange={(e) =>
                              updatePOItem(idx, {
                                product: e.target.value,
                                variantSku: "",
                              })
                            }
                            className="px-2 py-2 rounded border w-full"
                          >
                            <option value="">Product</option>
                            {products.map((p) => (
                              <option key={p._id} value={p._id}>
                                {p.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label
                            htmlFor={`po-item-${idx}-variant`}
                            className="text-xs text-gray-600"
                          >
                            Variant
                          </label>
                          <select
                            id={`po-item-${idx}-variant`}
                            value={it.variantSku}
                            onChange={(e) =>
                              updatePOItem(idx, { variantSku: e.target.value })
                            }
                            className="px-2 py-2 rounded border w-full"
                            disabled={!product}
                          >
                            <option value="">Variant</option>
                            {variants.map((v) => (
                              <option key={v.sku} value={v.sku}>{`${
                                v.size ?? "-"
                              }/${v.color ?? "-"} (${v.sku})`}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label
                            htmlFor={`po-item-${idx}-qty`}
                            className="text-xs text-gray-600"
                          >
                            Qty
                          </label>
                          <input
                            id={`po-item-${idx}-qty`}
                            type="number"
                            min={1}
                            value={it.quantityOrdered}
                            onChange={(e) =>
                              updatePOItem(idx, {
                                quantityOrdered: Number(e.target.value) || 1,
                              })
                            }
                            className="px-2 py-2 rounded border w-full"
                            placeholder="Qty"
                          />
                        </div>
                        <div className="space-y-1">
                          <label
                            htmlFor={`po-item-${idx}-cost`}
                            className="text-xs text-gray-600"
                          >
                            Unit cost
                          </label>
                          <input
                            id={`po-item-${idx}-cost`}
                            type="number"
                            min={0}
                            step="0.01"
                            value={it.unitCost}
                            onChange={(e) =>
                              updatePOItem(idx, {
                                unitCost: Number(e.target.value) || 0,
                              })
                            }
                            className="px-2 py-2 rounded border w-full"
                            placeholder="Unit cost"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-sm text-gray-600 w-full">
                            {(it.quantityOrdered * it.unitCost).toFixed(2)}
                          </div>
                          <button
                            type="button"
                            onClick={() => removePOItem(idx)}
                            className="text-sm px-2 py-1 btn-outline rounded"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  value={poForm.tax}
                  onChange={(e) =>
                    setPoForm({ ...poForm, tax: e.target.value })
                  }
                  className="px-3 py-2 rounded border"
                  placeholder="Tax"
                />
                <input
                  value={poForm.notes}
                  onChange={(e) =>
                    setPoForm({ ...poForm, notes: e.target.value })
                  }
                  className="px-3 py-2 rounded border"
                  placeholder="Notes"
                />
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOpenPO(false)}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <button className="btn btn-primary">Create PO</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
