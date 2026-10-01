"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { parseCsv } from "@/lib/csv";
import { inputCls } from "./Form";
import { importRecordsAction, type ImportRow } from "@/app/(console)/records/actions";

const FIELDS: { key: keyof ImportRow; label: string; hints: string[] }[] = [
  { key: "name", label: "Name", hints: ["name", "client", "customer", "full name"] },
  { key: "phone", label: "Phone", hints: ["phone", "mobile", "contact", "number", "whatsapp number"] },
  { key: "email", label: "Email", hints: ["email", "e-mail", "mail"] },
  { key: "interest", label: "Interest (Buy/Sell/Rent)", hints: ["interest", "purpose", "looking", "requirement"] },
  { key: "budget", label: "Budget", hints: ["budget", "price range"] },
  { key: "locality", label: "Locality", hints: ["locality", "area", "location", "colony"] },
  { key: "source", label: "Source", hints: ["source", "channel", "campaign"] },
  { key: "tags", label: "Tags (comma separated)", hints: ["tags", "tag", "type", "segment"] },
  { key: "notes", label: "Notes", hints: ["notes", "note", "remarks", "comment"] },
  { key: "whatsapp_opt_in", label: "WhatsApp opt-in (yes/no)", hints: ["opt", "consent", "whatsapp opt"] },
];

export default function CsvImporter({ kind }: { kind: "lead" | "prospect" }) {
  const router = useRouter();
  const [rows, setRows] = useState<string[][]>([]);
  const [map, setMap] = useState<Record<string, number>>({});
  const [result, setResult] = useState<{ imported: number; skipped: number; reasons: string[] } | null>(null);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const headers = rows[0] ?? [];
  const body = rows.slice(1);

  const load = (text: string) => {
    const parsed = parseCsv(text);
    if (parsed.length < 2) { setError("The file needs a header row and at least one data row."); return; }
    setError("");
    setRows(parsed);
    const guess: Record<string, number> = {};
    parsed[0].forEach((h, i) => { const hl = h.toLowerCase().trim(); const f = FIELDS.find((x) => x.hints.some((k) => hl === k || hl.includes(k))); if (f && guess[f.key] === undefined) guess[f.key] = i; });
    setMap(guess);
  };
  const onFile = (f: File | null) => { if (!f) return; f.text().then(load); };
  const mapped = (): ImportRow[] => body.map((r) => { const o: ImportRow = {}; for (const f of FIELDS) { const i = map[f.key]; if (i !== undefined && i >= 0) o[f.key] = r[i] ?? ""; } return o; });
  const submit = () => {
    if (map.name === undefined || map.phone === undefined) { setError("Map at least Name and Phone."); return; }
    setError("");
    start(async () => {
      const res = await importRecordsAction(kind, mapped());
      setResult(res);
      setTimeout(() => router.push(res.redirect), 1200);
    });
  };

  if (result) {
    return (
      <div className="rounded-brand border border-line bg-white p-5">
        <p className="text-lg">Imported {result.imported}, skipped {result.skipped}.</p>
        {result.reasons.length > 0 && <ul className="mt-3 list-disc pl-5 text-sm text-muted">{result.reasons.map((r, i) => <li key={i}>{r}</li>)}</ul>}
        <p className="mt-3 text-sm text-muted">Taking you to the list…</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className="rounded-brand border border-line bg-white p-5">
        <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted">Step 1 · Choose a CSV</p>
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="csv-file" className="mb-1 block text-xs font-medium">Upload file</label>
            <input id="csv-file" type="file" accept=".csv,text/csv" onChange={(e) => onFile(e.target.files?.[0] ?? null)} className="block w-full text-sm" />
            <p className="mt-1 text-xs text-muted">First row must be column headings. Phone numbers are normalised to +91 and duplicates are skipped.</p>
          </div>
          <div>
            <label htmlFor="csv-paste" className="mb-1 block text-xs font-medium">Or paste CSV text</label>
            <textarea id="csv-paste" rows={3} className={inputCls} placeholder={"name,phone,locality\nRitu,98140 12345,Model Town"} onBlur={(e) => e.target.value.trim() && load(e.target.value)} />
          </div>
        </div>
      </section>

      {headers.length > 0 && (
        <section className="rounded-brand border border-line bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted">Step 2 · Map columns</p>
          <div className="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {FIELDS.map((f) => (
              <label key={f.key} className="text-sm">
                <span className="mb-1 block text-xs font-medium">{f.label}{(f.key === "name" || f.key === "phone") && <span className="text-red-700"> *</span>}</span>
                <select value={map[f.key] ?? -1} onChange={(e) => setMap({ ...map, [f.key]: Number(e.target.value) })} className={inputCls}>
                  <option value={-1}>Skip</option>
                  {headers.map((h, i) => <option key={i} value={i}>{h || `Column ${i + 1}`}</option>)}
                </select>
              </label>
            ))}
          </div>
        </section>
      )}

      {headers.length > 0 && (
        <section className="rounded-brand border border-line bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted">Step 3 · Preview</p>
          <p className="mt-1 text-sm text-muted"><span className="tabular text-ink">{body.length}</span> rows found. Showing the first {Math.min(10, body.length)}.</p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead><tr className="border-b border-line text-xs text-muted">{FIELDS.filter((f) => map[f.key] !== undefined && map[f.key] >= 0).map((f) => <th key={f.key} className="px-2 py-2 font-medium">{f.label}</th>)}</tr></thead>
              <tbody>
                {mapped().slice(0, 10).map((r, i) => (
                  <tr key={i} className="border-b border-line last:border-0">{FIELDS.filter((f) => map[f.key] !== undefined && map[f.key] >= 0).map((f) => <td key={f.key} className="px-2 py-1.5">{r[f.key]}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>
          {error && <p className="mt-3 text-sm text-red-700" role="alert">{error}</p>}
          <button type="button" onClick={submit} disabled={pending} className="mt-4 rounded-brand bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-ink disabled:opacity-60">{pending ? "Importing…" : `Import ${body.length} ${kind === "lead" ? "leads" : "prospects"}`}</button>
        </section>
      )}
      {error && headers.length === 0 && <p className="text-sm text-red-700" role="alert">{error}</p>}
    </div>
  );
}
