import Link from "next/link";
import PageHeader from "@/components/console/PageHeader";
import Icon from "@/components/Icon";
import { inputCls } from "@/components/console/Form";
import { requireUser } from "@/lib/auth";
import { DEFAULT_BUSINESS, getSettingValue, listLocalityRows, listSourceRows, listTagRows, type Business } from "@/lib/queries/settings";
import BusinessForm from "./BusinessForm";
import { addListItem, moveLocality, removeListItem, renameLocality, saveBusiness, setLocalityZone, toggleLocality } from "./actions";
import ToggleForm from "@/components/console/ToggleForm";
import { ZONES, groupByZone } from "@/lib/localities";

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

type LocalityRow = Awaited<ReturnType<typeof listLocalityRows>>[number];

function LocalitiesCard({ rows }: { rows: LocalityRow[] }) {
  const active = rows.filter((r) => r.is_active).length;
  return (
    <section id="localities" className="scroll-mt-20 rounded-brand border border-line bg-white p-5">
      <h2 className="text-base">Localities</h2>
      <p className="mt-1 text-xs text-muted">{active} active of {rows.length}. Grouped by zone; the order here is the order on the website. Inactive ones are hidden from the website and new records. Renaming updates every property, project, lead and prospect that uses the name.</p>
      {groupByZone(rows).map((g) => (
        <div key={g.zone} className="mt-4">
          <p className="text-[11px] uppercase tracking-[0.1em] text-muted">{g.zone} <span className="tabular">({g.items.length})</span></p>
          <ul className="mt-1 divide-y divide-line border-y border-line">
            {g.items.map((it, i) => (
              <li key={it.id} className="py-2 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className={it.is_active ? "" : "text-muted line-through"}>{it.name} <span className="text-xs tabular text-muted no-underline">· {it.properties} {it.properties === 1 ? "property" : "properties"}</span></span>
                  <span className="flex shrink-0 items-center gap-1">
                    <form className="flex gap-1">
                      <button formAction={moveLocality.bind(null, it.id, -1)} aria-label={`Move ${it.name} up`} disabled={i === 0} className="rounded-brand border border-line p-1 hover:border-ink disabled:opacity-40"><Icon name="up" size={12} /></button>
                      <button formAction={moveLocality.bind(null, it.id, 1)} aria-label={`Move ${it.name} down`} disabled={i === g.items.length - 1} className="rounded-brand border border-line p-1 hover:border-ink disabled:opacity-40"><Icon name="down" size={12} /></button>
                    </form>
                    <ToggleForm on={it.is_active} action={toggleLocality.bind(null, it.id, !it.is_active)} label={it.is_active ? `Deactivate ${it.name}` : `Activate ${it.name}`} />
                  </span>
                </div>
                <details className="mt-1">
                  <summary className="text-xs text-accent-ink">Rename or change zone</summary>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <form action={renameLocality.bind(null, it.id)} className="flex min-w-0 flex-1 gap-2">
                      <input name="name" defaultValue={it.name} required aria-label={`New name for ${it.name}`} className={`${inputCls} py-1.5`} />
                      <button type="submit" className="rounded-brand border border-line bg-white px-3 py-1.5 text-sm hover:border-ink">Rename</button>
                    </form>
                    <form action={setLocalityZone.bind(null, it.id)} className="flex gap-2">
                      <select name="zone" defaultValue={it.zone} aria-label={`Zone for ${it.name}`} className={`${inputCls} w-auto py-1.5`}>{ZONES.map((z) => <option key={z}>{z}</option>)}</select>
                      <button type="submit" className="rounded-brand border border-line bg-white px-3 py-1.5 text-sm hover:border-ink">Set zone</button>
                    </form>
                  </div>
                </details>
              </li>
            ))}
          </ul>
        </div>
      ))}
      <form action={addListItem.bind(null, "localities")} className="mt-4 flex flex-wrap gap-2">
        <input name="name" required placeholder="Add locality…" className={`${inputCls} min-w-0 flex-1 py-1.5`} aria-label="New locality name" />
        <select name="zone" defaultValue="Central" aria-label="Zone" className={`${inputCls} w-auto py-1.5`}>{ZONES.map((z) => <option key={z}>{z}</option>)}</select>
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
      <PageHeader title="Settings" description="Business details shown on the website, the lists used in forms, and the audit log." actions={<><Link href="/change-password" className="inline-flex items-center gap-1.5 rounded-brand border border-line bg-white px-3 py-1.5 text-sm hover:border-ink"><Icon name="key" size={14} />Change my password</Link><Link href="/admin/settings/whatsapp" className="inline-flex items-center gap-1.5 rounded-brand border border-line bg-white px-3 py-1.5 text-sm hover:border-ink"><Icon name="whatsapp" size={14} />WhatsApp API</Link><Link href="/admin/settings/audit" className="inline-flex items-center gap-1.5 rounded-brand border border-line bg-white px-3 py-1.5 text-sm hover:border-ink"><Icon name="list" size={14} />Audit log</Link></>} />
      <div className="grid gap-5 lg:grid-cols-12">
        <div className="lg:col-span-7"><BusinessForm business={{ ...DEFAULT_BUSINESS, ...business }} notificationEmail={notificationEmail} action={saveBusiness} /></div>
        <div className="space-y-5 lg:col-span-5">
          <ListCard id="sources" title="Lead sources" hint="Where a lead came from. Used on lead forms and reports." items={sources} kind="sources" />
          <LocalitiesCard rows={localities} />
          <ListCard id="types" title="Property types" hint="Kothi, Apartment, Plot and so on." items={types.map((name) => ({ name }))} kind="types" />
          <ListCard id="tags" title="Tags" hint="Applied to leads and prospects; Phase 3 campaigns filter on these." items={tags} kind="tags" />
        </div>
      </div>
    </>
  );
}
