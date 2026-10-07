"use client";
import Link from "next/link";
import { useActionState } from "react";
import { Field, FormError, Input, Section, Select, SubmitButton, Textarea } from "@/components/console/Form";
import ImageField from "@/components/console/ImageField";
import ProjectMediaEditor from "@/components/console/ProjectMediaEditor";
import UnitsEditor from "@/components/console/UnitsEditor";
import RowsEditor from "@/components/console/RowsEditor";
import ConfirmButton from "@/components/console/ConfirmButton";
import { PROJECT_STATUSES } from "@/lib/console";
import { toDateInput } from "@/lib/dates";
import type { DeveloperRow, ProjectConfig, ProjectMilestone, ProjectRow } from "@/lib/queries/content";
import type { ProjectFormState } from "./actions";
import type { ProjectMedia } from "@/data/projects";

/** The project's images for the manager; projects saved before the manager existed get them from the old image fields. */
function adminMedia(p: ProjectRow): ProjectMedia[] {
  if (p.media?.length) return p.media;
  const shots = [...new Set([p.image, ...(p.gallery ?? [])].filter((u): u is string => !!u))];
  return [
    ...shots.map((url, i) => ({ url, alt: `${p.name}${i ? `, photo ${i + 1}` : ""}`, kind: "elevation" as const })),
    ...[...(p.floor_plans ?? []), ...(p.floor_plan ? [{ url: p.floor_plan, label: "" }] : [])].map((f) => ({ url: f.url, alt: f.label || `${p.name} floor plan`, kind: "floor-plan" as const })),
    ...(p.master_plan ? [{ url: p.master_plan, alt: `${p.name} master plan`, kind: "master-plan" as const }] : []),
  ];
}

interface Props {
  project?: ProjectRow | null; configs?: ProjectConfig[]; milestones?: ProjectMilestone[]; localities: string[]; developers: Pick<DeveloperRow, "id" | "name">[];
  action: (prev: ProjectFormState, fd: FormData) => Promise<ProjectFormState>; onDelete?: () => Promise<void>;
}

export default function ProjectForm({ project: p, configs = [], milestones = [], localities, developers, action, onDelete }: Props) {
  const [state, act] = useActionState<ProjectFormState, FormData>(action, {});
  const e = state.errors ?? {};
  const done = milestones.filter((m) => m.done).length;
  const edited = new Set(p?.edited_fields ?? []);
  // Marks a field the re-import will leave alone because it was changed here.
  const mark = (f: string) => (edited.has(f) ? " · edited, kept on re-import" : "");
  const hasDeveloperImages = [...(p?.media ?? []), ...(p?.units ?? []).flatMap((u) => u.media ?? [])].some((m) => m.developer);
  return (
    <form action={act} className="space-y-5">
      <FormError message={state.message} />
      <Section title="Basics">
        <Field label="Project name" htmlFor="name" error={e.name}><Input id="name" name="name" defaultValue={p?.name} required /></Field>
        <Field label={`Developer${mark("developer")}`} htmlFor="developer_id" error={e.developer_id} hint="Manage developers in Admin > Developers.">
          <Select id="developer_id" name="developer_id" defaultValue={p?.developer_id ?? ""} required><option value="">Choose</option>{developers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</Select>
        </Field>
        <Field label="Status" htmlFor="status"><Select id="status" name="status" defaultValue={p?.status ?? "Upcoming"}>{PROJECT_STATUSES.map((st) => <option key={st}>{st}</option>)}</Select></Field>
        <Field label="Possession" htmlFor="possession"><Input id="possession" name="possession" defaultValue={p?.possession ?? ""} placeholder="December 2027 or Ready to move" /></Field>
        <Field label={`Project RERA No.${mark("rera")}`} htmlFor="rera" error={e.rera} hint="Required before the project can be published."><Input id="rera" name="rera" defaultValue={p?.rera ?? ""} placeholder="PBRERA-JAL33-PR0000" /></Field>
        <Field label="Price from (₹)" htmlFor="price_from" error={e.price_from} hint="Whole rupees, e.g. 4500000. Blank shows &quot;Price on request&quot;."><Input id="price_from" name="price_from" inputMode="numeric" defaultValue={p?.price_from == null ? "" : String(Number(p.price_from))} /></Field>
        <Field label={`Sizes${mark("size_range")}`} htmlFor="size_range"><Input id="size_range" name="size_range" defaultValue={p?.size_range ?? ""} placeholder="1,330–2,400 sq ft" /></Field>
        <Field label="Slug" htmlFor="slug" hint="Leave blank to generate from the name."><Input id="slug" name="slug" defaultValue={p?.slug ?? ""} /></Field>
      </Section>

      <Section title="Location">
        <Field label={`Locality${mark("locality")}`} htmlFor="locality" error={e.locality}><Select id="locality" name="locality" defaultValue={p?.locality ?? ""}><option value="">Choose</option>{localities.map((l) => <option key={l}>{l}</option>)}</Select></Field>
        <Field label={`City${mark("city")}`} htmlFor="city"><Input id="city" name="city" defaultValue={p?.city ?? "Jalandhar"} /></Field>
        <Field label={`Address${mark("address")}`} htmlFor="address" className="md:col-span-2"><Input id="address" name="address" defaultValue={p?.address ?? ""} /></Field>
        <Field label={`Location highlights${mark("location_highlights")}`} htmlFor="location_highlights" hint="One per line, e.g. Bus Stand: 13 min by road" className="md:col-span-2"><Textarea id="location_highlights" name="location_highlights" rows={4} defaultValue={(p?.location_highlights ?? []).join("\n")} /></Field>
      </Section>

      <Section title="Website and featured" description="Featured projects appear in the homepage strip, in this order.">
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="featured" defaultChecked={p?.featured} className="accent-[#00BF63]" />Feature on the homepage</label>
        <Field label="Featured order" htmlFor="featured_order" hint="1 shows first."><Input id="featured_order" name="featured_order" type="number" min={1} defaultValue={p?.featured_order ?? ""} /></Field>
        {(hasDeveloperImages || p?.show_developer_images) && (
          <label className="flex items-start gap-2 rounded-brand border border-line bg-bg p-3 text-sm md:col-span-2">
            <input type="checkbox" name="show_developer_images" defaultChecked={p?.show_developer_images} className="mt-0.5 accent-[#00BF63]" />
            <span><strong>Show developer images</strong><span className="block text-xs text-muted">Turn on only once the developer has given written permission. Off: the website shows our branded placeholder instead of their images.</span></span>
          </label>
        )}
      </Section>

      <Section title="Our copy" description="Our own words, never the developer's. Kept on re-import once written.">
        <Field label={`Description${mark("description")}`} htmlFor="description" hint="Blank line between paragraphs." className="md:col-span-2"><Textarea id="description" name="description" rows={7} defaultValue={p?.description ?? ""} /></Field>
        <Field label={`Highlights${mark("highlights")}`} htmlFor="highlights" hint="One per line." className="md:col-span-2"><Textarea id="highlights" name="highlights" rows={5} defaultValue={(p?.highlights ?? []).join("\n")} /></Field>
        <Field label={`SEO title${mark("seo_title")}`} htmlFor="seo_title" hint="About 60 characters."><Input id="seo_title" name="seo_title" defaultValue={p?.seo_title ?? ""} maxLength={120} /></Field>
        <Field label={`SEO description${mark("seo_description")}`} htmlFor="seo_description" hint="About 155 characters."><Input id="seo_description" name="seo_description" defaultValue={p?.seo_description ?? ""} maxLength={300} /></Field>
      </Section>

      <Section title={`Key facts${mark("key_facts")}`} description="Land area, towers, floors, units and anything else worth a label.">
        <div className="md:col-span-2"><RowsEditor columns={[{ name: "kf_label", label: "Label", placeholder: "Land" }, { name: "kf_value", label: "Value", placeholder: "4.2 acres" }]} initial={(p?.key_facts ?? [{ label: "Land", value: "" }, { label: "Towers", value: "" }]).map((k) => ({ kf_label: k.label, kf_value: k.value }))} addLabel="Add fact" /></div>
      </Section>

      <Section title={`Configurations and pricing${mark("configurations")}`} description="Blank price shows &quot;On request&quot;.">
        <div className="md:col-span-2"><RowsEditor columns={[{ name: "cfg_type", label: "Type", placeholder: "3 BHK" }, { name: "cfg_area", label: "Size", placeholder: "1,580 sq ft" }, { name: "cfg_note", label: "Note", placeholder: "Suits a joint family" }, { name: "cfg_price", label: "Price", placeholder: "₹64 L" }]} initial={configs.map((c) => ({ cfg_type: c.type, cfg_area: c.area ?? "", cfg_note: c.note ?? "", cfg_price: c.price ?? "" }))} addLabel="Add configuration" /></div>
      </Section>

      <Section title="Unit types" description="Tabs on the project page (e.g. 2 BHK | 3 BHK | Affordable), each with its own page for search engines.">
        <div className="md:col-span-2"><UnitsEditor initial={p?.units ?? []} projectSlug={p?.slug ?? "<slug>"} /></div>
      </Section>

      <Section title={`Amenities${mark("amenities")}`}>
        <Field label="Amenities" htmlFor="amenities" hint="One per line." className="md:col-span-2"><Textarea id="amenities" name="amenities" rows={6} defaultValue={(p?.amenities ?? []).join("\n")} /></Field>
      </Section>

      <Section title={`Questions buyers ask${mark("faqs")}`} description="Shown on the page and to search engines as FAQ.">
        <div className="md:col-span-2"><RowsEditor columns={[{ name: "faq_q", label: "Question" }, { name: "faq_a", label: "Answer" }]} initial={(p?.faqs ?? []).map((f) => ({ faq_q: f.q, faq_a: f.a }))} addLabel="Add question" /></div>
      </Section>

      <Section title="Construction milestones" description={milestones.length ? `Progress is calculated from ticked milestones: ${done} of ${milestones.length} done = ${Math.round((100 * done) / milestones.length)}%.` : "Progress % is calculated automatically from the ticked milestones."}>
        <div className="md:col-span-2"><RowsEditor columns={[{ name: "ms_title", label: "Milestone", placeholder: "Structure" }, { name: "ms_date", label: "Date", type: "date", width: "170px" }, { name: "ms_done", label: "Done", type: "checkbox", width: "60px" }]} initial={milestones.map((m) => ({ ms_title: m.title, ms_date: toDateInput(m.date), ms_done: m.done }))} addLabel="Add milestone" /></div>
      </Section>

      <Section title={`Images and brochure${mark("media")}`} description="Hero, gallery, floor plans, master plan, amenity and location images. Your changes here are never overwritten by a re-import.">
        <div className="md:col-span-2"><ProjectMediaEditor initial={p ? adminMedia(p) : []} /></div>
        {e.image && <p className="text-xs text-red-700 md:col-span-2">{e.image}</p>}
        <div className="md:col-span-2"><ImageField name="brochure" label="Brochure (PDF)" initial={p?.brochure} accept="application/pdf" preview={false} hint="Visitors download this from the project page." /></div>
      </Section>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
        <div className="flex flex-wrap gap-2">
          <SubmitButton name="intent" value="draft" variant="secondary">Save as draft</SubmitButton>
          <SubmitButton name="intent" value="publish">Publish</SubmitButton>
          <Link href="/admin/properties" className="self-center text-sm text-muted hover:text-ink">Cancel</Link>
        </div>
        {p && onDelete && <ConfirmButton label="Delete" confirmLabel="Delete project" action={onDelete} />}
      </div>
    </form>
  );
}
