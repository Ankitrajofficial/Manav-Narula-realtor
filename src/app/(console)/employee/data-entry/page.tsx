import { redirect } from "next/navigation";

/** Data entry is now part of Leads. Kept so old bookmarks still land in the right place. */
export default async function DataEntryPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  redirect(tab === "import" ? "/employee/leads/new?tab=import" : "/employee/leads/new");
}
