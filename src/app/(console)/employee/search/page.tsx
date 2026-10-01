import Link from "next/link";
import PageHeader from "@/components/console/PageHeader";
import EmptyState from "@/components/console/EmptyState";
import { requireUser } from "@/lib/auth";
import { globalSearch } from "@/lib/queries/common";

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const user = await requireUser("employee");
  const { q = "" } = await searchParams;
  const hits = await globalSearch(q, user.id, user.role);
  return (
    <>
      <PageHeader title={q ? `Results for "${q}"` : "Search"} description="Leads, prospects, properties and projects by name or phone." />
      {hits.length === 0 ? <EmptyState text={q ? "Nothing matches." : "Type a name or phone number in the search box above."} /> : (
        <ul className="divide-y divide-line rounded-brand border border-line bg-white">
          {hits.map((h) => (
            <li key={`${h.kind}-${h.id}`}>
              <Link href={h.href} className="flex items-center justify-between px-4 py-3 hover:bg-bg">
                <span><span className="mr-3 inline-block w-16 text-xs uppercase tracking-wide text-muted">{h.kind}</span>{h.title}</span>
                <span className="text-sm text-muted">{h.detail}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
