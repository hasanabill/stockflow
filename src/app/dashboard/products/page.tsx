"use client";
import { useState } from "react";

export default function ProductsPage() {
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [price, setPrice] = useState<number>(0);
  const [message, setMessage] = useState<string>("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, sku, price }),
    });
    if (res.ok) setMessage("Product saved");
    else setMessage("Failed");
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Create product</h2>
      <form onSubmit={submit} className="space-y-3 max-w-md">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          className="w-full px-3 py-2 rounded border bg-white text-black"
        />
        <input
          value={sku}
          onChange={(e) => setSku(e.target.value)}
          placeholder="SKU"
          className="w-full px-3 py-2 rounded border bg-white text-black"
        />
        <input
          value={price}
          onChange={(e) => setPrice(Number(e.target.value))}
          type="number"
          step="0.01"
          placeholder="Price"
          className="w-full px-3 py-2 rounded border bg-white text-black"
        />
        <button className="px-4 py-2 rounded bg-black text-white">Save</button>
      </form>
      {message && <p className="text-sm">{message}</p>}
    </div>
  );
}
