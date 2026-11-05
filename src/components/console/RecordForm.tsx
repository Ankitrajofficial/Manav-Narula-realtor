"use client";
import { useActionState, useState } from "react";
import { Field, FormError, Input, Select, SubmitButton, Textarea } from "./Form";
import { BUDGETS, INTERESTS } from "@/lib/console";
import type { RecordFormState } from "@/app/(console)/records/actions";

interface Opts { localities: string[]; sources: string[]; tags: string[]; employees?: { id: number; name: string }[]; properties?: { id: number; title: string; locality: string | null }[]; projects?: { id: number; name: string; developer?: string | null }[] }
interface Props {
  kind: "lead" | "prospect";
  action: (prev: RecordFormState, fd: FormData) => Promise<RecordFormState>;
  opts: Opts;
  isAdmin: boolean;
  defaults?: Partial<Record<string, string | number | boolean | string[] | null>>;
  id?: number;
  andAnother?: boolean;
  /** Short form: name, phone, interest, locality and notes; everything else is folded under "More details". */
  simple?: boolean;
  returnTo?: string;
  cancelHref: string;
}

export default function RecordForm({ kind, action, opts, isAdmin, defaults = {}, id, andAnother, simple, returnTo, cancelHref }: Props) {
  const [state, formAction] = useActionState<RecordFormState, FormData>(action, {});
  const v = (k: string) => String(state.values?.[k] ?? defaults[k] ?? "");
  const tags = state.values ? String(state.values.tags ?? "").split(",").filter(Boolean) : ((defaults.tags as string[] | undefined) ?? []);
  const optIn = state.values ? String(state.values.whatsapp_opt_in) === "true" : (defaults.whatsapp_opt_in as boolean | undefined) ?? (kind === "lead");
  const e = state.errors ?? {};
  const nameField = <Field label="Name" htmlFor="f-name" error={e.name}><Input id="f-name" name="name" defaultValue={v("name")} error={e.name} required autoFocus /></Field>;
  const phoneField = <Field label="Phone" htmlFor="f-phone" error={e.phone} hint="10-digit mobile, saved as +91"><Input id="f-phone" name="phone" type="tel" inputMode="tel" autoComplete="off" defaultValue={v("phone")} error={e.phone} required /></Field>;
  const emailField = <Field label="Email (optional)" htmlFor="f-email" error={e.email}><Input id="f-email" name="email" type="email" defaultValue={v("email")} error={e.email} /></Field>;
  // A saved record with no interest stays that way; only a new one starts on Buy.
  const interestChoice = v("interest") || (id ? "" : "Buy");
  // Short form: one tap instead of opening a dropdown. A saved value outside the usual three is kept as a fourth choice.
  const interestButtons = (
    <fieldset>
      <legend className="mb-1 block text-xs font-medium">Interest</legend>
      <div className="flex gap-2">
        {[...INTERESTS, ...(!interestChoice || INTERESTS.includes(interestChoice as (typeof INTERESTS)[number]) ? [] : [interestChoice])].map((i) => (
          <label key={i} className="flex min-h-11 flex-1 cursor-pointer items-center justify-center rounded-brand border border-line text-sm has-[:checked]:border-accent has-[:checked]:bg-accent has-[:checked]:text-white has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent has-[:focus-visible]:ring-offset-2">
            <input type="radio" name="interest" value={i} defaultChecked={i === interestChoice} className="sr-only" />{i}
          </label>
        ))}
      </div>
    </fieldset>
  );
  const interestField = <Field label="Interest" htmlFor="f-interest"><Select id="f-interest" name="interest" defaultValue={v("interest") || "Buy"}>{INTERESTS.map((i) => <option key={i}>{i}</option>)}</Select></Field>;
  const budgetField = <Field label="Budget" htmlFor="f-budget"><Select id="f-budget" name="budget" defaultValue={v("budget")}><option value="">Not known</option>{[...(v("budget") && !BUDGETS.includes(v("budget")) ? [v("budget")] : []), ...BUDGETS].map((b) => <option key={b}>{b}</option>)}</Select></Field>;
  // A locality typed on the short form may not be in the list; keep it as an option so editing the record never blanks it.
  const localityChoices = v("locality") && !opts.localities.includes(v("locality")) ? [v("locality"), ...opts.localities] : opts.localities;
  const localityField = simple
    ? <Field label="Locality" htmlFor="f-locality"><Input id="f-locality" name="locality" defaultValue={v("locality")} placeholder="Type the area, e.g. Model Town" autoComplete="off" maxLength={120} /></Field>
    : <Field label="Locality" htmlFor="f-locality"><Select id="f-locality" name="locality" defaultValue={v("locality")}><option value="">Any</option>{localityChoices.map((l) => <option key={l}>{l}</option>)}</Select></Field>;
  const sourceField = <Field label="Source" htmlFor="f-source"><Select id="f-source" name="source" defaultValue={v("source") || (kind === "lead" ? "Walk-in" : "Data entry")}>{opts.sources.map((s) => <option key={s}>{s}</option>)}</Select></Field>;
  const assignField = isAdmin && opts.employees && (
    <Field label="Assign to" htmlFor="f-assigned"><Select id="f-assigned" name="assigned_to" defaultValue={v("assigned_to")}><option value="">Unassigned</option>{opts.employees.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</Select></Field>
  );
  const propertyField = kind === "lead" && opts.properties && (
    <Field label="Property (optional)" htmlFor="f-property"><Select id="f-property" name="property_id" defaultValue={v("property_id")}><option value="">None</option>{opts.properties.map((p) => <option key={p.id} value={p.id}>{p.title}{p.locality ? ` · ${p.locality}` : ""}</option>)}</Select></Field>
  );
  const projectField = opts.projects && <ProjectPicker key={v("project_id")} projects={opts.projects} value={v("project_id")} />;
  const tagsAndOptIn = (
  <div className="mt-4 grid gap-4 md:grid-cols-2">
    <fieldset>
      <legend className="mb-1 block text-xs font-medium">Tags</legend>
      <div className="flex flex-wrap gap-2">
        {opts.tags.map((t) => (
          <label key={t} className="inline-flex items-center gap-1.5 rounded-brand border border-line px-2.5 py-1.5 text-sm has-[:checked]:border-accent">
            <input type="checkbox" name="tags" value={t} defaultChecked={tags.includes(t)} className="accent-[#00BF63]" />{t}
          </label>
        ))}
      </div>
    </fieldset>
    <fieldset>
      <legend className="mb-1 block text-xs font-medium">WhatsApp opt-in</legend>
      <div className="flex gap-4 text-sm">
        <label className="inline-flex items-center gap-1.5"><input type="radio" name="whatsapp_opt_in" value="yes" defaultChecked={optIn} className="accent-[#00BF63]" />Yes</label>
        <label className="inline-flex items-center gap-1.5"><input type="radio" name="whatsapp_opt_in" value="no" defaultChecked={!optIn} className="accent-[#00BF63]" />No</label>
      </div>
      <p className="mt-1 text-xs text-muted">Needed before this person can receive campaign messages.</p>
    </fieldset>
  </div>
  );
  const notesField = (
  <div className="mt-4">
    <Field label="Notes" htmlFor="f-notes"><Textarea id="f-notes" name="notes" rows={3} defaultValue={v("notes")} /></Field>
  </div>
  );
  return (
    <form action={formAction} className="space-y-5">
      {id ? <input type="hidden" name="id" value={id} /> : null}
      {returnTo && <input type="hidden" name="return" value={returnTo} />}
      <FormError message={state.message} />
      <div className="rounded-brand border border-line bg-white p-5">
        <div className="grid gap-4 md:grid-cols-2">
          {nameField}
          {phoneField}
          {simple ? <>{interestButtons}{localityField}</> : <>{emailField}{interestField}{budgetField}{localityField}{sourceField}{assignField}{propertyField}{projectField}</>}
        </div>
        {!simple && tagsAndOptIn}
        {notesField}
        {simple && (
          <details open={Boolean(e.email)} className="mt-4 border-t border-line pt-4">
            <summary className="cursor-pointer py-1 text-sm text-muted hover:text-ink"><span aria-hidden="true">▸ </span>More details (optional)</summary>
            <div className="mt-3 grid gap-4 md:grid-cols-2">{emailField}{budgetField}{sourceField}{propertyField}{projectField}</div>
            {tagsAndOptIn}
          </details>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <SubmitButton className={simple ? "w-full py-3 text-base" : ""}>{id ? "Save changes" : kind === "lead" ? "Add lead" : "Save prospect"}</SubmitButton>
        {andAnother && !id && <SubmitButton variant="secondary" name="and_another" value="1" className={simple ? "w-full py-3 text-base" : ""}>Save and add another</SubmitButton>}
        <a href={cancelHref} className="px-2 text-sm text-muted hover:text-ink">Cancel</a>
      </div>
    </form>
  );
}

const OTHER = "Other";

/** Developer first (AGI Infra, Mexmon Group, ...), then one of that developer's projects. Submits project_id. */
function ProjectPicker({ projects, value }: { projects: NonNullable<Opts["projects"]>; value: string }) {
  const devOf = (p: { developer?: string | null }) => p.developer?.trim() || OTHER;
  const developers = [...new Set(projects.map(devOf))].sort((a, b) => (a === OTHER ? 1 : b === OTHER ? -1 : a.localeCompare(b)));
  const current = projects.find((p) => String(p.id) === value);
  const [dev, setDev] = useState(current ? devOf(current) : "");
  const [project, setProject] = useState(current ? value : "");
  const list = projects.filter((p) => devOf(p) === dev);
  return (
    <>
      <Field label="Developer (optional)" htmlFor="f-developer">
        <Select id="f-developer" value={dev} onChange={(e) => { setDev(e.target.value); setProject(""); }}>
          <option value="">None</option>{developers.map((d) => <option key={d}>{d}</option>)}
        </Select>
      </Field>
      <Field label="Project" htmlFor="f-project">
        <Select id="f-project" name="project_id" value={project} onChange={(e) => setProject(e.target.value)} disabled={!dev}>
          <option value="">{dev ? "Choose a project" : "Pick a developer first"}</option>{list.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </Select>
      </Field>
    </>
  );
}
