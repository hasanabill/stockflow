"use client";

import { useMemo, useState } from "react";

type Biz = { _id: string; name: string; slug: string; status: string; description?: string };

export default function BusinessListClient({ businesses }: { businesses: Biz[] }) {
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });

  async function selectBusiness(id: string) {
    await fetch("/api/businesses/select", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessId: id }),
    });
    window.location.href = "/dashboard";
  }

  async function createBusiness(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    const res = await fetch("/api/businesses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name, description: form.description || undefined }),
    });
    if (res.ok) {
      const created = await res.json();
      await selectBusiness(created._id);
    }
  }

  const items = useMemo(() => businesses, [businesses]);

  return (
    <div>
      <div className="mb-4">
        <button
          className="px-3 py-2 rounded bg-black text-white"
          onClick={() => setCreating(true)}
        >
          Create business
        </button>
      </div>
      {creating && (
        <div className="mb-6 border rounded p-4">
          <form onSubmit={createBusiness} className="space-y-3">
            <div>
              <label className="block text-sm mb-1">Name</label>
              <input
                className="w-full px-3 py-2 rounded border"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Business name"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Description</label>
              <input
                className="w-full px-3 py-2 rounded border"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Optional"
              />
            </div>
            <div className="flex gap-2">
              <button type="button" className="px-3 py-2 rounded border" onClick={() => setCreating(false)}>
                Cancel
              </button>
              <button className="px-3 py-2 rounded bg-black text-white">Create</button>
            </div>
          </form>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((b) => (
          <button
            key={b._id}
            onClick={() => selectBusiness(b._id)}
            className="text-left rounded border p-4 hover:shadow transition"
          >
            <div className="text-lg font-medium">{b.name}</div>
            <div className="text-xs text-gray-600 mt-0.5">/{b.slug} · {b.status}</div>
            {b.description && (
              <div className="text-sm text-gray-600 mt-1">{b.description}</div>
            )}
          </button>
        ))}
        {items.length === 0 && (
          <div className="text-sm text-gray-600">No businesses yet. Create one to get started.</div>
        )}
      </div>
    </div>
  );
}


