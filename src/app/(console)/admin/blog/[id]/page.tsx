import Link from "next/link";
import { notFound } from "next/navigation";
import PageHeader from "@/components/console/PageHeader";
import Pill from "@/components/console/Pill";
import { requireUser } from "@/lib/auth";
import { blogCategories, getBlogPost } from "@/lib/queries/content";
import BlogForm from "../BlogForm";
import { deletePost, upsertPost } from "../actions";

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser("admin");
  const id = Number((await params).id);
  const [p, cats] = await Promise.all([Number.isInteger(id) ? getBlogPost(id) : null, blogCategories()]);
  if (!p) notFound();
  return (
    <>
      <PageHeader title={p.title} description={`/blog/${p.slug}`} actions={<><Pill value={p.status} />{p.status === "Published" && <Link href={`/blog/${p.slug}`} target="_blank" className="rounded-brand border border-line bg-white px-3 py-1.5 text-sm hover:border-ink">View on website</Link>}</>} />
      <BlogForm post={p} categories={cats} authorDefault={user.name} action={upsertPost.bind(null, id)} onDelete={deletePost.bind(null, id)} />
    </>
  );
}
