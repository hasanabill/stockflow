"use client";
import { useEffect, useMemo, useState } from "react";

type Expense = {
  _id: string;
  date: string;
  category: string;
  amount: number;
  description?: string;
};

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<{
    date: string;
    category: string;
    amount: string;
    description: string;
  }>({ date: "", category: "", amount: "", description: "" });

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/expenses");
      const data = await res.json();
      setExpenses(data);
      setLoading(false);
    })();
  }, []);

  const monthTotal = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const end = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999
    ).getTime();
    return expenses
      .filter((e) => {
        const t = new Date(e.date).getTime();
        return t >= start && t <= end;
      })
      .reduce((sum, e) => sum + Number(e.amount || 0), 0);
  }, [expenses]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      date: form.date ? new Date(form.date) : undefined,
      category: form.category,
      amount: Number(form.amount || 0),
      description: form.description || undefined,
    };
    const res = await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return;
    const created = await res.json();
    setExpenses([created, ...expenses]);
    setOpen(false);
    setForm({ date: "", category: "", amount: "", description: "" });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Expenses</h1>
        <div className="text-sm">
          This month total:{" "}
          <span className="font-medium">{monthTotal.toFixed(2)}</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button onClick={() => setOpen(true)} className="btn btn-primary">
          Add expense
        </button>
      </div>

      <div className="overflow-hidden rounded card">
        <table className="min-w-full text-sm">
          <thead className="bg-black/5">
            <tr>
              <th className="text-left p-3">Date</th>
              <th className="text-left p-3">Category</th>
              <th className="text-left p-3">Amount</th>
              <th className="text-left p-3">Description</th>
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
            ) : expenses.length === 0 ? (
              <tr>
                <td className="p-3" colSpan={4}>
                  <div className="text-sm text-gray-600">No expenses</div>
                </td>
              </tr>
            ) : (
              expenses.map((e) => (
                <tr key={e._id} className="border-t">
                  <td className="p-3">
                    {new Date(e.date).toLocaleDateString()}
                  </td>
                  <td className="p-3">{e.category}</td>
                  <td className="p-3">{Number(e.amount).toFixed(2)}</td>
                  <td className="p-3">{e.description || "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-lg card rounded-lg shadow">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div className="font-medium text-black">Add expense</div>
              <button onClick={() => setOpen(false)} className="text-sm">
                ✕
              </button>
            </div>
            <form onSubmit={submit} className="p-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-gray-600">Date</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full px-3 py-2 rounded border"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-gray-600">Category</label>
                  <input
                    value={form.category}
                    onChange={(e) =>
                      setForm({ ...form, category: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded border"
                    placeholder="rent, utilities, ..."
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-600">Amount</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className="w-full px-3 py-2 rounded border"
                  placeholder="0.00"
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
                  placeholder="Optional details"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
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
    </div>
  );
}
