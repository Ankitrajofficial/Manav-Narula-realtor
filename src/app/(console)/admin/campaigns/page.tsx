import Link from "next/link";
import { Suspense } from "react";
import PageHeader from "@/components/console/PageHeader";
import DataTable, { queryString, type Column } from "@/components/console/DataTable";
import FilterBar from "@/components/console/FilterBar";
import Pill from "@/components/console/Pill";
import Icon from "@/components/Icon";
import { requireUser } from "@/lib/auth";
import { listCampaigns, runDueCampaigns, type CampaignRow } from "@/lib/queries/campaigns";
import { getWhatsAppConfig, isConfigured } from "@/lib/whatsapp";
import { formatDateTime } from "@/lib/format";

const summary = (a: CampaignRow["audience"]) => {
  const parts = [a.kinds?.map((k) => (k === "lead" ? "leads" : "prospects")).join(" + ")];
  if (a.statuses?.length) parts.push(a.statuses.join("/"));
  if (a.localities?.length) parts.push(a.localities.length > 2 ? `${a.localities.length} localities` : a.localities.join(", "));
  if (a.tags?.length) parts.push(a.tags.join(", "));
  return parts.filter(Boolean).join(" · ");
};

export default async function CampaignsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requireUser("admin");
  const sp = await searchParams;
  await runDueCampaigns(user.id);
  const [data, cfg] = await Promise.all([listCampaigns(sp), getWhatsAppConfig()]);
  const connected = isConfigured(cfg);
  const columns: Column<CampaignRow>[] = [
    { key: "name", label: "Campaign", sortable: true, render: (c) => <Link href={`/admin/campaigns/${c.id}`} className="inline-flex items-center gap-2 font-medium hover:text-accent-ink">{c.name}{c.media_type !== "none" && <Icon name={c.media_type === "image" ? "image" : c.media_type === "video" ? "eye" : "file"} size={14} className="text-muted" />}</Link> },
    { key: "audience", label: "Audience", hideOnMobile: true, render: (c) => <span className="text-muted">{summary(c.audience)}</span> },
    { key: "status", label: "Status", sortable: true, render: (c) => <Pill value={c.status} /> },
    { key: "total", label: "Recipients", sortable: true, className: "tabular", render: (c) => c.total || <span className="text-muted">—</span> },
    { key: "sent", label: "Sent / failed", className: "tabular", render: (c) => c.status === "Draft" || c.status === "Scheduled" ? <span className="text-muted">—</span> : <span>{c.sent_count} <span className="text-muted">/</span> <span className={c.failed_count ? "text-red-700" : ""}>{c.failed_count}</span></span> },
    { key: "sent_at", label: "When", sortable: true, hideOnMobile: true, className: "whitespace-nowrap", render: (c) => c.status === "Scheduled" ? `Scheduled ${formatDateTime(c.scheduled_at)}` : c.sent_at ? formatDateTime(c.sent_at) : <span className="text-muted">{formatDateTime(c.created_at)}</span> },
  ];
  return (
    <>
      <PageHeader title="Campaigns" description="WhatsApp messages to prospects and leads through the Meta Cloud API." actions={
        <>
          <Link href="/admin/settings/whatsapp" className="inline-flex items-center gap-1.5 rounded-brand border border-line bg-white px-3 py-2 text-sm hover:border-ink"><Pill value={connected ? "Connected" : "Not connected"} />WhatsApp API</Link>
          <Link href="/admin/campaigns/templates" className="inline-flex items-center gap-1.5 rounded-brand border border-line bg-white px-3 py-2 text-sm hover:border-ink"><Icon name="copy" size={14} />Templates</Link>
          <Link href="/admin/campaigns/new" className="inline-flex items-center gap-1.5 rounded-brand bg-accent px-3 py-2 text-sm font-medium text-white hover:bg-accent-ink"><Icon name="plus" size={14} />New campaign</Link>
        </>
      } />
      {!connected && (
        <p className="mb-4 rounded-brand border border-line bg-white px-4 py-3 text-sm">
          Campaigns can be drafted now. To send, add the WhatsApp Cloud API phone number ID and access token under <Link href="/admin/settings/whatsapp" className="text-accent-ink hover:underline">Settings → WhatsApp API</Link>.
        </p>
      )}
      <Suspense>
        <FilterBar searchPlaceholder="Search campaign name or message" filters={[{ key: "status", label: "Status", options: ["Draft", "Scheduled", "Sending", "Paused", "Sent", "Failed"].map((s) => ({ value: s, label: s })) }]} />
      </Suspense>
      <DataTable columns={columns} rows={data.rows} total={data.total} page={data.page} pageSize={data.size} sp={sp} basePath="/admin/campaigns" sortKey={data.sortKey} sortDir={data.sortDir} rowId={(c) => c.id}
        exportHref={`/admin/campaigns/export?${queryString(sp)}`} empty={{ text: "No campaigns yet. Write the first message to your opted-in prospects.", action: { label: "New campaign", href: "/admin/campaigns/new" } }} />
    </>
  );
}
