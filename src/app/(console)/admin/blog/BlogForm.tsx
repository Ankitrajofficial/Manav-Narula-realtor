"use client";
import Link from "next/link";
import { useActionState, useState } from "react";
import { Field, FormError, Input, Section, SubmitButton, Textarea } from "@/components/console/Form";
import ImageField from "@/components/console/ImageField";
import MarkdownEditor from "@/components/console/MarkdownEditor";
import ConfirmButton from "@/components/console/ConfirmButton";
import type { BlogRow } from "@/lib/queries/content";
import type { BlogFormState } from "./actions";

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);

export default function BlogForm({ post: p, categories, authorDefault, action, onDelete }: { post?: BlogRow | null; categories: string[]; authorDefault: string; action: (prev: BlogFormState, fd: FormData) => Promise<BlogFormState>; onDelete?: () => Promise<void> }) {
  const [state, act] = useActionState<BlogFormState, FormData>(action, {});
  const e = state.errors ?? {};
  const [title, setTitle] = useState(p?.title ?? "");
  const [slug, setSlug] = useState(p?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(!!p);
  return (
    <form action={act} className="space-y-5">
      <FormError message={state.message} />
      <Section title="Article">
        <Field label="Title" htmlFor="title" error={e.title} className="md:col-span-2"><Input id="title" name="title" value={title} onChange={(ev) => { setTitle(ev.target.value); if (!slugTouched) setSlug(slugify(ev.target.value)); }} maxLength={140} /></Field>
        <Field label="Slug" htmlFor="slug" hint={`/blog/${slug || "…"}`}><Input id="slug" name="slug" value={slug} onChange={(ev) => { setSlugTouched(true); setSlug(ev.target.value); }} /></Field>
        <Field label="Category" htmlFor="category"><Input id="category" name="category" list="blog-categories" defaultValue={p?.category ?? ""} placeholder="Market, Legal, NRI…" /><datalist id="blog-categories">{categories.map((c) => <option key={c} value={c} />)}</datalist></Field>
        <Field label="Author" htmlFor="author"><Input id="author" name="author" defaultValue={p?.author ?? authorDefault} /></Field>
        <div><ImageField name="cover" label="Cover image" initial={p?.cover} hint="4:3, at least 1200 x 900 px." />{e.cover && <p className="mt-1 text-xs text-red-700">{e.cover}</p>}</div>
        <Field label="Excerpt" htmlFor="excerpt" hint="Shown on cards and in search results." className="md:col-span-2"><Textarea id="excerpt" name="excerpt" rows={2} maxLength={220} defaultValue={p?.excerpt ?? ""} /></Field>
      </Section>
      <section className="rounded-brand border border-line bg-white p-5">
        <MarkdownEditor name="body" initial={p?.body ?? ""} error={e.body} />
      </section>
      <Section title="SEO">
        <Field label="Meta title" htmlFor="meta_title"><Input id="meta_title" name="meta_title" maxLength={70} defaultValue={p?.meta_title ?? ""} /></Field>
        <Field label="Meta description" htmlFor="meta_description"><Textarea id="meta_description" name="meta_description" rows={2} maxLength={160} defaultValue={p?.meta_description ?? ""} /></Field>
      </Section>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
        <div className="flex flex-wrap gap-2">
          <SubmitButton name="intent" value="draft" variant="secondary">Save draft</SubmitButton>
          {p?.status === "Published" ? <SubmitButton name="intent" value="unpublish" variant="secondary">Unpublish</SubmitButton> : null}
          <SubmitButton name="intent" value="publish">{p?.status === "Published" ? "Update and keep published" : "Publish"}</SubmitButton>
          <Link href="/admin/blog" className="self-center text-sm text-muted hover:text-ink">Cancel</Link>
        </div>
        {p && onDelete && <ConfirmButton label="Delete" confirmLabel="Delete post" action={onDelete} />}
      </div>
    </form>
  );
}
