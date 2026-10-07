"use client";
import Link from "next/link";
import { useActionState } from "react";
import { Field, FormError, Input, Section, SubmitButton, Textarea } from "@/components/console/Form";
import ImageField from "@/components/console/ImageField";
import ConfirmButton from "@/components/console/ConfirmButton";
import type { TeamMember } from "@/lib/queries/team";
import type { TeamFormState } from "./actions";

export default function TeamForm({ member: m, action, onDelete }: { member?: TeamMember | null; action: (p: TeamFormState, fd: FormData) => Promise<TeamFormState>; onDelete?: () => Promise<void> }) {
  const [state, act] = useActionState<TeamFormState, FormData>(action, {});
  const e = state.errors ?? {};
  return (
    <form action={act} className="max-w-3xl space-y-5">
      <FormError message={state.message} />
      <Section title="Team member" description="Shown in &quot;The team&quot; on the About page.">
        <Field label="Name" htmlFor="name" error={e.name}><Input id="name" name="name" defaultValue={m?.name} required maxLength={80} /></Field>
        <Field label="Role" htmlFor="role" hint="e.g. Sales advisor, plots and kothis"><Input id="role" name="role" defaultValue={m?.role ?? ""} maxLength={80} /></Field>
        <Field label="Short bio" htmlFor="bio" hint="One or two lines, up to 300 characters." className="md:col-span-2"><Textarea id="bio" name="bio" rows={3} defaultValue={m?.bio ?? ""} maxLength={300} /></Field>
        <div className="md:col-span-2">
          <ImageField name="photo" label="Photo" initial={m?.photo} hint="A clear portrait, best 800 × 1000 px (4:5). JPG, PNG or WebP. Without a photo, the initials are shown." />
          {e.photo && <p className="mt-1 text-xs text-red-700">{e.photo}</p>}
        </div>
        <label className="flex items-center gap-2 text-sm md:col-span-2"><input type="checkbox" name="active" defaultChecked={m ? m.active : true} className="accent-[#00BF63]" />Show on the About page</label>
      </Section>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
        <div className="flex gap-2"><SubmitButton>Save</SubmitButton><Link href="/admin/team" className="self-center text-sm text-muted hover:text-ink">Cancel</Link></div>
        {m && onDelete && <ConfirmButton label="Delete" confirmLabel="Delete member" action={onDelete} />}
      </div>
    </form>
  );
}
