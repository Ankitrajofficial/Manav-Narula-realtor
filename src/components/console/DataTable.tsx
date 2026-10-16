import Link from "next/link";
import Icon from "@/components/Icon";
import EmptyState from "./EmptyState";
import SelectAllBox from "./SelectAllBox";

export interface Column<T> { key: string; label: string; sortable?: boolean; className?: string; /** Leave this column out of the stacked phone layout. */ hideOnMobile?: boolean; render?: (row: T) => React.ReactNode }

interface Props<T> {
  columns: Column<T>[];
  rows: T[];
  total: number;
  page: number;
  pageSize: number;
  sp: Record<string, string | undefined>;
  basePath: string;
  sortKey?: string;
  sortDir?: "asc" | "desc";
  exportHref?: string;
  /** Render each row as a box in a grid instead of a table row. */
  cards?: (row: T) => React.ReactNode;
  exportPdfHref?: string;
  empty: { text: string; action?: { label: string; href: string } };
  selectable?: boolean;
  rowId?: (row: T) => string | number;
  toolbar?: React.ReactNode;
}

function hrefWith(basePath: string, sp: Record<string, string | undefined>, patch: Record<string, string | undefined>) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...sp, ...patch })) if (v) p.set(k, v);
  const s = p.toString();
  return s ? `${basePath}?${s}` : basePath;
}

/** Sticky-header table with sort links, result count, export buttons and pagination. State is in the URL. */
function PageLink({ href, off, current, label, children }: { href: string; off?: boolean; current?: boolean; label: string; children: React.ReactNode }) {
  return (
    <Link href={href} aria-label={label} aria-disabled={off || undefined} aria-current={current ? "page" : undefined}
      className={`inline-flex h-9 min-w-9 items-center justify-center gap-1 rounded-brand border px-2.5 tabular ${current ? "border-accent bg-accent font-medium text-white" : "border-line bg-white"} ${off ? "pointer-events-none opacity-40" : current ? "" : "hover:border-ink"}`}>
      {children}
    </Link>
  );
}

/** Page numbers to show: the first, the last and two either side of the current one, with null for a gap. */
function pageNumbers(page: number, pages: number): (number | null)[] {
  const keep = new Set([1, pages, page - 2, page - 1, page, page + 1, page + 2].filter((n) => n >= 1 && n <= pages));
  const out: (number | null)[] = [];
  [...keep].sort((a, b) => a - b).forEach((n, i, all) => { if (i && n - all[i - 1] > 1) out.push(null); out.push(n); });
  return out;
}

export default function DataTable<T extends object>({ columns, rows, total, page, pageSize, sp, basePath, sortKey, sortDir, exportHref, exportPdfHref, empty, selectable, rowId, toolbar, cards }: Props<T>) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const pageHref = (n: number) => hrefWith(basePath, sp, { page: String(Math.min(pages, Math.max(1, n))) });
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted"><span className="tabular text-ink">{total.toLocaleString("en-IN")}</span> {total === 1 ? "record" : "records"}</p>
        <div className="flex items-center gap-2">
          {toolbar}
          {exportHref && <a href={exportHref} className="inline-flex items-center gap-1.5 rounded-brand border border-line bg-white px-3 py-1.5 text-sm hover:border-ink"><Icon name="download" size={14} />Export CSV</a>}
          {exportPdfHref && <a href={exportPdfHref} className="inline-flex items-center gap-1.5 rounded-brand border border-line bg-white px-3 py-1.5 text-sm hover:border-ink"><Icon name="file" size={14} />Export PDF</a>}
        </div>
      </div>
      {rows.length === 0 ? (
        <EmptyState text={empty.text} action={empty.action} />
      ) : cards ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((r, i) => <div key={rowId ? rowId(r) : i} className="contents">{cards(r)}</div>)}
        </div>
      ) : (
        <div className="rounded-brand border border-line bg-white md:overflow-x-auto">
          <table className="rtable w-full text-left md:min-w-[720px]">
            <thead className="sticky top-0 z-10 bg-white">
              <tr className="border-b border-line text-xs text-muted">
                {selectable && <th className="w-10 px-3"><SelectAllBox /></th>}
                {columns.map((c) => (
                  <th key={c.key} className={`whitespace-nowrap px-3 font-medium ${c.className ?? ""}`}>
                    {c.sortable ? (
                      <Link href={hrefWith(basePath, sp, { sort: c.key, dir: sortKey === c.key && sortDir === "desc" ? "asc" : "desc", page: undefined })} className="inline-flex items-center gap-1 hover:text-ink">
                        {c.label}
                        {sortKey === c.key && <Icon name={sortDir === "asc" ? "up" : "down"} size={12} />}
                      </Link>
                    ) : c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={rowId ? rowId(r) : i} className="border-b border-line last:border-0 hover:bg-bg">
                  {selectable && <td className="px-3" data-label="Select"><input type="checkbox" name="ids" value={String(rowId ? rowId(r) : i)} className="accent-[#00BF63]" aria-label="Select row" /></td>}
                  {columns.map((c) => <td key={c.key} data-label={c.label} data-mobile={c.hideOnMobile ? "hide" : undefined} className={`px-3 align-middle ${c.className ?? ""}`}>{c.render ? c.render(r) : String((r as Record<string, unknown>)[c.key] ?? "")}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {pages > 1 && (
        <nav aria-label="Pagination" className="mt-4 flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted">Showing <span className="tabular text-ink">{(page - 1) * pageSize + 1}–{Math.min(total, page * pageSize)}</span> of <span className="tabular text-ink">{total}</span></p>
          <div className="flex flex-wrap items-center gap-1">
            <PageLink href={pageHref(1)} off={page <= 1} label="First page"><Icon name="arrowLeft" size={14} /><Icon name="arrowLeft" size={14} className="-ml-2" /></PageLink>
            <PageLink href={pageHref(page - 1)} off={page <= 1} label="Previous page"><Icon name="arrowLeft" size={14} /><span className="hidden sm:inline">Previous</span></PageLink>
            {pageNumbers(page, pages).map((n, i) => n === null
              ? <span key={`gap${i}`} className="px-1 text-muted" aria-hidden="true">…</span>
              : <PageLink key={n} href={pageHref(n)} current={n === page} label={`Page ${n}`}>{n}</PageLink>)}
            <PageLink href={pageHref(page + 1)} off={page >= pages} label="Next page"><span className="hidden sm:inline">Next</span><Icon name="arrowRight" size={14} /></PageLink>
            <PageLink href={pageHref(pages)} off={page >= pages} label="Last page"><Icon name="arrowRight" size={14} /><Icon name="arrowRight" size={14} className="-ml-2" /></PageLink>
          </div>
        </nav>
      )}
    </div>
  );
}

export function queryString(sp: Record<string, string | undefined>, patch: Record<string, string | undefined> = {}) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...sp, ...patch })) if (v) p.set(k, v);
  return p.toString();
}
