import Link from "next/link";
import PageHeader from "@/components/console/PageHeader";
import Icon from "@/components/Icon";
import { requireUser } from "@/lib/auth";
import { q } from "@/lib/db";
import { BanksManager, VideosManager, type BankItem, type VideoItem } from "./HomeLoansManager";

export default async function HomeLoansAdminPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  await requireUser("admin");
  const tab = (await searchParams).tab === "videos" ? "videos" : "banks";
  const [banks, videos] = await Promise.all([
    q<BankItem>("SELECT id, name, tagline, logo_url, is_active FROM partner_banks ORDER BY sort_order, id"),
    q<VideoItem>("SELECT id, youtube_id, title, is_active FROM page_videos WHERE page_key = 'home_loans' ORDER BY sort_order, id"),
  ]);
  const tabs = [{ key: "banks", label: "Partner banks", n: banks.length }, { key: "videos", label: "Videos", n: videos.length }];
  return (
    <div className="max-w-4xl">
      <PageHeader title="Home Loans" description="Partner banks and videos shown on the public /home-loans page. Drag rows or use the arrows to set the order." actions={
        <Link href="/home-loans" target="_blank" className="inline-flex items-center gap-1.5 rounded-brand border border-line bg-white px-3 py-2 text-sm hover:border-ink"><Icon name="eye" size={14} />View page</Link>
      } />
      <nav className="mb-5 flex gap-1 border-b border-line" aria-label="Home loans sections">
        {tabs.map((t) => (
          <Link key={t.key} href={t.key === "banks" ? "/admin/home-loans" : "/admin/home-loans?tab=videos"} aria-current={tab === t.key ? "page" : undefined}
            className={`-mb-px border-b-2 px-3 py-2 text-sm ${tab === t.key ? "border-accent text-accent-ink" : "border-transparent text-muted hover:text-ink"}`}>
            {t.label} <span className="tabular text-muted">({t.n})</span>
          </Link>
        ))}
      </nav>
      {tab === "banks" ? (
        <>
          <p className="mb-3 text-sm text-muted">Up to five are shown in one row on desktop; more wrap onto the next row.</p>
          <BanksManager banks={banks} />
        </>
      ) : (
        <>
          <p className="mb-3 text-sm text-muted">The first active video is shown large, the next three below it. The player loads only when a visitor clicks play.</p>
          <VideosManager videos={videos} />
        </>
      )}
    </div>
  );
}
