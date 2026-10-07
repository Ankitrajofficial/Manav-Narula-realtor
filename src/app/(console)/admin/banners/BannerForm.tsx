"use client";
import Link from "next/link";
import { useActionState, useState } from "react";
import { Field, FormError, Input, Section, Select, SubmitButton } from "@/components/console/Form";
import ImageField from "@/components/console/ImageField";
import BannerPreview from "@/components/console/BannerPreview";
import { toDateInput } from "@/lib/dates";
import type { BannerRow } from "@/lib/queries/content";
import type { BannerFormState } from "./actions";

export default function BannerForm({ banner: b, group, action }: { banner?: BannerRow | null; group: string; action: (p: BannerFormState, fd: FormData) => Promise<BannerFormState> }) {
  const [state, act] = useActionState<BannerFormState, FormData>(action, {});
  const e = state.errors ?? {};
  const [g, setG] = useState(b?.group ?? group);
  const [headline, setHeadline] = useState(b?.headline ?? "");
  const [line, setLine] = useState(b?.line ?? "");
  const [cta, setCta] = useState(b?.cta_label ?? "");
  const [imageOnly, setImageOnly] = useState(b ? !b.show_text : false);
  return (
    <form action={act} className="grid gap-5 lg:grid-cols-12">
      <div className="space-y-5 lg:col-span-7">
        <FormError message={state.message} />
        <Section title="Banner">
          <Field label="Group" htmlFor="group"><Select id="group" name="group" value={g} onChange={(ev) => setG(ev.target.value)}><option value="carousel">Home carousel</option><option value="offer">Offer banner</option></Select></Field>
          <div className="flex items-end pb-2"><label className="flex items-center gap-2 text-sm"><input type="checkbox" name="active" defaultChecked={b ? b.active : true} className="accent-[#00BF63]" />Active</label></div>
          <Field label="Headline" htmlFor="headline" error={e.headline} className="md:col-span-2"><Input id="headline" name="headline" value={headline} onChange={(ev) => setHeadline(ev.target.value)} maxLength={90} /></Field>
          <Field label="One line" htmlFor="line" className="md:col-span-2"><Input id="line" name="line" value={line} onChange={(ev) => setLine(ev.target.value)} maxLength={140} /></Field>
          <Field label="Button label" htmlFor="cta_label"><Input id="cta_label" name="cta_label" value={cta} onChange={(ev) => setCta(ev.target.value)} maxLength={30} placeholder="View properties" /></Field>
          <Field label="Button link" htmlFor="cta_href" error={e.cta_href}><Input id="cta_href" name="cta_href" defaultValue={b?.cta_href ?? ""} placeholder="/properties" /></Field>
          <div className="md:col-span-2">
            <ImageField name="image" label="Image" initial={b?.image} hint={g === "offer" ? "Recommended 1440 x 400 px, JPG or WebP under 400 KB." : "Recommended 1920 x 800 px, JPG or WebP under 600 KB."} />
            {e.image && <p className="mt-1 text-xs text-red-700">{e.image}</p>}
          </div>
          {g === "carousel" && <label className="flex items-start gap-2 text-sm md:col-span-2"><input type="checkbox" name="image_only" checked={imageOnly} onChange={(ev) => setImageOnly(ev.target.checked)} className="mt-0.5 accent-[#00BF63]" /><span>Image has its own text<span className="block text-xs text-muted">Shows the image as it is, without the dark tint, headline and button. The whole banner links to the button link; the headline is used as the image description.</span></span></label>}
        </Section>
        <Section title="Schedule" description="Leave both blank to show whenever the banner is active.">
          <Field label="Start date" htmlFor="start_date" error={e.start_date}><Input id="start_date" name="start_date" type="date" defaultValue={toDateInput(b?.start_date)} /></Field>
          <Field label="End date" htmlFor="end_date" error={e.end_date}><Input id="end_date" name="end_date" type="date" defaultValue={toDateInput(b?.end_date)} /></Field>
        </Section>
        <div className="flex gap-2"><SubmitButton>Save banner</SubmitButton><Link href="/admin/banners" className="self-center text-sm text-muted hover:text-ink">Cancel</Link></div>
      </div>
      <div className="lg:col-span-5">
        <p className="mb-2 text-xs font-medium text-ink">Preview on website</p>
        <BannerPreview group={g} image={b?.image} headline={headline} line={line} ctaLabel={cta} imageOnly={g === "carousel" && imageOnly} />
        <p className="mt-2 text-xs text-muted">A newly chosen image appears after saving. Text updates live.</p>
      </div>
    </form>
  );
}
