import Link from "next/link";
import PageHeader from "@/components/console/PageHeader";
import Icon from "@/components/Icon";
import { requireUser } from "@/lib/auth";
import { q } from "@/lib/db";
import { BanksManager, VideosManager, type BankItem, type VideoItem } from "./HomeLoansManager";
import ContentThumb from "@/components/console/ContentThumb";
import ToggleForm from "@/components/console/ToggleForm";
import ConfirmButton from "@/components/console/ConfirmButton";
import EmptyState from "@/components/console/EmptyState";
import { listOffers } from "@/lib/queries/content";
import { deleteOffer, toggleOfferActive } from "../offers/actions";

export default async function HomeLoansAdminPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  await requireUser("admin");
  const t = (await searchParams).tab;
  const tab = t === "videos" ? "videos" : t === "offers" ? "offers" : "banks";
  const [offers, banks, videos] = await Promise.all([
    listOffers("home_loan"),
    q<BankItem>("SELECT id, name, tagline, logo_url, is_active FROM partner_banks ORDER BY sort_order, id"),
    q<VideoItem>("SELECT id, youtube_id, title, is_active FROM page_videos WHERE page_key = 'home_loans' ORDER BY sort_order, id"),
  ]);
  const tabs = [{ key: "banks", label: "Partner banks", n: banks.length }, { key: "offers", label: "Home loan offers", n: offers.length }, { key: "videos", label: "Videos", n: videos.length }];
  return (
    <div className="max-w-4xl">
      <PageHeader title="Home Loans" description="Partner banks, home loan offers and videos shown on the public /home-loans page. Drag rows or use the arrows to set the order." actions={
        <Link href="/home-loans" target="_blank" className="inline-flex items-center gap-1.5 rounded-brand border border-line bg-white px-3 py-2 text-sm hover:border-ink"><Icon name="eye" size={14} />View page</Link>
      } />
      <nav className="mb-5 flex gap-1 border-b border-line" aria-label="Home loans sections">
        {tabs.map((t) => (
          <Link key={t.key} href={t.key === "banks" ? "/admin/home-loans" : `/admin/home-loans?tab=${t.key}`} aria-current={tab === t.key ? "page" : undefined}
            className={`-mb-px border-b-2 px-3 py-2 text-sm ${tab === t.key ? "border-accent text-accent-ink" : "border-transparent text-muted hover:text-ink"}`}>
            {t.label} <span className="tabular text-muted">({t.n})</span>
          </Link>
        ))}
      </nav>
      {tab === "offers" ? (
        <>
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-sm text-muted">Shown on the Home Loans page only. Property offers are under Offers.</p>
            <Link href="/admin/offers/new?section=home_loan" className="inline-flex shrink-0 items-center gap-1.5 rounded-brand bg-accent px-3 py-2 text-sm font-medium text-white hover:bg-accent-ink"><Icon name="plus" size={14} />Add loan offer</Link>
          </div>
          {offers.length === 0 ? <EmptyState text="No home loan offers yet." action={{ label: "Add loan offer", href: "/admin/offers/new?section=home_loan" }} /> : (
            <ul className="space-y-2">
              {offers.map((o) => (
                <li key={o.id} className="flex items-center gap-4 rounded-brand border border-line bg-white p-3">
                  <ContentThumb src={o.image} className="h-14 w-24 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <Link href={`/admin/offers/${o.id}`} className="block truncate font-medium hover:text-accent-ink">{o.title}</Link>
                    <p className="truncate text-xs text-muted">{o.text}</p>
                  </div>
                  <span className="text-xs text-muted">{o.active ? "Live" : "Off"}</span>
                  <ToggleForm on={o.active} label={o.active ? "Deactivate" : "Activate"} action={toggleOfferActive.bind(null, o.id, !o.active)} />
                  <Link href={`/admin/offers/${o.id}`} className="rounded-brand border border-line px-3 py-1.5 text-sm hover:border-ink">Edit</Link>
                  <form><ConfirmButton label="Delete" action={deleteOffer.bind(null, o.id)} /></form>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : tab === "banks" ? (
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
