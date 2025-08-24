"use client";
import { useState } from "react";

export default function StockPage() {
  const [sku, setSku] = useState("");
  const [quantity, setQuantity] = useState<number>(0);
  const [message, setMessage] = useState<string>("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    const res = await fetch("/api/products/stock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sku, quantity }),
    });
    if (res.ok) setMessage("Stock updated");
    else setMessage("Failed");
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Add to stock</h2>
      <form onSubmit={submit} className="space-y-3 max-w-md">
        <input
          value={sku}
          onChange={(e) => setSku(e.target.value)}
          placeholder="SKU"
          className="w-full px-3 py-2 rounded border bg-white text-black"
        />
        <input
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          type="number"
          placeholder="Quantity"
          className="w-full px-3 py-2 rounded border bg-white text-black"
        />
        <button className="px-4 py-2 rounded bg-black text-white">Save</button>
      </form>
      {message && <p className="text-sm">{message}</p>}
    </div>
  );
}
