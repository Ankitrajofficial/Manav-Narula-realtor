import { formatINR } from "@/lib/format";

export default function SaleTotals({ total, totalValue, totalCommission, months, rangeLabel }: { total: number; totalValue: number; totalCommission: number; months: { month: string; n: number; value: string | number; commission: string | number }[]; rangeLabel: string | null }) {
  return (
    <div className="mb-4 grid gap-3 md:grid-cols-3">
      <div className="rounded-brand border border-line bg-white p-4">
        <p className="text-xs uppercase tracking-[0.08em] text-muted">{rangeLabel ?? "All time"}</p>
        <p className="mt-2 text-2xl tabular">{formatINR(totalValue)}</p>
        <p className="mt-1 text-xs text-muted">{total} {total === 1 ? "sale" : "sales"} · commission {formatINR(totalCommission)}</p>
      </div>
      <div className="rounded-brand border border-line bg-white p-4 md:col-span-2">
        <p className="text-xs uppercase tracking-[0.08em] text-muted">Monthly totals</p>
        {months.length === 0 ? <p className="mt-2 text-sm text-muted">No sales yet.</p> : (
          <table className="mt-2 w-full text-sm">
            <tbody>
              {months.map((m) => (
                <tr key={m.month} className="border-t border-line first:border-0">
                  <td className="py-1.5 pr-3">{m.month}</td>
                  <td className="py-1.5 pr-3 tabular text-muted">{m.n} {m.n === 1 ? "sale" : "sales"}</td>
                  <td className="py-1.5 pr-3 text-right tabular">{formatINR(m.value)}</td>
                  <td className="py-1.5 text-right tabular text-muted">{formatINR(m.commission)} commission</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
