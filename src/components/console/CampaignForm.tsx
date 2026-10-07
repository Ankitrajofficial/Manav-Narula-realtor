"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState } from "react";
import Icon from "@/components/Icon";
import { Field, FormError, Input, Select, SubmitButton, Textarea } from "./Form";
import { LEAD_STATUSES, INTERESTS } from "@/lib/console";
import type { Audience } from "@/lib/queries/campaigns";
import type { CampaignFormState } from "@/app/(console)/admin/campaigns/actions";

const PLACEHOLDERS = [
  { token: "{{name}}", label: "First name" },
  { token: "{{full_name}}", label: "Full name" },
  { token: "{{locality}}", label: "Locality" },
  { token: "{{interest}}", label: "Interest" },
  { token: "{{budget}}", label: "Budget" },
  { token: "{{employee}}", label: "Advisor" },
  { token: "{{phone}}", label: "Our phone" },
];
const SAMPLE: Record<string, string> = { name: "Harpreet", full_name: "Harpreet Singh", locality: "Urban Estate Phase 2", interest: "Buy", budget: "₹1 Cr to ₹2 Cr", employee: "Priya Sharma", phone: "+91 90122 90522" };
const preview = (t: string) => t.replace(/\{\{\s*([a-z_]+)\s*\}\}/gi, (_, k: string) => SAMPLE[k.toLowerCase()] ?? "");
type MediaType = "none" | "image" | "document" | "video";

export interface CampaignValues { project_id?: number | null; name?: string; message?: string; variants?: string[]; message_type?: string; template_name?: string | null; template_language?: string; audience?: Audience; scheduled_at?: string | null; status?: string; media_type?: MediaType; media_url?: string | null; media_filename?: string | null; window_start?: number; window_end?: number; daily_cap?: number; gap_seconds?: number }
export interface TemplateOption { id: number; name: string }

/**
 * Starter messages for nurturing leads: useful knowledge and a reason to remember us, never pressure to buy.
 * "[project]" is replaced with the project chosen under "About".
 */
const STARTERS: { label: string; text: string }[] = [
  { label: "Buying checklist", text: "Hello {{name}}, a quick tip from Manav Narula Realtor: before you pay a token for any plot or flat in Jalandhar, check the title chain, the encumbrance certificate, the approved plan and the project's RERA number. Keep this message for whenever you need it. We are always happy to look over papers for you, with no obligation." },
  { label: "Home loan tip", text: "Hello {{name}}, a home loan tip: banks look at how much of your monthly income already goes to EMIs, and the lower that share, the better the rate you are usually offered. Whenever you plan to buy, we can compare our partner banks for you at no cost. {{employee}}, Manav Narula Realtor" },
  { label: "Locality guide", text: "Hello {{name}}, when you visit any locality, look at the distance to schools and hospitals, the road width, the water supply and how the area feels in the evening. Save our number {{phone}}: we are glad to share what we know about any area of Jalandhar, whenever you need it." },
  { label: "Project update", text: "Hello {{name}}, sharing something you may find useful: [project] is one of the projects we follow closely in Jalandhar. If you would like the floor plans, the RERA details or simply an honest view of it, reply here any time. No rush and no obligation. {{employee}}, Manav Narula Realtor" },
];

export default function CampaignForm({ action, values = {}, localities, tags, connected, isNew, templates = [], projects = [], campaignId }: { action: (prev: CampaignFormState, fd: FormData) => Promise<CampaignFormState>; values?: CampaignValues; localities: string[]; tags: string[]; connected: boolean; isNew: boolean; templates?: TemplateOption[]; projects?: { id: number; name: string }[]; campaignId?: number }) {
  const [state, formAction] = useActionState<CampaignFormState, FormData>(action, {});
  const e = state.errors ?? {};
  const a = values.audience ?? { kinds: ["lead"], statuses: [], tags: [], localities: [], interests: [], optInOnly: true };
  const [message, setMessage] = useState(values.message ?? "");
  const [variantB, setVariantB] = useState(values.variants?.[0] ?? "");
  const [variantC, setVariantC] = useState(values.variants?.[1] ?? "");
  const [showVariants, setShowVariants] = useState(Boolean(values.variants?.length));
  const [type, setType] = useState(values.message_type ?? "text");
  const [mediaType, setMediaType] = useState<MediaType>(values.media_type ?? "none");
  const [mediaError, setMediaError] = useState("");
  const [mediaPreview, setMediaPreview] = useState<string | null>(values.media_url ?? null);
  const [mediaName, setMediaName] = useState<string | null>(values.media_filename ?? null);
  const [count, setCount] = useState<{ n: number; skipped?: number; sample: string[] } | null>(null);
  const [projectId, setProjectId] = useState<string>(values.project_id ? String(values.project_id) : "");
  const [confirmed, setConfirmed] = useState(false);
  const [hasNewFile, setHasNewFile] = useState(false);
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const insert = (token: string) => {
    const el = textRef.current; if (!el) return;
    const s = el.selectionStart ?? message.length, en = el.selectionEnd ?? message.length;
    const next = message.slice(0, s) + token + message.slice(en);
    setMessage(next);
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(s + token.length, s + token.length); });
  };

  const refreshCount = async () => {
    const form = formRef.current; if (!form) return;
    const fd = new FormData(form);
    const p = new URLSearchParams();
    for (const k of ["kinds", "statuses", "tags", "localities", "interests"]) fd.getAll(k).forEach((v) => p.append(k, String(v)));
    p.set("optInOnly", fd.get("optInOnly") === "1" ? "1" : "0");
    const pid = String(fd.get("project_id") ?? "");
    if (pid) p.set("project_id", pid);
    if (campaignId) p.set("campaign_id", String(campaignId));
    try { const r = await fetch(`/admin/campaigns/audience?${p}`); if (r.ok) setCount(await r.json()); } catch { /* ignore */ }
  };
  useEffect(() => { const t = setTimeout(refreshCount, 0); return () => clearTimeout(t); }, []);

  /** Checks the chosen file before upload: type, size and, for video, a 20-second limit read from the file itself. */
  const onFile = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const f = ev.target.files?.[0];
    setMediaError(""); setHasNewFile(Boolean(f)); if (!f) return;
    const limitMb = mediaType === "image" ? 5 : 16;
    if (f.size > limitMb * 1024 * 1024) { setMediaError(`Meta accepts ${mediaType}s up to ${limitMb} MB. This file is ${(f.size / 1024 / 1024).toFixed(1)} MB.`); ev.target.value = ""; return; }
    if (mediaType === "image" && !f.type.startsWith("image/")) { setMediaError("Choose a JPG, PNG or WebP image."); ev.target.value = ""; return; }
    if (mediaType === "document" && f.type !== "application/pdf") { setMediaError("Choose a PDF brochure."); ev.target.value = ""; return; }
    if (mediaType === "video") {
      if (f.type !== "video/mp4") { setMediaError("Choose an MP4 video (H.264)."); ev.target.value = ""; return; }
      const url = URL.createObjectURL(f);
      const v = document.createElement("video");
      v.preload = "metadata";
      v.onloadedmetadata = () => {
        URL.revokeObjectURL(url);
        if (v.duration > 20.5) { setMediaError(`Video is ${Math.round(v.duration)} seconds. Keep it to 20 seconds or less so it plays instantly on WhatsApp.`); if (fileRef.current) fileRef.current.value = ""; setMediaPreview(null); }
        else { setMediaPreview(URL.createObjectURL(f)); setMediaName(f.name); }
      };
      v.src = url;
      return;
    }
    setMediaName(f.name);
    setMediaPreview(mediaType === "image" ? URL.createObjectURL(f) : null);
  };

  const checks = (name: string, options: string[], selected: string[]) => (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <label key={o} className="inline-flex cursor-pointer items-center gap-1.5 rounded-brand border border-line bg-white px-2.5 py-1 text-xs has-[:checked]:border-accent has-[:checked]:bg-accent/10">
          <input type="checkbox" name={name} value={o} defaultChecked={selected.includes(o)} onChange={refreshCount} className="accent-[#00BF63]" />{o}
        </label>
      ))}
    </div>
  );
  const locked = values.status === "Sent" || values.status === "Sending" || values.status === "Paused";
  const today = new Date().toISOString().slice(0, 10);
  const hours = Array.from({ length: 25 }, (_, i) => i);

  return (
    <form ref={formRef} action={formAction} autoComplete="off" className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-12">
        <div className="space-y-5 lg:col-span-7">
          <section className="rounded-brand border border-line bg-white p-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <Field label="Campaign name" htmlFor="name" error={e.name} className="min-w-[240px] flex-1"><Input id="name" name="name" defaultValue={values.name ?? ""} required error={e.name} placeholder="e.g. Surya Enclave Phase 3 pre-launch" /></Field>
              {isNew && templates.length > 0 && (
                <div className="text-xs">
                  <span className="mb-1 block font-medium">Start from a saved template</span>
                  <select className="rounded-brand border border-line bg-white px-2 py-2 text-sm" defaultValue="" onChange={(ev) => { if (ev.target.value) router.push(`/admin/campaigns/new?template=${ev.target.value}`); }} aria-label="Saved templates">
                    <option value="">Choose…</option>
                    {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              )}
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <Field label="About" htmlFor="project_id" hint={projectId ? "Leads who already got a message about this project in another campaign are skipped. For a new project, create a new campaign." : "General knowledge: tips and guides, not about one project."}>
                <Select id="project_id" name="project_id" value={projectId} onChange={(ev) => { setProjectId(ev.target.value); setTimeout(refreshCount, 0); }}>
                  <option value="">General knowledge (no project)</option>
                  {projects.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
                </Select>
              </Field>
              <Field label="Message type" htmlFor="message_type" hint={type === "text" ? "Text reaches people who messaged you in the last 24 hours (Meta rule)." : "An approved Meta template; placeholders map to {{1}}, {{2}}… in order, media goes in the header."}>
                <Select id="message_type" name="message_type" value={type} onChange={(ev) => setType(ev.target.value)}>
                  <option value="text">Text message</option>
                  <option value="template">Approved template</option>
                </Select>
              </Field>
              {type === "template" && (
                <>
                  <Field label="Template name" htmlFor="template_name" error={e.template_name}><Input id="template_name" name="template_name" defaultValue={values.template_name ?? ""} placeholder="e.g. new_project_launch" error={e.template_name} /></Field>
                  <Field label="Language code" htmlFor="template_language"><Input id="template_language" name="template_language" defaultValue={values.template_language ?? "en"} placeholder="en, en_US, hi, pa" /></Field>
                </>
              )}
            </div>
            <div className="mt-4">
              <div className="mb-3 rounded-brand border border-accent/30 bg-accent/5 p-3 text-xs text-ink">
                <p className="font-medium">Nurture, don&apos;t push</p>
                <p className="mt-0.5 text-muted">Share something useful (a tip, a guide, an update) so leads remember us when they are ready to buy. No pressure, no &quot;offer ends today&quot;. Start from an idea and make it yours:</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {STARTERS.map((st) => (
                    <button key={st.label} type="button" onClick={() => setMessage(st.text.replace("[project]", projects.find((x) => String(x.id) === projectId)?.name ?? "this project"))}
                      className="rounded-brand border border-accent/40 bg-white px-2.5 py-1 text-xs text-accent-ink hover:border-accent">{st.label}</button>
                  ))}
                </div>
              </div>
              <label htmlFor="message" className="mb-1 block text-xs font-medium">Message</label>
              <div className="mb-2 flex flex-wrap gap-1.5">
                {PLACEHOLDERS.map((p) => <button key={p.token} type="button" onClick={() => insert(p.token)} className="rounded-brand border border-line bg-white px-2 py-0.5 text-xs hover:border-ink" title={p.label}>{p.token}</button>)}
              </div>
              <Textarea id="message" name="message" ref={textRef} rows={6} value={message} onChange={(ev) => setMessage(ev.target.value)} error={e.message} placeholder={"Hello {{name}}, this is {{employee}} from Manav Narula Realtor. New 150 to 250 sq.yd plots are opening in Surya Enclave Phase 3 from ₹58 L. Reply YES for the brochure or call {{phone}}."} />
              <div className="mt-1 flex justify-between text-xs text-muted"><span>{e.message ? <span className="text-red-700">{e.message}</span> : "Write it the way you would type it to one person. Placeholders fill in per recipient."}</span><span className="tabular">{message.length}/1024</span></div>
            </div>
            <div className="mt-4">
              {!showVariants ? (
                <button type="button" onClick={() => setShowVariants(true)} className="text-sm text-accent-ink hover:underline">+ Add wording variants (each person gets one at random, so it reads less like a blast)</button>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs font-medium">Wording variants <span className="font-normal text-muted">(optional; same placeholders work)</span></p>
                  <Textarea name="variant_b" rows={3} value={variantB} onChange={(ev) => setVariantB(ev.target.value)} placeholder="Variant B, a different opening or angle" aria-label="Variant B" />
                  <Textarea name="variant_c" rows={3} value={variantC} onChange={(ev) => setVariantC(ev.target.value)} placeholder="Variant C" aria-label="Variant C" />
                  {e.variants && <p className="text-xs text-red-700">{e.variants}</p>}
                </div>
              )}
            </div>
          </section>

          <section className="rounded-brand border border-line bg-white p-5">
            <h2 className="text-base">Attachment</h2>
            <p className="mt-1 mb-4 text-xs text-muted">One image, a PDF brochure or a short video goes with the message. The message becomes the caption. Meta downloads the file from your live website, so attachments send once the site is on its public domain.</p>
            <input type="hidden" name="media_current" value={values.media_url ?? ""} />
            <input type="hidden" name="media_filename_current" value={values.media_filename ?? ""} />
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Type" htmlFor="media_type">
                <Select id="media_type" name="media_type" value={mediaType} onChange={(ev) => { setMediaType(ev.target.value as MediaType); setMediaError(""); if (ev.target.value !== values.media_type) { setMediaPreview(null); setMediaName(null); setHasNewFile(false); if (fileRef.current) fileRef.current.value = ""; } }}>
                  <option value="none">No attachment</option>
                  <option value="image">Image (JPG or PNG, up to 5 MB)</option>
                  <option value="document">Brochure PDF (up to 16 MB)</option>
                  <option value="video">Video (MP4, up to 20 seconds, 16 MB)</option>
                </Select>
              </Field>
              {mediaType !== "none" && (
                <Field label={values.media_url && mediaType === values.media_type ? "Replace file (optional)" : "File"} htmlFor="media_file" error={e.media || mediaError}>
                  <input ref={fileRef} id="media_file" name="media_file" type="file" accept={mediaType === "image" ? "image/jpeg,image/png,image/webp" : mediaType === "document" ? "application/pdf" : "video/mp4"} onChange={onFile} className="block w-full text-sm file:mr-3 file:rounded-brand file:border file:border-line file:bg-white file:px-3 file:py-1.5 file:text-sm" />
                </Field>
              )}
            </div>
            {mediaType !== "none" && (mediaPreview || mediaName) && (
              <div className="mt-4 flex items-center gap-4 rounded-brand border border-line bg-bg p-3">
                {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview */}
                {mediaType === "image" && mediaPreview && <img src={mediaPreview} alt="" className="h-20 w-28 rounded-brand object-cover" />}
                {mediaType === "video" && mediaPreview && <video src={mediaPreview} controls muted className="h-24 rounded-brand" />}
                {mediaType === "document" && <Icon name="file" size={28} className="text-muted" />}
                <div className="text-sm"><p>{mediaName ?? "Attached file"}</p>{values.media_url && mediaType === values.media_type && !hasNewFile && <a href={values.media_url} target="_blank" rel="noopener" className="text-xs text-accent-ink hover:underline">Open current file</a>}</div>
              </div>
            )}
          </section>

          <section className="rounded-brand border border-line bg-white p-5">
            <h2 className="text-base">Audience</h2>
            <p className="mt-1 mb-4 text-xs text-muted">Who receives it: leads from your lead database only. Closed-lost leads are never included.</p>
            <div className="space-y-4">
              <div>
                <p className="mb-1.5 text-xs font-medium">Send to</p>
                <input type="hidden" name="kinds" value="lead" />
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 rounded-brand border border-accent bg-accent/10 px-2.5 py-1 text-xs text-accent-ink"><Icon name="users" size={12} />Leads</span>
                  <label className="inline-flex items-center gap-1.5 text-xs"><input type="checkbox" name="optInOnly" value="1" defaultChecked={a.optInOnly} onChange={refreshCount} className="accent-[#00BF63]" />Only leads who agreed to WhatsApp (opt-in)</label>
                </div>
                {e.kinds && <p className="mt-1 text-xs text-red-700">{e.kinds}</p>}
              </div>
              <div><p className="mb-1.5 text-xs font-medium">Status <span className="font-normal text-muted">(any if none ticked)</span></p>{checks("statuses", LEAD_STATUSES.filter((s) => s !== "Closed lost"), a.statuses)}</div>
              <div><p className="mb-1.5 text-xs font-medium">Interest</p>{checks("interests", [...INTERESTS], a.interests)}</div>
              <div><p className="mb-1.5 text-xs font-medium">Locality</p>{checks("localities", localities, a.localities)}</div>
              <div><p className="mb-1.5 text-xs font-medium">Tags</p>{checks("tags", tags, a.tags)}</div>
            </div>
          </section>

          <section className="rounded-brand border border-line bg-white p-5">
            <h2 className="text-base">Pace</h2>
            <p className="mt-1 mb-4 text-xs text-muted">Messages go out one by one with a random pause, only inside the window, never more than the daily cap. Large audiences finish over several days on their own.</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Window from (IST)" htmlFor="window_start"><Select id="window_start" name="window_start" defaultValue={values.window_start ?? 10}>{hours.slice(0, 24).map((h) => <option key={h} value={h}>{String(h).padStart(2, "0")}:00</option>)}</Select></Field>
              <Field label="Window to" htmlFor="window_end" error={e.window}><Select id="window_end" name="window_end" defaultValue={values.window_end ?? 19}>{hours.slice(1).map((h) => <option key={h} value={h}>{String(h).padStart(2, "0")}:00</option>)}</Select></Field>
              <Field label="Daily cap" htmlFor="daily_cap"><Input id="daily_cap" name="daily_cap" type="number" min={1} max={5000} defaultValue={values.daily_cap ?? 200} /></Field>
              <Field label="Gap between messages (s)" htmlFor="gap_seconds"><Input id="gap_seconds" name="gap_seconds" type="number" min={1} max={120} defaultValue={values.gap_seconds ?? 3} /></Field>
            </div>
          </section>
        </div>

        <div className="space-y-5 lg:col-span-5">
          <section className="rounded-brand border border-line bg-white p-5">
            <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted">Preview</p>
            <div className="mt-3 rounded-brand bg-bg p-4">
              <div className="max-w-[300px] overflow-hidden rounded-brand border border-line bg-white text-sm">
                {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview */}
                {mediaType === "image" && mediaPreview && <img src={mediaPreview} alt="" className="aspect-[4/3] w-full object-cover" />}
                {mediaType === "video" && mediaPreview && <video src={mediaPreview} muted className="w-full" />}
                {mediaType === "document" && (mediaName || values.media_url) && <div className="flex items-center gap-2 border-b border-line bg-bg px-3 py-2 text-xs"><Icon name="file" size={16} />{mediaName ?? values.media_filename ?? "Brochure.pdf"}</div>}
                <div className="whitespace-pre-wrap px-3 py-2">{preview(message) || <span className="text-muted">Your message appears here as Harpreet Singh would see it.</span>}</div>
              </div>
              {showVariants && (variantB || variantC) && <p className="mt-2 text-xs text-muted">Plus {[variantB, variantC].filter(Boolean).length} variant{[variantB, variantC].filter(Boolean).length > 1 ? "s" : ""}, chosen at random per person.</p>}
            </div>
          </section>
          <section className="rounded-brand border border-line bg-white p-5">
            <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted">Audience size</p>
            <p className="mt-2 text-3xl tabular">{count ? count.n : "…"}</p>
            <p className="text-xs text-muted">people match right now{count?.sample.length ? `: ${count.sample.slice(0, 5).join(", ")}${count.n > 5 ? "…" : ""}` : ""}</p>
            {!!count?.skipped && <p className="mt-1 text-xs text-amber-800">{count.skipped} more left out: already messaged about this project in another campaign.</p>}
            <button type="button" onClick={refreshCount} className="mt-3 text-xs text-accent-ink hover:underline">Refresh count</button>
          </section>
          {!locked && (
            <section className="rounded-brand border border-line bg-white p-5">
              <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted">Send</p>
              <p className="mt-1 text-xs text-muted">Only an admin can send. Employees never see campaigns.</p>
              {!connected && <p className="mt-2 rounded-brand border border-line bg-bg px-3 py-2 text-xs text-muted">WhatsApp API is not connected yet. You can save drafts and templates; connect it under <Link href="/admin/settings/whatsapp" className="text-accent-ink hover:underline">Settings</Link> to send.</p>}
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Field label="Schedule date" htmlFor="schedule_date" error={e.schedule_date}><Input id="schedule_date" name="schedule_date" type="date" min={today} defaultValue={values.scheduled_at ? values.scheduled_at.slice(0, 10) : ""} /></Field>
                <Field label="Time" htmlFor="schedule_time"><Input id="schedule_time" name="schedule_time" type="time" defaultValue={values.scheduled_at ? values.scheduled_at.slice(11, 16) : "10:00"} /></Field>
              </div>
              <label className="mt-4 flex items-start gap-2 text-sm">
                <input type="checkbox" name="confirm" value="1" checked={confirmed} onChange={(ev) => setConfirmed(ev.target.checked)} className="mt-0.5 accent-[#00BF63]" />
                <span>I have checked the message, attachment and audience{count ? ` (${count.n} people)` : ""}.</span>
              </label>
              <FormError message={state.error} />
              <div className="mt-4 flex flex-wrap gap-2">
                <SubmitButton variant="secondary" name="intent" value="draft">{isNew ? "Save draft" : "Save"}</SubmitButton>
                <SubmitButton variant="secondary" name="intent" value="template">Save as template</SubmitButton>
                <SubmitButton variant="secondary" name="intent" value="schedule">Schedule</SubmitButton>
                <SubmitButton name="intent" value="send" className={confirmed && connected ? "" : "opacity-50"}>Send now</SubmitButton>
              </div>
            </section>
          )}
        </div>
      </div>
    </form>
  );
}
