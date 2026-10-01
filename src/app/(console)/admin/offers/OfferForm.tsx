"use client";
import Link from "next/link";
import { offerCta } from "@/lib/format";
import { useActionState, useState } from "react";
import { Field, FormError, Input, Section, Select, SubmitButton, Textarea } from "@/components/console/Form";
import ImageField from "@/components/console/ImageField";
import BannerPreview from "@/components/console/BannerPreview";
import { toDateInput } from "@/lib/dates";
import type { OfferRow } from "@/lib/queries/content";
import type { OfferFormState } from "./actions";

export default function OfferForm({ offer: o, properties, projects, action }: { offer?: OfferRow | null; properties: { id: number; title: string }[]; projects: { id: number; name: string }[]; action: (p: OfferFormState, fd: FormData) => Promise<OfferFormState> }) {
  const [state, act] = useActionState<OfferFormState, FormData>(action, {});
  const e = state.errors ?? {};
  const [linkType, setLinkType] = useState(o?.property_id ? "property" : o?.project_id ? "project" : "url");
  const [title, setTitle] = useState(o?.title ?? "");
  const [text, setText] = useState(o?.text ?? "");
  const [link, setLink] = useState(o?.link ?? "");
  return (
    <form action={act} className="grid gap-5 lg:grid-cols-12">
      <div className="space-y-5 lg:col-span-7">
        <FormError message={state.message} />
        <Section title="Offer creative">
          <Field label="Title" htmlFor="title" error={e.title} className="md:col-span-2"><Input id="title" name="title" value={title} onChange={(ev) => setTitle(ev.target.value)} maxLength={90} /></Field>
          <Field label="Short text" htmlFor="text" className="md:col-span-2"><Textarea id="text" name="text" rows={2} value={text} onChange={(ev) => setText(ev.target.value)} maxLength={160} /></Field>
          <div className="md:col-span-2"><ImageField name="image" label="Image" initial={o?.image} hint="Recommended 1440 x 400 px." />{e.image && <p className="mt-1 text-xs text-red-700">{e.image}</p>}</div>
          <Field label="Links to" htmlFor="link_type"><Select id="link_type" name="link_type" value={linkType} onChange={(ev) => setLinkType(ev.target.value)}><option value="url">A page or URL</option><option value="property">A property</option><option value="project">A project</option></Select></Field>
          {linkType === "url" && <Field label="Link" htmlFor="link" error={e.link}><Input id="link" name="link" value={link} onChange={(ev) => setLink(ev.target.value)} placeholder="/home-loans" /></Field>}
          {linkType === "property" && <Field label="Property" htmlFor="property_id" error={e.property_id}><Select id="property_id" name="property_id" defaultValue={o?.property_id ?? ""}><option value="">Choose</option>{properties.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}</Select></Field>}
          {linkType === "project" && <Field label="Project" htmlFor="project_id" error={e.project_id}><Select id="project_id" name="project_id" defaultValue={o?.project_id ?? ""}><option value="">Choose</option>{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</Select></Field>}
          <div className="flex items-end pb-2"><label className="flex items-center gap-2 text-sm"><input type="checkbox" name="active" defaultChecked={o ? o.active : true} className="accent-[#00BF63]" />Active</label></div>
        </Section>
        <Section title="Schedule">
          <Field label="Start date" htmlFor="start_date"><Input id="start_date" name="start_date" type="date" defaultValue={toDateInput(o?.start_date)} /></Field>
          <Field label="End date" htmlFor="end_date" error={e.end_date}><Input id="end_date" name="end_date" type="date" defaultValue={toDateInput(o?.end_date)} /></Field>
        </Section>
        <div className="flex gap-2"><SubmitButton>Save offer</SubmitButton><Link href="/admin/offers" className="self-center text-sm text-muted hover:text-ink">Cancel</Link></div>
      </div>
      <div className="lg:col-span-5">
        <p className="mb-2 text-xs font-medium text-ink">Preview</p>
        <BannerPreview group="offer" image={o?.image} headline={title} line={text} ctaLabel={offerCta(linkType === "property" ? "/properties/" : linkType === "project" ? "/projects/" : link || "/contact")} />
      </div>
    </form>
  );
}
