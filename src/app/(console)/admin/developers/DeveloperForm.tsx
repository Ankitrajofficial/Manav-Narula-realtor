"use client";
import Link from "next/link";
import { useActionState } from "react";
import { Field, FormError, Input, Section, SubmitButton, Textarea } from "@/components/console/Form";
import type { DeveloperRow } from "@/lib/queries/content";
import type { DeveloperFormState } from "./actions";

export default function DeveloperForm({ developer: d, action }: { developer?: DeveloperRow | null; action: (prev: DeveloperFormState, fd: FormData) => Promise<DeveloperFormState> }) {
  const [state, act] = useActionState<DeveloperFormState, FormData>(action, {});
  const e = state.errors ?? {};
  return (
    <form action={act} className="space-y-5">
      <FormError message={state.message} />
      <Section title="Developer">
        <Field label="Name" htmlFor="name" error={e.name}><Input id="name" name="name" defaultValue={d?.name} required /></Field>
        <Field label="Page address" htmlFor="slug" error={e.slug} hint={`/developers/${d?.slug ?? "<made from the name>"}`}><Input id="slug" name="slug" defaultValue={d?.slug ?? ""} /></Field>
        <Field label="Website" htmlFor="website" error={e.website} hint="For our reference; it is not linked from our website."><Input id="website" name="website" defaultValue={d?.website ?? ""} placeholder="https://example.com" /></Field>
        <label className="flex items-start gap-2 self-end text-sm">
          <input type="checkbox" name="logo_permission" defaultChecked={d?.logo_permission} className="mt-0.5 accent-[#00BF63]" />
          <span>Written permission to use their logo<span className="block text-xs text-muted">The website never shows a developer&apos;s logo without it.</span></span>
        </label>
        <Field label="Description" htmlFor="description" hint="Our own words, shown on the developer page." className="md:col-span-2"><Textarea id="description" name="description" rows={3} defaultValue={d?.description ?? ""} /></Field>
      </Section>
      <div className="flex gap-2 border-t border-line pt-4">
        <SubmitButton>Save developer</SubmitButton>
        <Link href="/admin/developers" className="self-center text-sm text-muted hover:text-ink">Cancel</Link>
      </div>
    </form>
  );
}
