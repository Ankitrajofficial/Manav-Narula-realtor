import Link from "next/link";
import PageHeader from "@/components/console/PageHeader";
import DataTable from "@/components/console/DataTable";
import FilterBar from "@/components/console/FilterBar";
import Pill from "@/components/console/Pill";
import Icon from "@/components/Icon";
import { requireUser } from "@/lib/auth";
import { formatShortDate } from "@/lib/format";
import { blogCategories, listBlogPosts, type BlogRow } from "@/lib/queries/content";

export default async function BlogAdminPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireUser("admin");
  const sp = await searchParams;
  const [{ rows, total, page, size, sort }, cats] = await Promise.all([listBlogPosts(sp), blogCategories()]);
  return (
    <>
      <PageHeader title="Blog" description="Articles on the website. Drafts are only visible here." actions={<Link href="/admin/blog/new" className="inline-flex items-center gap-1.5 rounded-brand bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-ink"><Icon name="plus" size={16} />New post</Link>} />
      <FilterBar searchPlaceholder="Search title or author" filters={[
        { key: "category", label: "Category", options: cats.map((c) => ({ value: c, label: c })) },
        { key: "status", label: "Status", options: [{ value: "Draft", label: "Draft" }, { value: "Published", label: "Published" }] },
      ]} />
      <DataTable<BlogRow>
        rows={rows} total={total} page={page} pageSize={size} sp={sp} basePath="/admin/blog" sortKey={sort.key} sortDir={sort.dir} rowId={(r) => r.id}
        empty={{ text: "No posts yet.", action: { label: "Write the first post", href: "/admin/blog/new" } }}
        columns={[
          { key: "title", label: "Title", sortable: true, render: (r) => <Link href={`/admin/blog/${r.id}`} className="font-medium hover:text-accent-ink">{r.title}</Link> },
          { key: "category", label: "Category", sortable: true },
          { key: "author", label: "Author", sortable: true },
          { key: "status", label: "Status", sortable: true, render: (r) => <Pill value={r.status} /> },
          { key: "published_at", label: "Published", sortable: true, className: "whitespace-nowrap text-muted", render: (r) => formatShortDate(r.published_at) || "—" },
          { key: "updated_at", label: "Updated", sortable: true, className: "whitespace-nowrap text-muted", render: (r) => formatShortDate(r.updated_at) },
        ]}
      />
    </>
  );
}
