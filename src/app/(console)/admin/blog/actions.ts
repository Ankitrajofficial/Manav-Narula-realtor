"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { q } from "@/lib/db";
import { audit, slugify } from "@/lib/records";
import { saveUpload } from "@/lib/upload";
import { getBlogPost, saveBlogPost, uniqueSlug, type BlogInput } from "@/lib/queries/content";

export interface BlogFormState { errors?: Record<string, string>; message?: string }
const s = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const opt = (v: string) => (v ? v : null);

export async function upsertPost(id: number | null, _p: BlogFormState, fd: FormData): Promise<BlogFormState> {
  const user = await requireUser("admin");
  const errors: Record<string, string> = {};
  const title = s(fd, "title"); if (title.length < 5) errors.title = "Enter a title of at least 5 characters.";
  const body = s(fd, "body");
  const intent = s(fd, "intent");
  const status = intent === "publish" ? "Published" : intent === "unpublish" ? "Draft" : id ? (await getBlogPost(id))?.status ?? "Draft" : "Draft";
  if (status === "Published" && body.length < 50) errors.body = "Write at least a few sentences before publishing.";
  let cover: string | null = null;
  try { const f = fd.get("cover"); cover = f instanceof File && f.size > 0 ? await saveUpload(f, "blog") : opt(s(fd, "cover_current")); } catch (e) { errors.cover = e instanceof Error ? e.message : "Upload failed."; }
  if (Object.keys(errors).length) return { errors, message: "Fix the highlighted fields." };
  const slug = await uniqueSlug("blog_posts", slugify(s(fd, "slug") || title), id);
  const input: BlogInput = { slug, title, category: opt(s(fd, "category")), author: opt(s(fd, "author")) ?? user.name, cover, excerpt: opt(s(fd, "excerpt")), body, meta_title: opt(s(fd, "meta_title")), meta_description: opt(s(fd, "meta_description")), status };
  const newId = await saveBlogPost(id, input);
  await audit(user.id, id ? (intent === "publish" ? "publish" : intent === "unpublish" ? "unpublish" : "update") : "create", "blog_post", newId, { title, status });
  revalidatePath("/", "layout");
  redirect(`/admin/blog/${newId}?toast=${encodeURIComponent(status === "Published" ? "Post published" : "Draft saved")}`);
}

export async function deletePost(id: number) {
  const user = await requireUser("admin");
  await q("DELETE FROM blog_posts WHERE id = $1", [id]);
  await audit(user.id, "delete", "blog_post", id);
  revalidatePath("/", "layout");
  redirect("/admin/blog?toast=Post+deleted");
}
