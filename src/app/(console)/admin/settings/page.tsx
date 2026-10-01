import Link from "next/link";
import PageHeader from "@/components/console/PageHeader";
import Icon from "@/components/Icon";
import { inputCls } from "@/components/console/Form";
import { requireUser } from "@/lib/auth";
import { DEFAULT_BUSINESS, getSettingValue, listLocalityRows, listSourceRows, listTagRows, type Business } from "@/lib/queries/settings";
import BusinessForm from "./BusinessForm";
import { addListItem, moveLocality, removeListItem, saveBusiness } from "./actions";

function ListCard({ id, title, hint, items, kind, reorder }: { id: string; title: string; hint: string; items: { id?: number; name: string }[]; kind: "sources" | "localities" | "tags" | "types"; reorder?: boolean }) {
  return (
    <section id={id} className="scroll-mt-20 rounded-brand border border-line bg-white p-5">
      <h2 className="text-base">{title}</h2>
      <p className="mt-1 text-xs text-muted">{hint}</p>
      <ul className="mt-3 divide-y divide-line border-y border-line">
        {items.map((it, i) => (
          <li key={it.name} className="flex items-center justify-between gap-2 py-2 text-sm">
            <span>{it.name}</span>
            <span className="flex gap-1">
              {reorder && it.id != null && (
                <form className="flex gap-1">
                  <button formAction={moveLocality.bind(null, it.id, -1)} aria-label="Move up" disabled={i === 0} className="rounded-brand border border-line p-1 hover:border-ink disabled:opacity-40"><Icon name="up" size={12} /></button>
                  <button formAction={moveLocality.bind(null, it.id, 1)} aria-label="Move down" disabled={i === items.length - 1} className="rounded-brand border border-line p-1 hover:border-ink disabled:opacity-40"><Icon name="down" size={12} /></button>
                </form>
              )}
              <form action={removeListItem.bind(null, kind, it.name)}><button type="submit" aria-label={`Remove ${it.name}`} className="rounded-brand border border-line p-1 text-red-700 hover:border-red-700"><Icon name="x" size={12} /></button></form>
            </span>
          </li>
        ))}
        {items.length === 0 && <li className="py-2 text-sm text-muted">Nothing yet.</li>}
      </ul>
      <form action={addListItem.bind(null, kind)} className="mt-3 flex gap-2">
        <input name="name" required placeholder="Add…" className={`${inputCls} py-1.5`} aria-label={`Add to ${title}`} />
        <button type="submit" className="rounded-brand border border-line bg-white px-3 py-1.5 text-sm hover:border-ink">Add</button>
      </form>
    </section>
  );
}

export default async function SettingsPage() {
  await requireUser("admin");
  const [business, notificationEmail, types, sources, localities, tags] = await Promise.all([
    getSettingValue<Business>("business", DEFAULT_BUSINESS), getSettingValue<string>("notification_email", ""), getSettingValue<string[]>("property_types", []), listSourceRows(), listLocalityRows(), listTagRows(),
  ]);
  return (
    <>
      <PageHeader title="Settings" description="Business details shown on the website, the lists used in forms, and the audit log." actions={<><Link href="/admin/settings/whatsapp" className="inline-flex items-center gap-1.5 rounded-brand border border-line bg-white px-3 py-1.5 text-sm hover:border-ink"><Icon name="whatsapp" size={14} />WhatsApp API</Link><Link href="/admin/settings/audit" className="inline-flex items-center gap-1.5 rounded-brand border border-line bg-white px-3 py-1.5 text-sm hover:border-ink"><Icon name="list" size={14} />Audit log</Link></>} />
      <div className="grid gap-5 lg:grid-cols-12">
        <div className="lg:col-span-7"><BusinessForm business={{ ...DEFAULT_BUSINESS, ...business }} notificationEmail={notificationEmail} action={saveBusiness} /></div>
        <div className="space-y-5 lg:col-span-5">
          <ListCard id="sources" title="Lead sources" hint="Where a lead came from. Used on lead forms and reports." items={sources} kind="sources" />
          <ListCard id="localities" title="Localities" hint="Order here is the order on the website and in filters." items={localities} kind="localities" reorder />
          <ListCard id="types" title="Property types" hint="Kothi, Apartment, Plot and so on." items={types.map((name) => ({ name }))} kind="types" />
          <ListCard id="tags" title="Tags" hint="Applied to leads and prospects; Phase 3 campaigns filter on these." items={tags} kind="tags" />
        </div>
      </div>
    </>
  );
}
