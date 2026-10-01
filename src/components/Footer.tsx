import Link from "next/link";
import { nav, site } from "@/data/site";
import { getBusiness, getFoundedYear, phoneHref, whatsappHref, withFoundedYear } from "@/lib/site-data";
import { q } from "@/lib/db";
import Icon from "./Icon";
import { Container } from "./ui";

const heading = "mb-4 text-xs font-medium uppercase tracking-[0.12em] text-white/50";
const link = "text-sm text-white/85 hover:text-accent";

export default async function Footer() {
  const [b, foundedYear] = await Promise.all([getBusiness(), getFoundedYear()]);
  // Active localities that have at least one published property; the first twelve active ones if none do yet.
  const localities = (await q<{ name: string }>(`SELECT l.name FROM localities l WHERE l.is_active AND (EXISTS (SELECT 1 FROM properties p WHERE p.published AND p.locality = l.name) OR NOT EXISTS (SELECT 1 FROM properties p JOIN localities x ON x.name = p.locality WHERE p.published AND x.is_active)) ORDER BY l.sort_order, l.name LIMIT 12`)).map((r) => r.name);
  const tel = phoneHref(b), wa = whatsappHref(b);
  return (
    <footer className="bg-ink text-white pb-24 md:pb-0">
      {/* Top row: brand and the two fastest ways to reach us */}
      <Container className="flex flex-col gap-6 border-b border-white/10 py-10 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-brand border border-white/60 font-heading">{site.monogram}</span>
          <div>
            <p className="font-heading text-xl leading-tight">{site.name}</p>
            <p className="text-sm text-white/60">{withFoundedYear(b.tagline, foundedYear)}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <a href={tel} className="inline-flex items-center gap-2 rounded-brand border border-white/60 px-4 py-2.5 text-sm tabular hover:bg-white hover:text-ink">
            <Icon name="phone" size={16} />{b.phone}
          </a>
          <a href={wa} target="_blank" rel="noopener" className="inline-flex items-center gap-2 rounded-brand border border-white/60 px-4 py-2.5 text-sm hover:bg-white hover:text-ink">
            <Icon name="whatsapp" size={16} />WhatsApp
          </a>
          <Link href="/contact" className="inline-flex items-center gap-2 rounded-brand bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-ink">
            Enquire
          </Link>
        </div>
      </Container>

      {/* Columns */}
      <Container className="grid gap-10 py-12 md:grid-cols-12 md:py-16">
        <div className="md:col-span-3">
          <p className={heading}>About</p>
          <p className="text-sm text-white/75">
            Property advisors in Jalandhar since {foundedYear}. Verified titles, honest pricing and accompanied site visits across the city.
          </p>
          <a href={site.reviewHref} target="_blank" rel="noopener" className="mt-5 inline-flex items-center gap-2 rounded-brand border border-white/20 px-3 py-2 text-sm hover:border-white/60">
            <Icon name="google" size={18} />
            <Icon name="star" size={14} className="text-accent" />
            <strong className="tabular">{Number(b.rating).toFixed(1)}</strong>
            <span className="text-white/60">({b.reviews} Google reviews)</span>
          </a>
        </div>

        <div className="md:col-span-2">
          <p className={heading}>Quick links</p>
          <ul className="space-y-2.5">
            {nav.map((n) => (
              <li key={n.href}><Link href={n.href} className={link}>{n.label}</Link></li>
            ))}
            <li><Link href="/faq" className={link}>FAQ</Link></li>
          </ul>
        </div>

        <div className="md:col-span-4">
          <p className={heading}>Localities served</p>
          <ul className="grid grid-cols-2 gap-x-6 gap-y-2.5">
            {localities.map((l) => (
              <li key={l}>
                <Link href={`/properties?locality=${encodeURIComponent(l)}`} className={link}>{l}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="md:col-span-3">
          <p className={heading}>Office</p>
          <address className="space-y-3 text-sm not-italic">
            <p className="flex gap-2.5 text-white/75"><Icon name="pin" size={16} className="mt-0.5 shrink-0 text-white/50" />{b.address}</p>
            <p className="flex gap-2.5"><Icon name="phone" size={16} className="mt-0.5 shrink-0 text-white/50" /><a href={tel} className="tabular text-white/85 hover:text-accent">{b.phone}</a></p>
            <p className="flex gap-2.5"><Icon name="whatsapp" size={16} className="mt-0.5 shrink-0 text-white/50" /><a href={wa} className="text-white/85 hover:text-accent" target="_blank" rel="noopener">WhatsApp us</a></p>
            <p className="flex gap-2.5"><Icon name="mail" size={16} className="mt-0.5 shrink-0 text-white/50" /><a href={`mailto:${b.email}`} className="text-white/85 hover:text-accent">{b.email}</a></p>
            <p className="flex gap-2.5 text-white/75"><Icon name="clock" size={16} className="mt-0.5 shrink-0 text-white/50" />{b.hours}</p>
          </address>
          <a href={site.mapHref} target="_blank" rel="noopener" className="mt-4 inline-flex items-center gap-1 text-sm text-accent hover:underline">
            Get directions<Icon name="arrowRight" size={14} />
          </a>
          <div className="mt-5 flex gap-2">
            {[
              { href: b.instagram, icon: "instagram", label: "Instagram" },
              { href: b.facebook, icon: "facebook", label: "Facebook" },
              { href: b.youtube, icon: "youtube", label: "YouTube" },
            ].map((s) => (
              <a key={s.icon} href={s.href} aria-label={s.label} target="_blank" rel="noopener" className="flex h-9 w-9 items-center justify-center rounded-brand border border-white/20 text-white/60 hover:border-white/60 hover:text-white">
                <Icon name={s.icon} size={18} />
              </a>
            ))}
          </div>
        </div>
      </Container>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <Container className="flex flex-col gap-3 py-5 text-xs text-white/50 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} {site.name}. All rights reserved.</p>
          <div className="flex gap-5">
            <Link href="/privacy" className="hover:text-white">Privacy</Link>
            <Link href="/terms" className="hover:text-white">Terms</Link>
            <Link href="/disclaimer" className="hover:text-white">Disclaimer</Link>
            <Link href="/sitemap.xml" className="hover:text-white">Sitemap</Link>
          </div>
        </Container>
      </div>
    </footer>
  );
}
