import PageHeader from "@/components/console/PageHeader";
import BlogForm from "@/components/console/BlogForm";
import { requireUser } from "@/lib/auth";
import { blogCategories, getWriter } from "@/lib/queries/content";
import { saveMyPost } from "../actions";

export const metadata = { title: "New post" };

export default async function NewMyPostPage() {
  const user = await requireUser("employee");
  const [cats, writer] = await Promise.all([blogCategories(), getWriter(user.id)]);
  return (
    <>
      <PageHeader title="New post" description="Save a draft any time. Publishing puts it on the website's blog under your name." />
      <BlogForm categories={cats} authorDefault={user.name} action={saveMyPost.bind(null, null)} cancelHref="/employee/blog" writer={writer ?? { name: user.name, title: "Employee", photo: null }} />
    </>
  );
}
