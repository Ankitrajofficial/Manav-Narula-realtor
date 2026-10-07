import Link from "next/link";
import { notFound } from "next/navigation";
import PageHeader from "@/components/console/PageHeader";
import CampaignForm from "@/components/console/CampaignForm";
import ConfirmButton from "@/components/console/ConfirmButton";
import Pill from "@/components/console/Pill";
import StatTile from "@/components/console/StatTile";
import Icon from "@/components/Icon";
import { inputCls } from "@/components/console/form-classes";
import { requireUser } from "@/lib/auth";
import { audienceOptions, getCampaign, listFollowups, listMessages, parseAudience, receivedCount } from "@/lib/queries/campaigns";
import { q } from "@/lib/db";
import { getWhatsAppConfig, isConfigured } from "@/lib/whatsapp";
import { formatDateTime } from "@/lib/format";
import { cancelScheduleAction, deleteCampaignAction, duplicateCampaignAction, pauseCampaignAction, resumeCampaignAction, retryFailedAction, saveCampaign, sendFollowupAction, sendNowAction, sendTestAction } from "../actions";

/** A gentle check-in: did it reach them, any question; never a push to buy. */
const FOLLOWUP_STARTER = "Hello {{name}}, just checking that our last message reached you. If anything in it raised a question, simply reply here and we will answer. No rush and no obligation. {{employee}}, Manav Narula Realtor";

export default async function CampaignPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser("admin");
  const id = Number((await params).id);
  const c = id ? await getCampaign(id) : null;
  if (!c) notFound();
  const [{ localities, tags }, cfg, messages, followups, received, projects] = await Promise.all([audienceOptions(), getWhatsAppConfig(), listMessages(id), listFollowups(id), receivedCount(id), q<{ id: number; name: string }>("SELECT id, name FROM projects ORDER BY name")]);
  const connected = isConfigured(cfg);
  const sched = c.scheduled_at ? new Date(c.scheduled_at) : null;
  const schedIso = sched ? new Date(sched.getTime() - sched.getTimezoneOffset() * 60000).toISOString() : null;
  const done = c.status === "Sent" || c.status === "Failed" || c.status === "Sending" || c.status === "Paused";
  const queued = messages.filter((m) => m.status === "Queued").length;
  return (
    <>
      <PageHeader title={c.name} description={`About: ${c.project_name ?? "General knowledge"} · ${c.creator_name ?? "Admin"} · created ${formatDateTime(c.created_at)}`} actions={
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
          <StatTile label="Failed" value={c.failed_count} hint={c.skipped_count ? `${c.skipped_count} skipped: already messaged about this project` : c.failed_count ? "See reasons below" : undefined} />
          <StatTile label={queued ? "Still queued" : "Finished"} value={queued ? `${queued} · window ${c.window_start}:00 to ${c.window_end}:00` : formatDateTime(c.sent_at ?? c.started_at)} hint={queued ? `Up to ${c.daily_cap} a day, ${c.gap_seconds}s apart` : undefined} />
        </div>
      )}
      {c.media_type !== "none" && c.media_url && (
        <p className="mb-4 flex items-center gap-2 text-sm text-muted"><Icon name={c.media_type === "image" ? "image" : c.media_type === "video" ? "eye" : "file"} size={16} />Attachment: <a href={c.media_url} target="_blank" rel="noopener" className="text-accent-ink hover:underline">{c.media_filename ?? c.media_url}</a> ({c.media_type})</p>
      )}

      <CampaignForm projects={projects} campaignId={c.id} action={saveCampaign.bind(null, id)} values={{ project_id: c.project_id, name: c.name, message: c.message, variants: c.variants ?? [], message_type: c.message_type, template_name: c.template_name, template_language: c.template_language, audience: parseAudience(c.audience), scheduled_at: schedIso, status: c.status, media_type: c.media_type, media_url: c.media_url, media_filename: c.media_filename, window_start: c.window_start, window_end: c.window_end, daily_cap: c.daily_cap, gap_seconds: c.gap_seconds }} localities={localities} tags={tags} connected={connected} isNew={false} />

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

      <section id="followups" className="mt-5 scroll-mt-24 rounded-brand border border-line bg-white p-5">
        <h2 className="text-base">Follow-ups</h2>
        <p className="mt-1 text-xs text-muted">A short check-in or acknowledgement for the leads who received this campaign. Each lead gets each follow-up once; it goes out inside the same sending window and daily cap.</p>
        {followups.length > 0 && (
          <ul className="mt-3 divide-y divide-line rounded-brand border border-line">
            {followups.map((f, i) => (
              <li key={f.id} className="px-3 py-2.5 text-sm">
                <p className="text-xs text-muted">Follow-up {i + 1} · {formatDateTime(f.created_at)} · {f.message_type === "template" ? `template ${f.template_name}` : "text"}</p>
                <p className="mt-1 line-clamp-2">{f.message}</p>
                <p className="mt-1 text-xs tabular text-muted">{f.sent} sent{f.queued ? ` · ${f.queued} queued` : ""}{f.failed ? ` · ${f.failed} failed` : ""}</p>
              </li>
            ))}
          </ul>
        )}
        {received === 0 ? (
          <p className="mt-3 rounded-brand border border-dashed border-line px-3 py-3 text-sm text-muted">Follow-ups open once at least one lead has received this campaign.</p>
        ) : (
          <form action={sendFollowupAction} className="mt-3 space-y-3">
            <input type="hidden" name="id" value={c.id} />
            <textarea name="followup_message" rows={3} maxLength={1024} defaultValue={FOLLOWUP_STARTER} aria-label="Follow-up message" className={inputCls} />
            <div className="flex flex-wrap items-end gap-3">
              <label className="flex flex-col text-xs font-medium">Message type
                <select name="followup_type" defaultValue="text" className={`${inputCls} mt-1 w-48`}><option value="text">Text message</option><option value="template">Approved template</option></select>
              </label>
              <label className="flex flex-col text-xs font-medium">Template name (for templates)
                <input name="followup_template" placeholder="e.g. followup_checkin" className={`${inputCls} mt-1 w-56`} />
              </label>
              <button type="submit" className="rounded-brand bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-ink">Send follow-up to {received} {received === 1 ? "lead" : "leads"}</button>
            </div>
            <p className="text-xs text-muted">Placeholders work as in the campaign: {"{{name}}"}, {"{{employee}}"}, {"{{phone}}"}. A text follow-up reaches only leads who messaged you in the last 24 hours (Meta rule); use an approved template for everyone else.</p>
          </form>
        )}
      </section>

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
