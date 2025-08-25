"use client";
import { useEffect, useMemo, useState } from "react";

type Variant = {
  sku: string;
  size?: string;
  color?: string;
  stockQuantity: number;
};
type Product = { _id: string; name: string; variants: Variant[] };
type SaleItemInput = {
  productId: string;
  variantSku: string;
  quantity: number;
  unitPrice: number;
};
type Sale = {
  _id: string;
  createdAt: string;
  items: { variantSku: string; quantity: number }[];
  subtotal: number;
  total: number;
};

export default function SalesPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<SaleItemInput[]>([
    { productId: "", variantSku: "", quantity: 1, unitPrice: 0 },
  ]);
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);

  useEffect(() => {
    (async () => {
      const [prodRes, salesRes] = await Promise.all([
        fetch("/api/products"),
        fetch("/api/sales"),
      ]);
      setProducts(await prodRes.json());
      setSales(await salesRes.json());
      setLoading(false);
    })();
  }, []);

  const subtotal = useMemo(
    () => items.reduce((s, i) => s + (i.quantity || 0) * (i.unitPrice || 0), 0),
    [items]
  );
  const total = useMemo(
    () => Math.max(0, subtotal - (discount || 0) + (tax || 0)),
    [subtotal, discount, tax]
  );

  function updateItem(index: number, change: Partial<SaleItemInput>) {
    setItems((prev) =>
      prev.map((it, i) => (i === index ? { ...it, ...change } : it))
    );
  }
  function addItem() {
    setItems((prev) => [
      ...prev,
      { productId: "", variantSku: "", quantity: 1, unitPrice: 0 },
    ]);
  }
  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/sales", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items, discount, tax }),
    });
    if (!res.ok) return;
    const created = await res.json();
    setSales((prev) => [created, ...prev]);
    // refresh product stocks
    const prodRes = await fetch("/api/products");
    setProducts(await prodRes.json());
    setItems([{ productId: "", variantSku: "", quantity: 1, unitPrice: 0 }]);
    setDiscount(0);
    setTax(0);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Sales</h1>

      <form onSubmit={submit} className="space-y-4 rounded card p-4">
        <div className="flex items-center justify-between">
          <div className="font-medium">Record new sale</div>
          <div className="text-sm">
            Subtotal: {subtotal.toFixed(2)} | Total: {total.toFixed(2)}
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm muted">Items</div>
            <button
              type="button"
              onClick={addItem}
              className="text-sm px-2 py-1 btn-outline rounded"
            >
              Add item
            </button>
          </div>
          {items.map((it, idx) => {
            const product = products.find((p) => p._id === it.productId);
            const variants = product?.variants ?? [];
            return (
              <div key={idx} className="grid grid-cols-1 md:grid-cols-5 gap-2">
                <div className="space-y-1">
                  <label
                    htmlFor={`sale-item-${idx}-product`}
                    className="text-xs text-gray-600"
                  >
                    Product
                  </label>
                  <select
                    id={`sale-item-${idx}-product`}
                    value={it.productId}
                    onChange={(e) =>
                      updateItem(idx, {
                        productId: e.target.value,
                        variantSku: "",
                      })
                    }
                    className="px-2 py-2 rounded border bg-white text-black w-full"
                  >
                    <option value="">Select product</option>
                    {products.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label
                    htmlFor={`sale-item-${idx}-variant`}
                    className="text-xs text-gray-600"
                  >
                    Variant
                  </label>
                  <select
                    id={`sale-item-${idx}-variant`}
                    value={it.variantSku}
                    onChange={(e) =>
                      updateItem(idx, { variantSku: e.target.value })
                    }
                    className="px-2 py-2 rounded border bg-white text-black w-full"
                    disabled={!product}
                  >
                    <option value="">Variant</option>
                    {variants.map((v) => (
                      <option key={v.sku} value={v.sku}>{`${v.size ?? "-"}/${
                        v.color ?? "-"
                      } (${v.sku}) | stock: ${v.stockQuantity}`}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label
                    htmlFor={`sale-item-${idx}-qty`}
                    className="text-xs text-gray-600"
                  >
                    Quantity
                  </label>
                  <input
                    id={`sale-item-${idx}-qty`}
                    type="number"
                    min={1}
                    value={it.quantity}
                    onChange={(e) =>
                      updateItem(idx, { quantity: Number(e.target.value) || 1 })
                    }
                    className="px-2 py-2 rounded border w-full"
                    placeholder="Qty"
                  />
                </div>
                <div className="space-y-1">
                  <label
                    htmlFor={`sale-item-${idx}-price`}
                    className="text-xs text-gray-600"
                  >
                    Unit price
                  </label>
                  <input
                    id={`sale-item-${idx}-price`}
                    type="number"
                    min={0}
                    step="0.01"
                    value={it.unitPrice}
                    onChange={(e) =>
                      updateItem(idx, {
                        unitPrice: Number(e.target.value) || 0,
                      })
                    }
                    className="px-2 py-2 rounded border w-full"
                    placeholder="Unit price"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-sm text-gray-600 w-full">
                    {(it.quantity * it.unitPrice).toFixed(2)}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    className="text-sm px-2 py-1 btn-outline rounded"
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <div className="space-y-1 flex flex-col">
            <label htmlFor="sale-discount" className="text-xs text-gray-600">
              Discount
            </label>
            <input
              id="sale-discount"
              type="number"
              min={0}
              step="0.01"
              value={discount}
              onChange={(e) => setDiscount(Number(e.target.value) || 0)}
              className="px-2 py-2 rounded border"
              placeholder="0.00"
            />
          </div>
          <div className="space-y-1 flex flex-col">
            <label htmlFor="sale-tax" className="text-xs text-gray-600">
              Tax
            </label>
            <input
              id="sale-tax"
              type="number"
              min={0}
              step="0.01"
              value={tax}
              onChange={(e) => setTax(Number(e.target.value) || 0)}
              className="px-2 py-2 rounded border"
              placeholder="0.00"
            />
          </div>
          <button className="btn btn-primary">Save sale</button>
        </div>
      </form>

      <div className="overflow-hidden rounded card">
        <table className="min-w-full text-sm">
          <thead className="bg-black/5">
            <tr>
              <th className="text-left p-3">Date</th>
              <th className="text-left p-3">Items</th>
              <th className="text-left p-3">Subtotal</th>
              <th className="text-left p-3">Total</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="p-3" colSpan={4}>
                  Loading…
                </td>
              </tr>
            ) : sales.length === 0 ? (
              <tr>
                <td className="p-3" colSpan={4}>
                  No sales
                </td>
              </tr>
            ) : (
              sales.map((s) => (
                <tr key={s._id} className="border-t">
                  <td className="p-3">
                    {new Date(s.createdAt).toLocaleString()}
                  </td>
                  <td className="p-3">
                    {s.items
                      .map((i) => `${i.variantSku} x${i.quantity}`)
                      .join(", ")}
                  </td>
                  <td className="p-3">{Number(s.subtotal).toFixed(2)}</td>
                  <td className="p-3">{Number(s.total).toFixed(2)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
