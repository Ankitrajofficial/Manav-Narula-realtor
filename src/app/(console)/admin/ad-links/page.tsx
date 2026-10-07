import Link from "next/link";
import PageHeader from "@/components/console/PageHeader";
import EmptyState from "@/components/console/EmptyState";
import ToggleForm from "@/components/console/ToggleForm";
import CopyButton from "@/components/console/CopyButton";
import Pill from "@/components/console/Pill";
import Icon from "@/components/Icon";
import { requireUser } from "@/lib/auth";
import { site } from "@/data/site";
import { listLeadLinks, type LeadLink } from "@/lib/queries/lead-links";
import { toggleAdLink } from "./actions";

const pct = (k: LeadLink) => (k.visits ? `${Math.round((k.leads / k.visits) * 1000) / 10}%` : "—");

function LinkCard({ k }: { k: LeadLink }) {
  const url = `${site.url}/l/${k.slug}`;
  return (
    <div className={`flex flex-col gap-3 rounded-brand border border-t-4 border-line bg-white p-4 ${k.active ? "" : "opacity-70"}`} style={{ borderTopColor: k.active ? "var(--pill-green)" : "var(--pill-grey)" }}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <Link href={`/admin/ad-links/${k.id}`} className="font-medium leading-snug hover:text-accent-ink">{k.name}</Link>
          <p className="truncate text-sm text-muted">{k.project_name ?? "General enquiry"}</p>
        </div>
        <span className="flex items-center gap-2"><Pill value={k.channel} /><ToggleForm on={k.active} label={k.active ? "Turn link off" : "Turn link on"} action={toggleAdLink.bind(null, k.id, !k.active)} /></span>
      </div>
      <p className="break-all rounded-brand bg-bg/60 px-3 py-2 font-mono text-xs">{url}</p>
      <div className="grid grid-cols-3 gap-1 text-center">
        <div><p className="tabular text-base font-medium">{k.visits}</p><p className="text-xs text-muted">Visits</p></div>
        <div><p className="tabular text-base font-medium">{k.leads}</p><p className="text-xs text-muted">Leads</p></div>
        <div><p className="tabular text-base font-medium">{pct(k)}</p><p className="text-xs text-muted">Visits → leads</p></div>
      </div>
      <div className="mt-auto flex flex-wrap gap-2 border-t border-line pt-3">
        <CopyButton text={url} />
        <a href={`/l/${k.slug}?preview=1`} target="_blank" className="inline-flex items-center gap-1.5 rounded-brand border border-line bg-white px-3 py-1.5 text-sm hover:border-ink"><Icon name="eye" size={14} />Preview</a>
        <Link href={`/admin/leads?link=${k.id}`} className="inline-flex items-center gap-1.5 rounded-brand border border-line bg-white px-3 py-1.5 text-sm hover:border-ink"><Icon name="users" size={14} />Leads</Link>
        <Link href={`/admin/ad-links/${k.id}`} className="inline-flex items-center gap-1.5 rounded-brand border border-line bg-white px-3 py-1.5 text-sm hover:border-ink"><Icon name="edit" size={14} />Edit</Link>
      </div>
    </div>
  );
}

export default async function AdLinksPage() {
  await requireUser("admin");
  const links = await listLeadLinks();
  const leads = links.reduce((n, k) => n + k.leads, 0);
  return (
    <>
      <PageHeader title="Ad links" description={`Short links for Facebook and Instagram ads. Each opens a simple enquiry page and tags its leads, so you know which ad brought them.${links.length ? ` ${leads} ${leads === 1 ? "lead" : "leads"} from ${links.length} ${links.length === 1 ? "link" : "links"} so far.` : ""}`} actions={
        <Link href="/admin/ad-links/new" className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-brand bg-accent px-3 py-2 text-sm font-medium text-white hover:bg-accent-ink"><Icon name="plus" size={14} />New ad link</Link>
      } />
      {links.length === 0 ? <EmptyState text="No ad links yet. Create one for each Facebook or Instagram ad, then paste it into the ad's website link." action={{ label: "New ad link", href: "/admin/ad-links/new" }} /> : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{links.map((k) => <LinkCard key={k.id} k={k} />)}</div>
      )}
      <p className="mt-6 text-xs text-muted">Link pages are hidden from Google search, as they are only for people who click the ads. Visits from link-preview robots and your own previews are not counted.</p>
    </>
  );
}
