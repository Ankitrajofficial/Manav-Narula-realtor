"use client";
import Link from "next/link";
import { useActionState, useState } from "react";
import { Field, FormError, Input, Section, Select, SubmitButton, Textarea } from "@/components/console/Form";
import ImageField from "@/components/console/ImageField";
import Icon from "@/components/Icon";
import { toDateInput } from "@/lib/dates";
import { POPUP_KINDS, type PopupKind } from "@/lib/popups";
import type { PopupRow } from "@/lib/queries/popups";
import type { PopupFormState } from "./actions";

export default function PopupForm({ popup: p, action }: { popup?: PopupRow | null; action: (s: PopupFormState, fd: FormData) => Promise<PopupFormState> }) {
  const [state, act] = useActionState<PopupFormState, FormData>(action, {});
  const e = state.errors ?? {};
  const [kind, setKind] = useState<PopupKind>(p?.kind ?? "promo");
  const [title, setTitle] = useState(p?.title ?? "");
  const [text, setText] = useState(p?.text ?? "");
  const [ctaLabel, setCtaLabel] = useState(p?.cta_label ?? "");
  const [showOn, setShowOn] = useState(!p || p.pages === "all" ? "all" : p.pages === "home" ? "home" : "pages");
  const [preview, setPreview] = useState<string | null>(p?.image ?? null);

  return (
    <form action={act} className="grid gap-5 lg:grid-cols-12"
      // The image picker is a plain file input: show the chosen picture in the preview straight away.
      onChange={(ev) => {
        const t = ev.nativeEvent.target as HTMLInputElement;
        if (t.name === "image" && t.files?.[0]) setPreview(URL.createObjectURL(t.files[0]));
      }}>
      <div className="space-y-5 lg:col-span-7">
        <FormError message={state.message} />
        <Section title="Type">
          <div className="grid gap-2 md:col-span-2 sm:grid-cols-2">
            {POPUP_KINDS.map((k) => (
              <label key={k.value} className={`flex cursor-pointer gap-3 rounded-brand border p-3 text-sm ${kind === k.value ? "border-accent bg-accent/5" : "border-line bg-white hover:border-ink"}`}>
                <input type="radio" name="kind" value={k.value} checked={kind === k.value} onChange={() => setKind(k.value)} className="mt-0.5 accent-[#00BF63]" />
                <span><span className="block font-medium">{k.label}</span><span className="mt-0.5 block text-xs text-muted">{k.hint}</span></span>
              </label>
            ))}
          </div>
        </Section>

        <Section title="Content">
          <Field label="Title" htmlFor="title" error={e.title} className="md:col-span-2"><Input id="title" name="title" value={title} onChange={(ev) => setTitle(ev.target.value)} maxLength={90} placeholder={kind === "promo" ? "Jalandhar Heights IV: bookings open" : "Free property consultation"} /></Field>
          <Field label="Text" htmlFor="text" error={e.text} className="md:col-span-2"><Textarea id="text" name="text" rows={3} value={text} onChange={(ev) => setText(ev.target.value)} maxLength={400} /></Field>
          <div className="md:col-span-2">
            <ImageField name="image" label={kind === "promo" ? "Image" : "Image (optional)"} initial={p?.image} hint="JPG, PNG or WebP. Shown whole, never cropped: a poster or a 4:3 photo both work." />
            {e.image && <p className="mt-1 text-xs text-red-700">{e.image}</p>}
          </div>
          {kind === "promo" && (
            <>
              <Field label="Button text (optional)" htmlFor="cta_label" error={e.cta_label}><Input id="cta_label" name="cta_label" value={ctaLabel} onChange={(ev) => setCtaLabel(ev.target.value)} maxLength={40} placeholder="View project" /></Field>
              <Field label="Button link" htmlFor="cta_href" error={e.cta_href} hint="A page on this site (/projects/...) or a full https:// link."><Input id="cta_href" name="cta_href" defaultValue={p?.cta_href ?? ""} placeholder="/properties/jalandhar-heights-iv" /></Field>
            </>
          )}
        </Section>

        <Section title="Where and when">
          <Field label="Show on" htmlFor="show_on">
            <Select id="show_on" name="show_on" value={showOn} onChange={(ev) => setShowOn(ev.target.value)}>
              <option value="all">All pages</option>
              <option value="home">Home page only</option>
              <option value="pages">Specific pages</option>
            </Select>
          </Field>
          <Field label="Delay (seconds)" htmlFor="delay_seconds" error={e.delay_seconds} hint="Also appears once the visitor scrolls half-way down."><Input id="delay_seconds" name="delay_seconds" type="number" min={0} max={600} defaultValue={p?.delay_seconds ?? 8} /></Field>
          {showOn === "pages" && (
            <Field label="Pages" htmlFor="page_paths" error={e.page_paths} hint="One per line. /properties also covers every property page under it." className="md:col-span-2">
              <Textarea id="page_paths" name="page_paths" rows={3} defaultValue={p && p.pages !== "all" && p.pages !== "home" ? p.pages : ""} placeholder={"/properties\n/projects"} />
            </Field>
          )}
          <Field label="Start date (optional)" htmlFor="start_date"><Input id="start_date" name="start_date" type="date" defaultValue={toDateInput(p?.start_date)} /></Field>
          <Field label="End date (optional)" htmlFor="end_date" error={e.end_date}><Input id="end_date" name="end_date" type="date" defaultValue={toDateInput(p?.end_date)} /></Field>
          <label className="flex items-center gap-2 text-sm md:col-span-2"><input type="checkbox" name="active" defaultChecked={p ? p.active : true} className="accent-[#00BF63]" />Switched on</label>
        </Section>

        <div className="flex gap-2"><SubmitButton>Save pop-up</SubmitButton><Link href="/admin/popups" className="self-center text-sm text-muted hover:text-ink">Cancel</Link></div>
      </div>

      <div className="lg:col-span-5">
        <div className="sticky top-20">
          <p className="mb-2 text-xs font-medium text-ink">Preview</p>
          <div className="relative rounded-brand border border-line bg-bg p-5">
            <span className="absolute right-3 top-3 text-muted"><Icon name="close" size={18} /></span>
            {preview && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="" className={`mb-4 w-full rounded-brand bg-white object-contain ${kind === "promo" ? "max-h-72" : "max-h-32"}`} />
            )}
            <p className="pr-8 font-heading text-xl">{title || "Title"}</p>
            {text && <p className="mt-1 whitespace-pre-line text-sm text-muted">{text}</p>}
            {kind === "promo" ? (
              ctaLabel && <span className="mt-4 flex items-center justify-center gap-2 rounded-brand bg-accent px-4 py-2.5 text-sm font-medium text-white">{ctaLabel}<Icon name="arrowRight" size={16} /></span>
            ) : (
              <div className="mt-4 space-y-2 text-xs text-muted">
                <div className="grid grid-cols-2 gap-2"><span className="rounded-brand border border-line bg-white px-2 py-2">Name</span><span className="rounded-brand border border-line bg-white px-2 py-2">Phone</span></div>
                <p>Looking to · Budget · Locality</p>
                <span className="block rounded-brand bg-accent px-4 py-2.5 text-center text-sm font-medium text-white">Get free suggestions</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </form>
  );
}
