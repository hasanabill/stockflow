"use client";
import { useEffect, useMemo, useState } from "react";

type Customer = {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  isActive?: boolean;
};

export default function CustomersPage() {
  const [items, setItems] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [q, setQ] = useState("");
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  async function load(reset = true) {
    setLoading(true);
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    params.set("limit", "50");
    params.set("offset", String(reset ? 0 : offset));
    const res = await fetch(`/api/customers?${params.toString()}`);
    const data = await res.json();
    setItems(reset ? (data.customers || []) : [...items, ...(data.customers || [])]);
    setHasMore(Boolean(data.pagination?.hasMore));
    setOffset(data.pagination?.offset || 0);
    setLoading(false);
  }

  useEffect(() => {
    load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Customers</h1>
        <button onClick={() => { setEditing(null); setOpen(true); }} className="btn btn-primary">
          New customer
        </button>
      </div>

      <div className="overflow-hidden rounded card">
        <div className="p-3 border-b flex items-center gap-2">
          <input className="px-3 py-2 rounded border w-full" placeholder="Search name/email/phone" value={q} onChange={(e) => setQ(e.target.value)} />
          <button className="btn btn-outline" onClick={() => load(true)}>Search</button>
        </div>
        <table className="min-w-full text-sm">
          <thead className="bg-black/5">
            <tr>
              <th className="text-left p-3">Name</th>
              <th className="text-left p-3">Email</th>
              <th className="text-left p-3">Phone</th>
              <th className="text-left p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="p-3" colSpan={4}>
                  <div className="animate-pulse space-y-2">
                    <div className="h-4 bg-black/10 rounded"></div>
                    <div className="h-4 bg-black/10 rounded"></div>
                    <div className="h-4 bg-black/10 rounded"></div>
                  </div>
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td className="p-3" colSpan={4}>No customers</td>
              </tr>
            ) : (
              items.map((c) => (
                <tr key={c._id} className="border-t">
                  <td className="p-3">{c.name}</td>
                  <td className="p-3">{c.email || "-"}</td>
                  <td className="p-3">{c.phone || "-"}</td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <button className="btn btn-outline px-2 py-1 text-xs" onClick={() => { setEditing(c); setOpen(true); }}>Edit</button>
                      <button className="btn btn-outline px-2 py-1 text-xs" onClick={() => remove(c._id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {hasMore && (
        <div className="text-center">
          <button className="btn btn-secondary" onClick={() => { setOffset(offset + 50); load(false); }} disabled={loading}>
            {loading ? "Loading..." : "Load More"}
          </button>
        </div>
      )}

      {open && (
        <CustomerModal
          initial={editing || undefined}
          onClose={() => setOpen(false)}
          onSaved={() => { setOpen(false); load(true); }}
        />
      )}
    </div>
  );
}

function CustomerModal({ initial, onClose, onSaved }: { initial?: Customer; onClose: () => void; onSaved: () => void; }) {
  const [name, setName] = useState(initial?.name || "");
  const [email, setEmail] = useState(initial?.email || "");
  const [phone, setPhone] = useState(initial?.phone || "");
  const [address, setAddress] = useState(initial?.address || "");
  const [notes, setNotes] = useState(initial?.notes || "");
  const canSubmit = useMemo(() => name.trim().length > 0, [name]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    const payload = { name, email: email || undefined, phone: phone || undefined, address: address || undefined, notes: notes || undefined };
    if (initial?._id) {
      const res = await fetch(`/api/customers/${initial._id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (res.ok) onSaved();
    } else {
      const res = await fetch(`/api/customers`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (res.ok) onSaved();
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-lg card rounded-lg shadow">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="font-medium text-black">{initial ? "Edit customer" : "New customer"}</div>
          <button onClick={onClose} className="text-sm">✕</button>
        </div>
        <form onSubmit={save} className="p-4 space-y-3">
          <div>
            <label className="text-xs text-gray-600">Name</label>
            <input className="w-full px-3 py-2 rounded border" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-600">Email</label>
              <input className="w-full px-3 py-2 rounded border" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="john@example.com" />
            </div>
            <div>
              <label className="text-xs text-gray-600">Phone</label>
              <input className="w-full px-3 py-2 rounded border" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 234 567 890" />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-600">Address</label>
            <input className="w-full px-3 py-2 rounded border" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Address" />
          </div>
          <div>
            <label className="text-xs text-gray-600">Notes</label>
            <input className="w-full px-3 py-2 rounded border" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" />
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

async function remove(id: string) {
  if (!confirm("Delete this customer?")) return;
  await fetch(`/api/customers/${id}`, { method: "DELETE" });
  window.location.reload();
}


