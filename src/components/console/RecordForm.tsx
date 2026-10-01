"use client";
import { useActionState } from "react";
import { Field, FormError, Input, Select, SubmitButton, Textarea } from "./Form";
import { BUDGETS, INTERESTS } from "@/lib/console";
import type { RecordFormState } from "@/app/(console)/records/actions";

interface Opts { localities: string[]; sources: string[]; tags: string[]; employees?: { id: number; name: string }[]; properties?: { id: number; title: string; locality: string | null }[]; projects?: { id: number; name: string }[] }
interface Props {
  kind: "lead" | "prospect";
  action: (prev: RecordFormState, fd: FormData) => Promise<RecordFormState>;
  opts: Opts;
  isAdmin: boolean;
  defaults?: Partial<Record<string, string | number | boolean | string[] | null>>;
  id?: number;
  andAnother?: boolean;
  returnTo?: string;
  cancelHref: string;
}

export default function RecordForm({ kind, action, opts, isAdmin, defaults = {}, id, andAnother, returnTo, cancelHref }: Props) {
  const [state, formAction] = useActionState<RecordFormState, FormData>(action, {});
  const v = (k: string) => String(state.values?.[k] ?? defaults[k] ?? "");
  const tags = state.values ? String(state.values.tags ?? "").split(",").filter(Boolean) : ((defaults.tags as string[] | undefined) ?? []);
  const optIn = state.values ? state.values.whatsapp_opt_in === "true" : (defaults.whatsapp_opt_in as boolean | undefined) ?? (kind === "lead");
  const e = state.errors ?? {};
  return (
    <form action={formAction} className="space-y-5">
      {id ? <input type="hidden" name="id" value={id} /> : null}
      {returnTo && <input type="hidden" name="return" value={returnTo} />}
      <FormError message={state.message} />
      <div className="rounded-brand border border-line bg-white p-5">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Name" htmlFor="f-name" error={e.name}><Input id="f-name" name="name" defaultValue={v("name")} error={e.name} required autoFocus /></Field>
          <Field label="Phone" htmlFor="f-phone" error={e.phone} hint="10-digit mobile, saved as +91"><Input id="f-phone" name="phone" inputMode="tel" defaultValue={v("phone")} error={e.phone} required /></Field>
          <Field label="Email (optional)" htmlFor="f-email" error={e.email}><Input id="f-email" name="email" type="email" defaultValue={v("email")} error={e.email} /></Field>
          <Field label="Interest" htmlFor="f-interest"><Select id="f-interest" name="interest" defaultValue={v("interest") || "Buy"}>{INTERESTS.map((i) => <option key={i}>{i}</option>)}</Select></Field>
          <Field label="Budget" htmlFor="f-budget"><Select id="f-budget" name="budget" defaultValue={v("budget")}><option value="">Not known</option>{BUDGETS.map((b) => <option key={b}>{b}</option>)}</Select></Field>
          <Field label="Locality" htmlFor="f-locality"><Select id="f-locality" name="locality" defaultValue={v("locality")}><option value="">Any</option>{opts.localities.map((l) => <option key={l}>{l}</option>)}</Select></Field>
          <Field label="Source" htmlFor="f-source"><Select id="f-source" name="source" defaultValue={v("source") || (kind === "lead" ? "Walk-in" : "Data entry")}>{opts.sources.map((s) => <option key={s}>{s}</option>)}</Select></Field>
          {isAdmin && opts.employees && (
            <Field label="Assign to" htmlFor="f-assigned"><Select id="f-assigned" name="assigned_to" defaultValue={v("assigned_to")}><option value="">Unassigned</option>{opts.employees.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</Select></Field>
          )}
          {kind === "lead" && opts.properties && (
            <Field label="Property (optional)" htmlFor="f-property"><Select id="f-property" name="property_id" defaultValue={v("property_id")}><option value="">None</option>{opts.properties.map((p) => <option key={p.id} value={p.id}>{p.title}{p.locality ? ` · ${p.locality}` : ""}</option>)}</Select></Field>
          )}
          {kind === "lead" && opts.projects && (
            <Field label="Project (optional)" htmlFor="f-project"><Select id="f-project" name="project_id" defaultValue={v("project_id")}><option value="">None</option>{opts.projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</Select></Field>
          )}
        </div>
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
        <div className="mt-4">
          <Field label="Notes" htmlFor="f-notes"><Textarea id="f-notes" name="notes" rows={3} defaultValue={v("notes")} /></Field>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <SubmitButton>{id ? "Save changes" : kind === "lead" ? "Add lead" : "Save prospect"}</SubmitButton>
        {andAnother && !id && <SubmitButton variant="secondary" name="and_another" value="1">Save and add another</SubmitButton>}
        <a href={cancelHref} className="px-2 text-sm text-muted hover:text-ink">Cancel</a>
      </div>
    </form>
  );
}
