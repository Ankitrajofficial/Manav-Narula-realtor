import Link from "next/link";
import { notFound } from "next/navigation";
import PageHeader from "@/components/console/PageHeader";
import Pill from "@/components/console/Pill";
import BlogForm from "@/components/console/BlogForm";
import { requireUser } from "@/lib/auth";
import { blogCategories, getBlogPost, getWriter } from "@/lib/queries/content";
import { deleteMyPost, saveMyPost } from "../actions";

export default async function EditMyPostPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser("employee");
  const id = Number((await params).id);
  const [p, cats, writer] = await Promise.all([Number.isInteger(id) ? getBlogPost(id) : null, blogCategories(), getWriter(user.id)]);
  if (!p || p.author_id !== user.id) notFound();
  return (
    <>
      <PageHeader title={p.title} description={`/blog/${p.slug}`} actions={<><Pill value={p.status} />{p.status === "Published" && <Link href={`/blog/${p.slug}`} target="_blank" className="rounded-brand border border-line bg-white px-3 py-1.5 text-sm hover:border-ink">View on website</Link>}</>} />
      <BlogForm post={p} categories={cats} authorDefault={user.name} action={saveMyPost.bind(null, id)} onDelete={deleteMyPost.bind(null, id)} cancelHref="/employee/blog" writer={writer ?? { name: user.name, title: "Employee", photo: null }} />
    </>
  );
}
