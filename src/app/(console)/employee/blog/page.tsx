import Link from "next/link";
import PageHeader from "@/components/console/PageHeader";
import Pill from "@/components/console/Pill";
import ImageField from "@/components/console/ImageField";
import Icon from "@/components/Icon";
import { requireUser } from "@/lib/auth";
import { formatShortDate } from "@/lib/format";
import { getWriter, listMyPosts } from "@/lib/queries/content";
import { updateMyPhoto } from "./actions";

export const metadata = { title: "My Blog" };

export default async function MyBlogPage() {
  const user = await requireUser("employee");
  const [writer, posts] = await Promise.all([getWriter(user.id), listMyPosts(user.id)]);
  return (
    <>
      <PageHeader title="My Blog" description="Write articles for the website's blog. Published posts show your name, designation and photo. The admin can edit or remove any post."
        actions={<Link href="/employee/blog/new" className="inline-flex items-center gap-1.5 rounded-brand bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-ink"><Icon name="plus" size={16} />New post</Link>} />
      <div className="grid gap-5 lg:grid-cols-12">
        <section className="lg:col-span-8">
          {posts.length === 0 ? (
            <div className="rounded-brand border border-dashed border-line bg-white p-10 text-center">
              <p className="text-sm text-muted">You have not written a post yet.</p>
              <Link href="/employee/blog/new" className="mt-4 inline-flex rounded-brand bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-ink">Write your first post</Link>
            </div>
          ) : (
            <ul className="divide-y divide-line rounded-brand border border-line bg-white">
              {posts.map((p) => (
                <li key={p.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 text-sm">
                  <Link href={`/employee/blog/${p.id}`} className="min-w-0 flex-1 basis-60 font-medium hover:text-accent-ink">{p.title}<span className="block text-xs font-normal text-muted">{p.category ?? "No category"} · updated {formatShortDate(p.updated_at)}</span></Link>
                  <Pill value={p.status} />
                  {p.status === "Published" && <Link href={`/blog/${p.slug}`} target="_blank" className="text-xs text-accent-ink hover:underline">View on website</Link>}
                </li>
              ))}
            </ul>
          )}
        </section>
        <form action={updateMyPhoto} className="h-fit rounded-brand border border-line bg-white p-5 lg:col-span-4">
          <h2 className="text-base">Your author card</h2>
          <div className="mt-3 flex items-center gap-4">
            {writer?.photo ? (
              // eslint-disable-next-line @next/next/no-img-element -- uploaded file served from /media
              <img src={writer.photo} alt="" className="h-[92px] w-[72px] rounded-brand border border-line object-cover" />
            ) : <span className="flex h-[92px] w-[72px] items-center justify-center rounded-brand border border-dashed border-line text-center text-[11px] text-muted">No photo</span>}
            <div><p className="text-sm">{writer?.name}</p><p className="text-xs text-muted">{writer?.title}</p></div>
          </div>
          <div className="mt-4"><ImageField name="author_photo" label={writer?.photo ? "Upload a new photo" : "Passport-size photo"} hint="Professional head-and-shoulders photo on a plain background. Needed before you publish." /></div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button type="submit" className="rounded-brand border border-line bg-white px-4 py-2 text-sm hover:border-ink">Save photo</button>
            {writer?.photo && <button type="submit" name="author_photo_clear" value="1" className="text-sm text-red-700 hover:underline">Remove photo</button>}
          </div>
        </form>
      </div>
    </>
  );
}
