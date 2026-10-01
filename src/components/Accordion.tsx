import Icon from "./Icon";

export type QA = { q: string; a: string; tag?: string };

export default function Accordion({ items, numbered = false }: { items: QA[]; numbered?: boolean }) {
  return (
    <div className="divide-y divide-line border-y border-line">
      {items.map((it, i) => (
        <details key={it.q} className="group py-5">
          <summary className="flex items-start justify-between gap-4">
            <span className="flex gap-4">
              {numbered && <span className="mt-0.5 font-heading text-sm tabular text-muted">0{i + 1}</span>}
              <span>
                {it.tag && <span className="mb-1 block text-xs uppercase tracking-[0.1em] text-accent-ink">{it.tag}</span>}
                <span className={numbered ? "text-lg leading-snug" : "text-base"}>{it.q}</span>
              </span>
            </span>
            <Icon name="chevron" size={18} className="chev mt-1 shrink-0 text-muted transition-transform" />
          </summary>
          <p className={`mt-3 max-w-2xl text-sm text-muted ${numbered ? "pl-9" : ""}`}>{it.a}</p>
        </details>
      ))}
    </div>
  );
}
