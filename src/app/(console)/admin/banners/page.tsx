import Link from "next/link";
import PageHeader from "@/components/console/PageHeader";
import BannerPreview from "@/components/console/BannerPreview";
import Icon from "@/components/Icon";
import { requireUser } from "@/lib/auth";
import { listBanners, toDateInput } from "@/lib/queries/content";
import BannerCards, { type BannerCard } from "./BannerCards";
import { deleteBanner, moveBanner, reorderBannerGroup, toggleBannerActive } from "./actions";

function scheduleState(active: boolean, start: string, end: string): BannerCard["scheduleState"] {
  if (!active) return "Inactive";
  const today = toDateInput(new Date());
  if (start && start > today) return "Scheduled";
  if (end && end < today) return "Expired";
  return "Live";
}

export default async function BannersPage() {
  await requireUser("admin");
  const all = await listBanners();
  const toCard = (b: (typeof all)[number]): BannerCard => { const start = toDateInput(b.start_date), end = toDateInput(b.end_date); return { id: b.id, image: b.image, headline: b.headline, line: b.line, cta_label: b.cta_label, cta_href: b.cta_href, active: b.active, start, end, scheduleState: scheduleState(b.active, start, end) }; };
  const carousel = all.filter((b) => b.group === "carousel").map(toCard);
  const offer = all.filter((b) => b.group === "offer").map(toCard);
  const live = (xs: BannerCard[]) => xs.filter((b) => b.scheduleState === "Live");
  return (
    <>
      <PageHeader title="Banners" description="Home page carousel and the offer strip. Order here is the order on the website; only Live banners are shown." />
      <section className="mb-10">
        <div className="mb-3 flex items-center justify-between">
          <div><h2 className="text-base">Home carousel</h2><p className="text-xs text-muted">Desktop image 16:7 (2400 x 1050 px), optional phone image 4:5 (1080 x 1350 px). Three to five banners work best.</p></div>
          <Link href="/admin/banners/new?group=carousel" className="inline-flex items-center gap-1.5 rounded-brand bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-accent-ink"><Icon name="plus" size={14} />Add carousel banner</Link>
        </div>
        <BannerCards group="carousel" items={carousel} onToggle={toggleBannerActive} onMove={moveBanner} onReorder={reorderBannerGroup} onDelete={deleteBanner} />
        {live(carousel).length > 0 && (
          <details className="mt-3 rounded-brand border border-line bg-white p-3">
            <summary className="cursor-pointer text-sm">Preview on website ({live(carousel).length} live)</summary>
            <div className="mt-3 grid gap-3 md:grid-cols-2">{live(carousel).map((b) => <BannerPreview key={b.id} group="carousel" image={b.image} headline={b.headline} line={b.line} ctaLabel={b.cta_label} compact />)}</div>
          </details>
        )}
      </section>
      <section>
        <div className="mb-3 flex items-center justify-between">
          <div><h2 className="text-base">Offer banner</h2><p className="text-xs text-muted">Wide strip between Services and Projects, 1440 x 400 px. The first Live one is shown.</p></div>
          <Link href="/admin/banners/new?group=offer" className="inline-flex items-center gap-1.5 rounded-brand bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-accent-ink"><Icon name="plus" size={14} />Add offer banner</Link>
        </div>
        <BannerCards group="offer" items={offer} onToggle={toggleBannerActive} onMove={moveBanner} onReorder={reorderBannerGroup} onDelete={deleteBanner} />
        {live(offer)[0] && <div className="mt-3"><p className="mb-1 text-xs text-muted">Preview on website</p><BannerPreview group="offer" image={live(offer)[0].image} headline={live(offer)[0].headline} line={live(offer)[0].line} ctaLabel={live(offer)[0].cta_label} /></div>}
      </section>
    </>
  );
}
