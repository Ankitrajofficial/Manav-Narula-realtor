import PageHeader from "@/components/console/PageHeader";
import { requireUser } from "@/lib/auth";
import { blogCategories } from "@/lib/queries/content";
import BlogForm from "../BlogForm";
import { upsertPost } from "../actions";

export default async function NewPostPage() {
  const user = await requireUser("admin");
  const cats = await blogCategories();
  return (<><PageHeader title="New post" /><BlogForm categories={cats} authorDefault={user.name} action={upsertPost.bind(null, null)} /></>);
}
