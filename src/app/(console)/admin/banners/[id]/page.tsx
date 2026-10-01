import { notFound } from "next/navigation";
import PageHeader from "@/components/console/PageHeader";
import { requireUser } from "@/lib/auth";
import { getBanner } from "@/lib/queries/content";
import BannerForm from "../BannerForm";
import { upsertBanner } from "../actions";

export default async function EditBannerPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser("admin");
  const id = Number((await params).id);
  const b = Number.isInteger(id) ? await getBanner(id) : null;
  if (!b) notFound();
  return (
    <>
      <PageHeader title="Edit banner" description={b.headline} />
      <BannerForm banner={b} group={b.group} action={upsertBanner.bind(null, id)} />
    </>
  );
}
