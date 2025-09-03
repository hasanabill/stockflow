"use client";
import { useEffect, useState } from "react";

type Row = { product: string; variantSku?: string; onHand: number; averageCost: number; value: number };

export default function StockValuationPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [totalValue, setTotalValue] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/reports/stock`);
      if (res.ok) {
        const data = await res.json();
        setRows(data.rows);
        setTotalValue(data.totalValue);
      }
      setLoading(false);
    })();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Stock Valuation</h1>
      <div className="rounded card p-4">
        <div className="text-sm text-gray-600">Total Value</div>
        <div className="text-xl font-semibold">{totalValue.toFixed(2)}</div>
      </div>
      <div className="overflow-hidden rounded card">
        <table className="min-w-full text-sm">
          <thead className="bg-black/5">
            <tr>
              <th className="text-left p-3">Product</th>
              <th className="text-left p-3">Variant</th>
              <th className="text-left p-3">On Hand</th>
              <th className="text-left p-3">Avg Cost</th>
              <th className="text-left p-3">Value</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="p-3" colSpan={5}>Loading…</td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td className="p-3" colSpan={5}>No data</td>
              </tr>
            ) : (
              rows.map((r, idx) => (
                <tr key={idx} className="border-t">
                  <td className="p-3">{r.product}</td>
                  <td className="p-3">{r.variantSku ?? "-"}</td>
                  <td className="p-3">{r.onHand}</td>
                  <td className="p-3">{Number(r.averageCost).toFixed(2)}</td>
                  <td className="p-3">{Number(r.value).toFixed(2)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


