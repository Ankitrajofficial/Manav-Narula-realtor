import Link from "next/link";
import Icon from "@/components/Icon";
import EmptyState from "./EmptyState";

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
export default function DataTable<T extends object>({ columns, rows, total, page, pageSize, sp, basePath, sortKey, sortDir, exportHref, exportPdfHref, empty, selectable, rowId, toolbar }: Props<T>) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
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
      ) : (
        <div className="rounded-brand border border-line bg-white md:overflow-x-auto">
          <table className="rtable w-full text-left md:min-w-[720px]">
            <thead className="sticky top-0 z-10 bg-white">
              <tr className="border-b border-line text-xs text-muted">
                {selectable && <th className="w-10 px-3"><span className="sr-only">Select</span></th>}
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
        <nav aria-label="Pagination" className="mt-4 flex items-center justify-between text-sm">
          <p className="text-muted">Page {page} of {pages}</p>
          <div className="flex gap-1">
            <Link aria-disabled={page <= 1} href={hrefWith(basePath, sp, { page: String(Math.max(1, page - 1)) })} className={`rounded-brand border border-line px-3 py-1.5 ${page <= 1 ? "pointer-events-none opacity-40" : "hover:border-ink"}`}>Previous</Link>
            <Link aria-disabled={page >= pages} href={hrefWith(basePath, sp, { page: String(Math.min(pages, page + 1)) })} className={`rounded-brand border border-line px-3 py-1.5 ${page >= pages ? "pointer-events-none opacity-40" : "hover:border-ink"}`}>Next</Link>
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
