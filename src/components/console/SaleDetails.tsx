import Link from "next/link";
import Pill from "@/components/console/Pill";
import ConfirmButton from "@/components/console/ConfirmButton";
import DocumentPicker from "@/components/console/DocumentPicker";
import Icon from "@/components/Icon";
import { formatDateTime, formatINR, formatShortDate } from "@/lib/format";
import { isImageDoc, type SaleDocument, type SaleRow } from "@/lib/queries/sales";
import { addSaleDocumentsAction, removeSaleDocumentAction } from "@/app/(console)/records/sale-documents";

const kb = (n: number | null) => (n == null ? "" : n < 1024 * 1024 ? `${Math.max(1, Math.round(n / 1024))} KB` : `${(n / 1024 / 1024).toFixed(1)} MB`);

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[130px_1fr] gap-3 py-2.5 text-sm">
      <dt className="text-muted">{label}</dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </div>
  );
}

/** Read-only view of one sale with its documents. `base` is /admin or /employee; `canRemove` decides the remove buttons. */
export default function SaleDetails({ sale, docs, base, viewerId, isAdmin }: { sale: SaleRow; docs: SaleDocument[]; base: "/admin" | "/employee"; viewerId: number; isAdmin: boolean }) {
  const client = sale.client_name ?? sale.lead_name ?? sale.prospect_name ?? "—";
  const property = sale.property_title ?? sale.property_name ?? "—";
  const canRemove = (d: SaleDocument) => isAdmin || (d.uploaded_by === viewerId && sale.status === "Pending approval");
  const images = docs.filter(isImageDoc);
  const files = docs.filter((d) => !isImageDoc(d));

  return (
    <div className="grid gap-5 lg:grid-cols-12">
      <section className="h-fit rounded-brand border border-line bg-white px-5 py-2 lg:col-span-5">
        <dl className="divide-y divide-line">
          <Row label="Status"><Pill value={sale.status} /></Row>
          <Row label="Sale date"><span className="tabular">{formatShortDate(sale.sale_date)}</span></Row>
          <Row label="Client">
            {sale.lead_id ? <Link href={`${base}/leads/${sale.lead_id}`} className="text-accent-ink hover:underline">{client}</Link>
              : sale.prospect_id ? <Link href={`${base}/prospects/${sale.prospect_id}`} className="text-accent-ink hover:underline">{client}</Link> : client}
            {sale.lead_id ? <span className="ml-1 text-xs text-muted">(lead)</span> : sale.prospect_id ? <span className="ml-1 text-xs text-muted">(prospect)</span> : null}
          </Row>
          <Row label="Property">{sale.property_id && isAdmin ? <Link href={`/admin/properties/${sale.property_id}`} className="text-accent-ink hover:underline">{property}</Link> : property}</Row>
          <Row label="Deal value"><span className="tabular text-base">{formatINR(sale.deal_value)}</span></Row>
          <Row label="Commission"><span className="tabular">{formatINR(sale.commission)}</span></Row>
          <Row label="Closed by">{sale.employee_id && isAdmin ? <Link href={`/admin/employees/${sale.employee_id}?tab=sales`} className="text-accent-ink hover:underline">{sale.employee_name}</Link> : (sale.employee_name ?? "—")}</Row>
          <Row label="Notes">{sale.notes ? <span className="whitespace-pre-line">{sale.notes}</span> : <span className="text-muted">—</span>}</Row>
          <Row label="Recorded"><span className="text-muted">{formatDateTime(sale.created_at)}</span></Row>
        </dl>
      </section>

      <section className="rounded-brand border border-line bg-white p-5 lg:col-span-7">
        <h2 className="text-base">Documents <span className="tabular text-muted">({docs.length})</span></h2>
        {docs.length === 0 && <p className="mt-2 text-sm text-muted">No documents yet.</p>}

        {images.length > 0 && (
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {images.map((d) => (
              <li key={d.id} className="overflow-hidden rounded-brand border border-line">
                <a href={d.url} target="_blank" rel="noopener" className="block aspect-[4/3] bg-bg" title={`Open ${d.name}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- uploaded files are served from /media, not optimised */}
                  <img src={d.url} alt={d.name} loading="lazy" className="h-full w-full object-cover" />
                </a>
                <div className="flex items-center justify-between gap-2 px-2 py-1.5 text-xs">
                  <span className="min-w-0 truncate" title={d.name}>{d.name}</span>
                  {canRemove(d) && <form><ConfirmButton label="Remove" confirmLabel="Yes" action={removeSaleDocumentAction.bind(null, d.id)} className="shrink-0 text-red-700 hover:underline" /></form>}
                </div>
              </li>
            ))}
          </ul>
        )}

        {files.length > 0 && (
          <ul className="mt-4 divide-y divide-line rounded-brand border border-line">
            {files.map((d) => (
              <li key={d.id} className="flex flex-wrap items-center gap-3 px-3 py-2.5 text-sm">
                <Icon name="file" size={18} className="shrink-0 text-muted" />
                <a href={d.url} target="_blank" rel="noopener" className="min-w-0 flex-1 truncate text-accent-ink hover:underline">{d.name}</a>
                <span className="text-xs text-muted">{[kb(d.size), d.uploaded_by_name, formatShortDate(d.created_at)].filter(Boolean).join(" · ")}</span>
                {canRemove(d) && <form><ConfirmButton label="Remove" confirmLabel="Yes, remove" action={removeSaleDocumentAction.bind(null, d.id)} className="text-xs text-red-700 hover:underline" /></form>}
              </li>
            ))}
          </ul>
        )}

        <form action={addSaleDocumentsAction.bind(null, sale.id)} className="mt-5 border-t border-line pt-4">
          <p className="mb-2 text-xs font-medium">Add documents</p>
          <DocumentPicker id="add-documents" />
          <button type="submit" className="mt-3 rounded-brand bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-ink">Upload</button>
        </form>
      </section>
    </div>
  );
}
