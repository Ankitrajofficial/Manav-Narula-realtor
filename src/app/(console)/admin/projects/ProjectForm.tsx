"use client";
import Link from "next/link";
import { useActionState } from "react";
import { Field, FormError, Input, Section, Select, SubmitButton, Textarea } from "@/components/console/Form";
import ImageField from "@/components/console/ImageField";
import ImageUploader from "@/components/console/ImageUploader";
import RowsEditor from "@/components/console/RowsEditor";
import ConfirmButton from "@/components/console/ConfirmButton";
import { AMENITY_OPTIONS, PROJECT_STATUSES } from "@/lib/console";
import { toDateInput } from "@/lib/dates";
import type { ProjectConfig, ProjectMilestone, ProjectRow } from "@/lib/queries/content";
import type { ProjectFormState } from "./actions";

interface Props {
  project?: ProjectRow | null; configs?: ProjectConfig[]; milestones?: ProjectMilestone[]; localities: string[];
  action: (prev: ProjectFormState, fd: FormData) => Promise<ProjectFormState>; onDelete?: () => Promise<void>;
}

export default function ProjectForm({ project: p, configs = [], milestones = [], localities, action, onDelete }: Props) {
  const [state, act] = useActionState<ProjectFormState, FormData>(action, {});
  const e = state.errors ?? {};
  const done = milestones.filter((m) => m.done).length;
  return (
    <form action={act} className="space-y-5">
      <FormError message={state.message} />
      <Section title="Basics">
        <Field label="Project name" htmlFor="name" error={e.name}><Input id="name" name="name" defaultValue={p?.name} required /></Field>
        <Field label="Developer" htmlFor="developer"><Input id="developer" name="developer" defaultValue={p?.developer ?? ""} /></Field>
        <Field label="Locality" htmlFor="locality" error={e.locality}><Select id="locality" name="locality" defaultValue={p?.locality ?? ""}><option value="">Choose</option>{localities.map((l) => <option key={l}>{l}</option>)}</Select></Field>
        <Field label="Status" htmlFor="status"><Select id="status" name="status" defaultValue={p?.status ?? "Upcoming"}>{PROJECT_STATUSES.map((st) => <option key={st}>{st}</option>)}</Select></Field>
        <Field label="Starting price" htmlFor="starting_price" hint="As shown on cards, e.g. ₹46 L"><Input id="starting_price" name="starting_price" defaultValue={p?.starting_price ?? ""} /></Field>
        <Field label="Possession" htmlFor="possession"><Input id="possession" name="possession" defaultValue={p?.possession ?? ""} placeholder="December 2027 or Ready to move" /></Field>
        <Field label="RERA number" htmlFor="rera"><Input id="rera" name="rera" defaultValue={p?.rera ?? ""} /></Field>
        <Field label="Slug" htmlFor="slug" hint="Leave blank to generate from the name."><Input id="slug" name="slug" defaultValue={p?.slug ?? ""} /></Field>
        <Field label="Description" htmlFor="description" hint="Blank line between paragraphs." className="md:col-span-2"><Textarea id="description" name="description" rows={5} defaultValue={p?.description ?? ""} /></Field>
        <div className="md:col-span-2"><ImageField name="image" label="Hero image" initial={p?.image} hint="Shown at the top of the project page, 16:9." /></div>
        {e.image && <p className="text-xs text-red-700 md:col-span-2">{e.image}</p>}
      </Section>

      <Section title="Key facts" description="Land area, towers, floors, units and anything else worth a label.">
        <div className="md:col-span-2"><RowsEditor columns={[{ name: "kf_label", label: "Label", placeholder: "Land" }, { name: "kf_value", label: "Value", placeholder: "4.2 acres" }]} initial={(p?.key_facts ?? [{ label: "Land", value: "" }, { label: "Towers", value: "" }, { label: "Floors", value: "" }, { label: "Units", value: "" }]).map((k) => ({ kf_label: k.label, kf_value: k.value }))} addLabel="Add fact" /></div>
      </Section>

      <Section title="Configurations and pricing">
        <div className="md:col-span-2"><RowsEditor columns={[{ name: "cfg_type", label: "Type", placeholder: "3 BHK" }, { name: "cfg_area", label: "Area", placeholder: "1,580 sq.ft" }, { name: "cfg_price", label: "Price", placeholder: "₹64 L" }]} initial={configs.map((c) => ({ cfg_type: c.type, cfg_area: c.area ?? "", cfg_price: c.price ?? "" }))} addLabel="Add configuration" /></div>
      </Section>

      <Section title="Construction milestones" description={milestones.length ? `Progress is calculated from ticked milestones: ${done} of ${milestones.length} done = ${Math.round((100 * done) / milestones.length)}%.` : "Progress % is calculated automatically from the ticked milestones."}>
        <div className="md:col-span-2"><RowsEditor columns={[{ name: "ms_title", label: "Milestone", placeholder: "Structure" }, { name: "ms_date", label: "Date", type: "date", width: "170px" }, { name: "ms_done", label: "Done", type: "checkbox", width: "60px" }]} initial={milestones.map((m) => ({ ms_title: m.title, ms_date: toDateInput(m.date), ms_done: m.done }))} addLabel="Add milestone" /></div>
      </Section>

      <Section title="Amenities">
        <div className="grid grid-cols-2 gap-2 md:col-span-2 md:grid-cols-4">
          {AMENITY_OPTIONS.map((a) => <label key={a} className="flex items-center gap-2 text-sm"><input type="checkbox" name="amenities" value={a} defaultChecked={p?.amenities?.includes(a)} className="accent-[#00BF63]" />{a}</label>)}
        </div>
      </Section>

      <Section title="Plans, gallery and brochure">
        <ImageField name="master_plan" label="Master plan" initial={p?.master_plan} />
        <ImageField name="floor_plan" label="Floor plan" initial={p?.floor_plan} />
        <div className="md:col-span-2"><ImageUploader name="gallery" label="Gallery" initial={p?.gallery ?? []} withCover={false} /></div>
        <div className="md:col-span-2"><ImageField name="brochure" label="Brochure (PDF)" initial={p?.brochure} accept="application/pdf" preview={false} hint="Visitors download this from the project page." /></div>
      </Section>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
        <div className="flex flex-wrap gap-2">
          <SubmitButton name="intent" value="draft" variant="secondary">Save as draft</SubmitButton>
          <SubmitButton name="intent" value="publish">Publish</SubmitButton>
          <Link href="/admin/projects" className="self-center text-sm text-muted hover:text-ink">Cancel</Link>
        </div>
        {p && onDelete && <ConfirmButton label="Delete" confirmLabel="Delete project" action={onDelete} />}
      </div>
    </form>
  );
}
