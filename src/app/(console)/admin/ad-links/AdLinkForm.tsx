"use client";
import Link from "next/link";
import { useActionState, useState } from "react";
import { Field, FormError, Input, Section, Select, SubmitButton, Textarea } from "@/components/console/Form";
import ConfirmButton from "@/components/console/ConfirmButton";
import type { LeadLink } from "@/lib/queries/lead-links";
import type { AdLinkFormState } from "./actions";

const slugOf = (s: string) => s.toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
const PREFIX: Record<string, string> = { Facebook: "fb", Instagram: "ig", WhatsApp: "wa", Google: "g" };

export default function AdLinkForm({ link: k, projects, channels, siteUrl, action, onDelete }: {
  link?: LeadLink | null; projects: { id: number; name: string }[]; channels: readonly string[]; siteUrl: string;
  action: (p: AdLinkFormState, fd: FormData) => Promise<AdLinkFormState>; onDelete?: () => Promise<void>;
}) {
  const [state, act] = useActionState<AdLinkFormState, FormData>(action, {});
  const e = state.errors ?? {};
  const [name, setName] = useState(k?.name ?? "");
  const [channel, setChannel] = useState(k?.channel ?? "Facebook");
  const [slug, setSlug] = useState(k?.slug ?? "");
  // A new link's address follows its name and channel until the admin types one.
  const [slugEdited, setSlugEdited] = useState(!!k);
  const shown = slugEdited ? slug : slugOf([PREFIX[channel], name].filter(Boolean).join(" "));
  return (
    <form action={act} className="max-w-3xl space-y-5">
      <FormError message={state.message} />
      <Section title="Link" description="Paste the address into the ad's website link. Each ad or post should get its own link, so you can see which one brings leads.">
        <Field label="Name" htmlFor="name" error={e.name} hint="For you only, e.g. Mexmon Dreams, October ad."><Input id="name" name="name" value={name} onChange={(ev) => setName(ev.target.value)} required maxLength={80} /></Field>
        <Field label="Used on" htmlFor="channel" error={e.channel} hint="Leads from this link get this as their source.">
          <Select id="channel" name="channel" value={channel} onChange={(ev) => setChannel(ev.target.value)}>{channels.map((c) => <option key={c}>{c}</option>)}</Select>
        </Field>
        <Field label="Address" htmlFor="slug" error={e.slug} hint={`${siteUrl}/l/${shown || "…"}`} className="md:col-span-2">
          <Input id="slug" name="slug" value={shown} onChange={(ev) => { setSlugEdited(true); setSlug(ev.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, "-")); }} maxLength={60} />
        </Field>
        <Field label="About (optional)" htmlFor="project_id" hint="Shows the project's photo, price and developer credit on the page." className="md:col-span-2">
          <Select id="project_id" name="project_id" defaultValue={k?.project_id ?? ""}>
            <option value="">General enquiry (no project)</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </Select>
        </Field>
      </Section>
      <Section title="Page text" description="Leave empty to use the standard wording.">
        <Field label="Headline" htmlFor="headline" hint="e.g. 3 BHK flats in Jalandhar, ready to move" className="md:col-span-2"><Input id="headline" name="headline" defaultValue={k?.headline ?? ""} maxLength={120} /></Field>
        <Field label="Short text" htmlFor="intro" hint="One or two lines under the headline. Keep it true to the ad." className="md:col-span-2"><Textarea id="intro" name="intro" rows={2} defaultValue={k?.intro ?? ""} maxLength={300} /></Field>
        <label className="flex items-center gap-2 text-sm md:col-span-2"><input type="checkbox" name="active" defaultChecked={k ? k.active : true} className="accent-[#00BF63]" />On: the link takes enquiries (when off, visitors go to the website)</label>
      </Section>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
        <div className="flex gap-2"><SubmitButton>Save</SubmitButton><Link href="/admin/ad-links" className="self-center text-sm text-muted hover:text-ink">Cancel</Link></div>
        {k && onDelete && <ConfirmButton label="Delete" confirmLabel="Delete link" action={onDelete} />}
      </div>
    </form>
  );
}
