"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser, type SessionUser } from "@/lib/auth";
import { one, q } from "@/lib/db";
import { audit, slugify } from "@/lib/records";
import { saveUpload } from "@/lib/upload";
import { getBlogPost, saveBlogPost, uniqueSlug, type BlogInput } from "@/lib/queries/content";
import type { BlogFormState } from "@/components/console/BlogForm";

const s = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const opt = (v: string) => (v ? v : null);
const IMAGE = /\.(png|jpe?g|webp)$/i;

/** A staff writer may change only their own posts. */
async function ownPost(user: SessionUser, id: number) {
  const post = await getBlogPost(id);
  if (!post || post.author_id !== user.id) redirect("/employee/blog?error=Post+not+found");
  return post;
}

/** Applies the passport-photo field from the form to the writer's account; returns the photo now on file. */
async function savePhoto(user: SessionUser, fd: FormData, errors: Record<string, string>): Promise<string | null> {
  const current = (await one<{ photo: string | null }>("SELECT photo FROM users WHERE id = $1", [user.id]))?.photo ?? null;
  let photo = fd.get("author_photo_clear") ? null : opt(s(fd, "author_photo_current")) ?? current;
  try {
    const f = fd.get("author_photo");
    if (f instanceof File && f.size > 0) {
      if (!f.type.startsWith("image/")) throw new Error("Use a JPG, PNG or WebP photo.");
      photo = await saveUpload(f, "people");
    }
  } catch (e) { errors.author_photo = e instanceof Error ? e.message : "Upload failed."; return current; }
  if (photo && !IMAGE.test(photo)) { errors.author_photo = "Use a JPG, PNG or WebP photo."; return current; }
  if (photo !== current) await q("UPDATE users SET photo = $1 WHERE id = $2", [photo, user.id]);
  return photo;
}

export async function saveMyPost(id: number | null, _p: BlogFormState, fd: FormData): Promise<BlogFormState> {
  const user = await requireUser("employee");
  const existing = id ? await ownPost(user, id) : null;
  const errors: Record<string, string> = {};
  const title = s(fd, "title"); if (title.length < 5) errors.title = "Enter a title of at least 5 characters.";
  const body = s(fd, "body");
  const intent = s(fd, "intent");
  const status = intent === "publish" ? "Published" : intent === "unpublish" ? "Draft" : existing?.status ?? "Draft";
  if (status === "Published" && body.length < 50) errors.body = "Write at least a few sentences before publishing.";
  let cover: string | null = null;
  try { const f = fd.get("cover"); cover = f instanceof File && f.size > 0 ? await saveUpload(f, "blog") : opt(s(fd, "cover_current")); } catch (e) { errors.cover = e instanceof Error ? e.message : "Upload failed."; }
  const photo = await savePhoto(user, fd, errors);
  if (status === "Published" && !photo && !errors.author_photo) errors.author_photo = "Add your passport-size photo before publishing. You can save a draft without it.";
  if (Object.keys(errors).length) return { errors, message: "Fix the highlighted fields.", values: Object.fromEntries(["category", "author", "excerpt", "meta_title", "meta_description"].map((k) => [k, s(fd, k)])) };
  const slug = await uniqueSlug("blog_posts", slugify(s(fd, "slug") || title), id);
  const input: BlogInput = { slug, title, category: opt(s(fd, "category")), author: user.name, cover, excerpt: opt(s(fd, "excerpt")), body, meta_title: opt(s(fd, "meta_title")), meta_description: opt(s(fd, "meta_description")), status, author_id: user.id };
  const newId = await saveBlogPost(id, input);
  await audit(user.id, id ? (intent === "publish" ? "publish" : intent === "unpublish" ? "unpublish" : "update") : "create", "blog_post", newId, { title, status, by: "staff" });
  revalidatePath("/", "layout");
  redirect(`/employee/blog/${newId}?toast=${encodeURIComponent(status === "Published" ? "Post published on the website" : intent === "unpublish" ? "Post taken off the website" : "Draft saved")}`);
}

export async function deleteMyPost(id: number) {
  const user = await requireUser("employee");
  const post = await ownPost(user, id);
  await q("DELETE FROM blog_posts WHERE id = $1 AND author_id = $2", [id, user.id]);
  await audit(user.id, "delete", "blog_post", id, { title: post.title, by: "staff" });
  revalidatePath("/", "layout");
  redirect("/employee/blog?toast=Post+deleted");
}

/** Changes only the passport photo, from the My Blog page. */
export async function updateMyPhoto(fd: FormData) {
  const user = await requireUser("employee");
  const errors: Record<string, string> = {};
  const photo = await savePhoto(user, fd, errors);
  revalidatePath("/", "layout");
  if (errors.author_photo) redirect(`/employee/blog?error=${encodeURIComponent(errors.author_photo)}`);
  redirect(`/employee/blog?toast=${photo ? "Photo+saved" : "Photo+removed"}`);
}
