import PageHeader from "@/components/console/PageHeader";
import GrowthPanel from "@/components/console/GrowthPanel";
import { requireUser } from "@/lib/auth";
import { myBatch, runAutoAssign } from "@/lib/auto-assign";
import { getGrowth, listCertificates, listStarAwards } from "@/lib/queries/growth";

export const metadata = { title: "My Stars" };

export default async function MyGrowthPage() {
  const user = await requireUser("employee");
  await runAutoAssign();
  const [g, awards, batch, certificates] = await Promise.all([getGrowth(user.id), listStarAwards(user.id), myBatch(user.id), listCertificates(user.id)]);
  if (!g) return null;
  return (
    <>
      <PageHeader title="My Stars" description="Every approved sale counts towards your next star. Five stars puts you up for promotion to Executive." />
      <GrowthPanel g={g} awards={awards} batch={batch} certificates={certificates.filter((c) => !c.revoked)} leadBase="/employee" />
    </>
  );
}
