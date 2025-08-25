"use client";
import { useEffect, useState } from "react";

type Business = { _id: string; name: string };

export default function BusinessSwitcher() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [open, setOpen] = useState(false);
  const [openCreate, setOpenCreate] = useState(false);
  const [form, setForm] = useState<{ name: string; description: string }>({
    name: "",
    description: "",
  });

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/businesses");
      const data = await res.json();
      setBusinesses(data.businesses || []);
      setSelected(data.selectedBusinessId || "");
    })();
  }, []);

  async function selectBusiness(id: string) {
    if (!id) return;
    await fetch("/api/businesses/select", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessId: id }),
    });
    setSelected(id);
    setOpen(false);
    // refresh data on the current page
    window.location.reload();
  }

  async function createBusiness(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    const res = await fetch("/api/businesses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        description: form.description || undefined,
      }),
    });
    if (!res.ok) return;
    setOpenCreate(false);
    setForm({ name: "", description: "" });
    window.location.reload();
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="text-sm border px-3 py-1 rounded"
      >
        {businesses.find((b) => b._id === selected)?.name || "Select business"}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-white text-black rounded border shadow z-50">
          <div className="p-2 border-b font-medium">Businesses</div>
          <ul className="max-h-64 overflow-auto">
            {businesses.map((b) => (
              <li key={b._id}>
                <button
                  onClick={() => selectBusiness(b._id)}
                  className={`w-full text-left px-3 py-2 hover:bg-black/5 ${
                    selected === b._id ? "font-medium" : ""
                  }`}
                >
                  {b.name}
                </button>
              </li>
            ))}
            {businesses.length === 0 && (
              <li className="px-3 py-2 text-sm text-gray-600">No businesses</li>
            )}
          </ul>
          <div className="p-2 border-t">
            <button
              onClick={() => {
                setOpen(false);
                setOpenCreate(true);
              }}
              className="w-full text-left text-sm px-3 py-2 rounded border hover:bg-black/5"
            >
              Create business
            </button>
          </div>
        </div>
      )}
      {openCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md bg-white text-black rounded-lg shadow">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div className="font-medium text-black">Create business</div>
              <button onClick={() => setOpenCreate(false)} className="text-sm">
                ✕
              </button>
            </div>
            <form onSubmit={createBusiness} className="p-4 space-y-3">
              <div className="space-y-1">
                <label className="text-xs text-gray-600">Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 rounded border"
                  placeholder="Business name"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-600">Description</label>
                <input
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded border"
                  placeholder="Optional"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setOpenCreate(false)}
                  className="px-3 py-2 rounded border"
                >
                  Cancel
                </button>
                <button className="px-3 py-2 rounded bg-black text-white">
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
