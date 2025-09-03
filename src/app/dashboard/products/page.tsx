"use client";
import { useEffect, useMemo, useState } from "react";

type Variant = {
  sku: string;
  size?: string;
  color?: string;
  stockQuantity: number;
  reorderLevel?: number;
};
type Product = {
  _id: string;
  name: string;
  category?: string;
  attributes?: Record<string, any>;
  variants: Variant[];
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/products");
      const data = await res.json();
      setProducts(data);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Products</h1>
        <button onClick={() => setOpen(true)} className="btn btn-primary">
          New product
        </button>
      </div>

      <div className="overflow-hidden rounded card">
        <table className="min-w-full text-sm">
          <thead className="bg-black/5">
            <tr>
              <th className="text-left p-3">Name</th>
              <th className="text-left p-3">Category</th>
              <th className="text-left p-3">Variants</th>
              <th className="text-left p-3">Stock</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="p-3" colSpan={4}>
                  Loading…
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td className="p-3" colSpan={4}>
                  No products
                </td>
              </tr>
            ) : (
              products.map((p) => {
                const variantsLabel = p.variants
                  .map((v) => `${v.size ?? "-"}/${v.color ?? "-"} (${v.sku})`)
                  .join(", ");
                const totalStock = p.variants.reduce(
                  (sum, v) => sum + (v.stockQuantity || 0),
                  0
                );
                return (
                  <tr key={p._id} className="border-t">
                    <td className="p-3">{p.name}</td>
                    <td className="p-3">{p.category || "-"}</td>
                    <td className="p-3">{variantsLabel || "-"}</td>
                    <td className="p-3">{totalStock}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {open && (
        <CreateProductModal
          onClose={() => setOpen(false)}
          onCreated={(prod) => {
            setProducts([prod, ...products]);
            setOpen(false);
          }}
        />
      )}
    </div>
  );
}

function CreateProductModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (p: Product) => void;
}) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [variants, setVariants] = useState<Variant[]>([
    { sku: "", size: "", color: "", stockQuantity: 0 },
  ] as Variant[]);
  const [attributes, setAttributes] = useState<Record<string, any>>({});
  const canSubmit = useMemo(
    () =>
      name.trim().length > 0 && variants.every((v) => v.sku.trim().length > 0),
    [name, variants]
  );

  function updateVariant(index: number, change: Partial<Variant>) {
    setVariants((prev) =>
      prev.map((v, i) => (i === index ? { ...v, ...change } : v))
    );
  }
  function addVariant() {
    setVariants((prev) => [
      ...prev,
      { sku: "", size: "", color: "", stockQuantity: 0 },
    ]);
  }
  function removeVariant(index: number) {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, category, variants, attributes }),
    });
    if (!res.ok) return;
    const created = await res.json();
    onCreated(created);
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-3xl card rounded-lg shadow">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="font-medium text-black">New product</div>
          <button onClick={onClose} className="text-sm">
            ✕
          </button>
        </div>
        <form onSubmit={submit} className="p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-gray-600">Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded border"
                placeholder="T-Shirt"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-600">Category</label>
              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded border"
                placeholder="Tops"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-gray-600">Attributes (JSON)</label>
            <textarea
              value={JSON.stringify(attributes)}
              onChange={(e) => {
                try {
                  const v = JSON.parse(e.target.value || "{}");
                  setAttributes(v);
                } catch {
                  // ignore
                }
              }}
              className="w-full px-3 py-2 rounded border font-mono text-xs"
              rows={4}
              placeholder='{"size":"M","color":"Black"}'
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="font-medium text-black">Variants</div>
              <button
                type="button"
                onClick={addVariant}
                className="text-sm px-2 py-1 btn-outline rounded"
              >
                Add variant
              </button>
            </div>
            <div className="hidden sm:grid grid-cols-5 gap-2 text-xs text-gray-600 px-1">
              <div>SKU</div>
              <div>Size</div>
              <div>Color</div>
              <div>Stock</div>
              <div>Reorder</div>
            </div>
            <div className="space-y-3">
              {variants.map((v, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-1 sm:grid-cols-5 gap-2"
                >
                  <input
                    value={v.sku}
                    onChange={(e) =>
                      updateVariant(idx, { sku: e.target.value })
                    }
                    className="px-2 py-2 rounded border"
                    placeholder="SKU"
                  />
                  <input
                    value={v.size || ""}
                    onChange={(e) =>
                      updateVariant(idx, { size: e.target.value })
                    }
                    className="px-2 py-2 rounded border"
                    placeholder="Size"
                  />
                  <input
                    value={v.color || ""}
                    onChange={(e) =>
                      updateVariant(idx, { color: e.target.value })
                    }
                    className="px-2 py-2 rounded border"
                    placeholder="Color"
                  />
                  <input
                    type="number"
                    value={v.stockQuantity}
                    onChange={(e) =>
                      updateVariant(idx, {
                        stockQuantity: Number(e.target.value) || 0,
                      })
                    }
                    className="px-2 py-2 rounded border"
                    placeholder="Stock"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={v.reorderLevel || 0}
                      onChange={(e) =>
                        updateVariant(idx, {
                          reorderLevel: Number(e.target.value) || 0,
                        })
                      }
                      className="px-2 py-2 rounded border w-full"
                      placeholder="Reorder lvl"
                    />
                    <button
                      type="button"
                      onClick={() => removeVariant(idx)}
                      className="text-sm px-2 py-1 btn-outline rounded"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn btn-outline">
              Cancel
            </button>
            <button
              disabled={!canSubmit}
              className="btn btn-primary disabled:opacity-50"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
