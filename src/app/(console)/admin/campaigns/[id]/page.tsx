import Link from "next/link";
import { notFound } from "next/navigation";
import PageHeader from "@/components/console/PageHeader";
import CampaignForm from "@/components/console/CampaignForm";
import ConfirmButton from "@/components/console/ConfirmButton";
import Pill from "@/components/console/Pill";
import StatTile from "@/components/console/StatTile";
import Icon from "@/components/Icon";
import { inputCls } from "@/components/console/Form";
import { requireUser } from "@/lib/auth";
import { audienceOptions, getCampaign, listMessages, parseAudience } from "@/lib/queries/campaigns";
import { getWhatsAppConfig, isConfigured } from "@/lib/whatsapp";
import { formatDateTime } from "@/lib/format";
import { cancelScheduleAction, deleteCampaignAction, duplicateCampaignAction, pauseCampaignAction, resumeCampaignAction, retryFailedAction, saveCampaign, sendNowAction, sendTestAction } from "../actions";

export default async function CampaignPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser("admin");
  const id = Number((await params).id);
  const c = id ? await getCampaign(id) : null;
  if (!c) notFound();
  const [{ localities, tags }, cfg, messages] = await Promise.all([audienceOptions(), getWhatsAppConfig(), listMessages(id)]);
  const connected = isConfigured(cfg);
  const sched = c.scheduled_at ? new Date(c.scheduled_at) : null;
  const schedIso = sched ? new Date(sched.getTime() - sched.getTimezoneOffset() * 60000).toISOString() : null;
  const done = c.status === "Sent" || c.status === "Failed" || c.status === "Sending" || c.status === "Paused";
  const queued = messages.filter((m) => m.status === "Queued").length;
  return (
    <>
      <PageHeader title={c.name} description={`${c.creator_name ?? "Admin"} · created ${formatDateTime(c.created_at)}`} actions={
        <>
          <Pill value={c.status} />
          {c.status === "Scheduled" && <form action={cancelScheduleAction}><input type="hidden" name="id" value={c.id} /><button type="submit" className="rounded-brand border border-line bg-white px-3 py-1.5 text-sm hover:border-ink">Cancel schedule</button></form>}
          {c.status === "Sending" && <form action={pauseCampaignAction}><input type="hidden" name="id" value={c.id} /><button type="submit" className="rounded-brand border border-line bg-white px-3 py-1.5 text-sm hover:border-ink">Pause</button></form>}
          {c.status === "Paused" && connected && <form action={resumeCampaignAction}><input type="hidden" name="id" value={c.id} /><button type="submit" className="rounded-brand bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-accent-ink">Resume</button></form>}
          {c.status === "Sending" && queued > 0 && connected && <form action={sendNowAction}><input type="hidden" name="id" value={c.id} /><button type="submit" className="rounded-brand bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-accent-ink">Send next batch</button></form>}
          {(c.status === "Failed" || c.status === "Sent") && c.failed_count > 0 && connected && <form action={retryFailedAction}><input type="hidden" name="id" value={c.id} /><button type="submit" className="rounded-brand border border-line bg-white px-3 py-1.5 text-sm hover:border-ink">Retry failed ({c.failed_count})</button></form>}
          <form action={duplicateCampaignAction}><input type="hidden" name="id" value={c.id} /><button type="submit" className="inline-flex items-center gap-1.5 rounded-brand border border-line bg-white px-3 py-1.5 text-sm hover:border-ink"><Icon name="copy" size={14} />Duplicate</button></form>
          <form action={deleteCampaignAction}><input type="hidden" name="id" value={c.id} /><ConfirmButton label="Delete" confirmLabel="Delete campaign" /></form>
        </>
      } />

      {done && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <StatTile label="Recipients" value={c.total} />
          <StatTile label="Sent" value={c.sent_count} />
          <StatTile label="Failed" value={c.failed_count} hint={c.failed_count ? "See reasons below" : undefined} />
          <StatTile label={queued ? "Still queued" : "Finished"} value={queued ? `${queued} · window ${c.window_start}:00 to ${c.window_end}:00` : formatDateTime(c.sent_at ?? c.started_at)} hint={queued ? `Up to ${c.daily_cap} a day, ${c.gap_seconds}s apart` : undefined} />
        </div>
      )}
      {c.media_type !== "none" && c.media_url && (
        <p className="mb-4 flex items-center gap-2 text-sm text-muted"><Icon name={c.media_type === "image" ? "image" : c.media_type === "video" ? "eye" : "file"} size={16} />Attachment: <a href={c.media_url} target="_blank" rel="noopener" className="text-accent-ink hover:underline">{c.media_filename ?? c.media_url}</a> ({c.media_type})</p>
      )}

      <CampaignForm action={saveCampaign.bind(null, id)} values={{ name: c.name, message: c.message, variants: c.variants ?? [], message_type: c.message_type, template_name: c.template_name, template_language: c.template_language, audience: parseAudience(c.audience), scheduled_at: schedIso, status: c.status, media_type: c.media_type, media_url: c.media_url, media_filename: c.media_filename, window_start: c.window_start, window_end: c.window_end, daily_cap: c.daily_cap, gap_seconds: c.gap_seconds }} localities={localities} tags={tags} connected={connected} isNew={false} />

      {!done && (
        <section className="mt-5 rounded-brand border border-line bg-white p-5">
          <h2 className="text-base">Send a test to yourself</h2>
          <p className="mt-1 text-xs text-muted">Uses the saved message with sample values so you can read it on a phone before the real send.</p>
          <form action={sendTestAction} className="mt-3 flex flex-wrap items-center gap-2">
            <input type="hidden" name="id" value={c.id} />
            <input name="to" inputMode="tel" placeholder="10-digit mobile" className={`${inputCls} w-48`} aria-label="Test number" />
            <button type="submit" disabled={!connected} className="rounded-brand border border-ink px-4 py-2 text-sm hover:bg-ink hover:text-white disabled:opacity-40">Send test</button>
            {!connected && <span className="text-xs text-muted">Connect the API first.</span>}
          </form>
        </section>
      )}

      {messages.length > 0 && (
        <section className="mt-5 rounded-brand border border-line bg-white">
          <header className="flex items-center justify-between border-b border-line px-4 py-3">
            <h2 className="text-sm font-medium">Delivery log</h2>
            <a href={`/admin/campaigns/export?campaign=${c.id}`} className="inline-flex items-center gap-1.5 text-sm text-accent-ink hover:underline"><Icon name="download" size={14} />Export CSV</a>
          </header>
          <ul className="divide-y divide-line">
            {messages.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center gap-3 px-4 py-2.5 text-sm">
                <Link href={m.lead_id ? `/admin/leads/${m.lead_id}` : `/admin/prospects/${m.prospect_id}`} className="min-w-[160px] flex-1 hover:text-accent-ink">
                  <span className="block">{m.name}</span>
                  <span className="block text-xs tabular text-muted">{m.phone}{m.error ? ` · ${m.error}` : ""}</span>
                </Link>
                <Pill value={m.status} />
                <span className="w-40 text-right text-xs tabular text-muted">{m.sent_at ? formatDateTime(m.sent_at) : ""}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
