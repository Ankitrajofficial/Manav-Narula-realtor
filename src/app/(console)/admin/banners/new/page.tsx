import PageHeader from "@/components/console/PageHeader";
import { requireUser } from "@/lib/auth";
import BannerForm from "../BannerForm";
import { upsertBanner } from "../actions";

export default async function NewBannerPage({ searchParams }: { searchParams: Promise<{ group?: string }> }) {
  await requireUser("admin");
  const { group = "carousel" } = await searchParams;
  return (
    <>
      <PageHeader title={group === "offer" ? "Add offer banner" : "Add carousel banner"} />
      <BannerForm group={group} action={upsertBanner.bind(null, null)} />
    </>
  );
}
