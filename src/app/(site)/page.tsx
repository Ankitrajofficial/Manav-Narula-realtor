import Image from "next/image";
import Link from "next/link";
import BannerCarousel from "@/components/BannerCarousel";
import OfferCarousel, { type OfferSlide } from "@/components/OfferCarousel";
import FeaturedStrip from "@/components/FeaturedStrip";
import EnquiryForm from "@/components/EnquiryForm";
import Accordion from "@/components/Accordion";
import Icon from "@/components/Icon";
import { Container, GoogleRating, Section, SectionTitle } from "@/components/ui";
import { servicesShort, site, testimonials, workEthics } from "@/data/site";
import TrustStats from "@/components/TrustStats";
import { getActiveOffers, getArticles, getBanners, getBusiness, getFoundedYear, getTrustStats, withFoundedYear, getFaqGroups, getFeaturedProperties, getFeaturedProjects, getOfferBanner, getLocalitiesServed, getPartnerBanks, offerCta } from "@/lib/site-data";

export const revalidate = 60;
import { formatDate, unsplash } from "@/lib/format";

export default async function HomePage() {
  const [localitiesServed, featuredProperties, featuredProjects, articles, banners, activeOffers, fallbackOffer, faqs, trustStats, foundedYear, business, banks] = await Promise.all([getLocalitiesServed(), getFeaturedProperties(), getFeaturedProjects(), getArticles(), getBanners(), getActiveOffers(), getOfferBanner(), getFaqGroups(), getTrustStats(), getFoundedYear(), getBusiness(), getPartnerBanks()]);
  const offers: OfferSlide[] = activeOffers.length
    ? activeOffers.map((o) => ({ id: String(o.id), image: o.image ?? fallbackOffer.image, headline: o.title, line: o.text ?? "", cta: { label: offerCta(o.href), href: o.href } }))
    // Without property offers: an offer banner set in Admin → Banners, else no offer slot (the built-in default is the
    // home loan line, which belongs to the Home Loans page).
    : fallbackOffer.id !== "static" ? [{ ...fallbackOffer, id: `banner-${fallbackOffer.id}` }] : [];
  const homeFaqs = [
    { ...faqs[0].items[0], tag: faqs[0].group },
    { ...faqs[0].items[1], tag: faqs[0].group },
    { ...faqs[1].items[0], tag: faqs[1].group },
    { ...faqs[Math.min(5, faqs.length - 1)].items[1], tag: faqs[Math.min(5, faqs.length - 1)].group },
  ];
  return (
    <>
      {/* 1. Banner slot */}
      <BannerCarousel banners={banners} />

      {/* 2. Brand statement and trust numbers */}
      <section className="border-b border-line bg-bg py-12 md:py-16">
        <Container>
          <p className="font-heading text-4xl md:text-6xl">{site.name}</p>
          <p className="mt-3 max-w-xl text-lg text-muted">{withFoundedYear(business.tagline || site.tagline, foundedYear)}</p>
          <TrustStats stats={trustStats} />
        </Container>
      </section>

      {/* 3. Featured properties */}
      <Section>
        {/* Every featured developer project first (Mexmon, AGI), then any featured resale listings. */}
        <FeaturedStrip projects={featuredProjects} items={featuredProperties} title="Featured properties" intro="Apartments, plots and commercial spaces from the developers we work with, with plans, prices and site visits arranged by us." action={{ label: "View all properties", href: "/properties" }} />
      </Section>

      {/* 4. How we work */}
      <Section className="border-y border-line bg-white">
        <SectionTitle title="How we work" intro="Four principles every advisor in our office follows on every deal, in this order." />
        <ol className="grid border-y border-line md:grid-cols-2 lg:grid-cols-4">
          {workEthics.map((w, i) => (
            <li key={w.title} className="group flex flex-col border-line py-8 not-first:border-t md:pr-8 md:nth-[2n]:border-l md:nth-[2n]:pl-8 md:nth-[-n+2]:border-t-0 lg:pl-8 lg:not-first:border-l lg:nth-[n+3]:border-t-0 lg:first:pl-0 lg:last:pr-0">
              <div className="flex items-center gap-3">
                <Icon name={w.icon} size={22} className="text-accent" />
                <span className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Step <span className="tabular text-accent-ink">{String(i + 1).padStart(2, "0")}</span></span>
              </div>
              <h3 className="mt-5 text-xl leading-snug transition-colors group-hover:text-accent-ink lg:min-h-[3.5rem]">{w.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">{w.text}</p>
            </li>
          ))}
        </ol>
        <p className="mt-6 flex items-start gap-2 text-sm text-muted">
          <Icon name="shield" size={16} className="mt-0.5 shrink-0 text-accent" />
          <span>Every step above is written into our engagement letter.</span>
        </p>
      </Section>

      {/* 5. Services */}
      <Section>
        <SectionTitle title="Services" intro="One office for buying, selling, renting, paperwork and loans." action={{ label: "All services", href: "/services" }} />
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {servicesShort.map((s) => (
            <li key={s.id}>
              <Link href={s.href ?? `/services#${s.id}`} className="flex h-full gap-4 rounded-brand border border-[#c9c9c6] bg-white p-5 transition-colors hover:border-ink">
                <Icon name={s.icon} size={24} className="mt-0.5 shrink-0 text-accent" />
                <div>
                  <h3 className="text-lg">{s.title}</h3>
                  <p className="mt-1 text-sm text-muted">{s.line}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      {/* 5b. Partner banks for home loans, logos in full colour */}
      {banks.length > 0 && (
        <Section className="border-y border-line bg-white">
          <SectionTitle title="Home loans from partner banks" intro="We compare offers from these banks and handle the file until sanction, with zero brokerage." action={{ label: "Home loans", href: "/home-loans" }} />
          <ul className={`grid grid-cols-2 gap-3 sm:grid-cols-3 ${banks.length % 6 === 0 ? "lg:grid-cols-6" : "lg:grid-cols-5"} [&>li:last-child:nth-child(odd)]:col-span-2 sm:[&>li:last-child:nth-child(odd)]:col-span-1`}>
            {banks.map((b) => (
              <li key={b.id}>
                <Link href="/home-loans" className="flex h-full flex-col items-center justify-center gap-3 rounded-brand border border-[#c9c9c6] bg-white px-4 py-5 text-center transition-colors hover:border-ink">
                  <span className="relative flex h-12 w-full items-center justify-center">
                    {b.logo ? <Image src={b.logo} alt={`${b.name} logo`} fill sizes="(min-width: 1024px) 200px, 45vw" className="object-contain" /> : <Icon name="bank" size={28} className="text-accent" />}
                  </span>
                  <span className="text-sm">{b.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* 6. Offer banner slot: every active offer, as a carousel */}
      {offers.length > 0 && (
        <Container className="pb-14 md:pb-24">
          <OfferCarousel offers={offers} />
        </Container>
      )}

      {/* 8. Localities */}
      <Section>
        <SectionTitle title="Localities we serve" intro="Click a locality to see what is available there." />
        <ul className="grid grid-cols-2 gap-px overflow-hidden rounded-brand border border-line bg-line sm:grid-cols-3 lg:grid-cols-5">
          {localitiesServed.map((l) => (
            <li key={l.name} className="bg-white">
              <Link href={`/properties?locality=${encodeURIComponent(l.name)}`} className="block p-5 hover:bg-bg">
                <p className="text-base">{l.name}</p>
                <p className="mt-1 text-sm tabular text-muted">{l.count ?? 0} {l.count === 1 ? "property" : "properties"}</p>
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      {/* 9. Testimonials */}
      <Section className="border-y border-line bg-white">
        <div className="mb-8 flex flex-col gap-3 md:mb-12 md:flex-row md:items-end md:justify-between">
          <h2 className="text-3xl md:text-4xl">What clients say</h2>
          <a href={site.reviewHref} target="_blank" rel="noopener"><GoogleRating rating={site.rating} reviews={site.reviews} /></a>
        </div>
        <ul className="grid gap-8 md:grid-cols-3">
          {testimonials.map((t) => (
            <li key={t.name} className="border-l border-accent pl-5">
              <blockquote className="font-heading text-lg leading-relaxed">“{t.quote}”</blockquote>
              <p className="mt-4 text-sm">{t.name}</p>
              <p className="text-sm text-muted">{t.locality}</p>
            </li>
          ))}
        </ul>
      </Section>

      {/* 10. Blog */}
      <Section>
        <SectionTitle title="Latest from the blog" action={{ label: "All articles", href: "/blog" }} />
        <ul className="grid gap-6 md:grid-cols-3">
          {articles.slice(0, 3).map((a) => (
            <li key={a.slug}>
              <Link href={`/blog/${a.slug}`} className="group block overflow-hidden rounded-brand border border-[#c9c9c6] bg-white transition-colors hover:border-ink">
                <div className="relative aspect-[4/3] bg-line"><Image src={unsplash(a.cover, 800, 600)} alt="" fill sizes="(min-width: 768px) 400px, 100vw" className="object-cover" /></div>
                <div className="p-4">
                  <span className="text-xs text-accent-ink">{a.category}</span>
                  <h3 className="mt-1 text-lg leading-snug group-hover:text-accent-ink">{a.title}</h3>
                  <p className="mt-2 text-sm text-muted">{formatDate(a.date)}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      {/* 11. Enquiry */}
      <Section id="enquiry" className="border-y border-line bg-white">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <h2 className="text-3xl md:text-4xl">Send an enquiry</h2>
            <p className="mt-2 mb-8 max-w-xl text-muted">Tell us what you are looking for and an advisor will call you back within working hours, usually within 2 hours.</p>
            <div className="rounded-brand border border-line bg-bg p-5 md:p-8">
              <EnquiryForm variant="short" />
            </div>
          </div>
          <div className="lg:col-span-5">
            <h3 className="text-xl">What happens next</h3>
            <ol className="mt-5 space-y-5">
              {[
                { t: "An advisor calls you back", d: "Within working hours, usually within 2 hours, to understand your budget and locality." },
                { t: "You get a verified shortlist or valuation", d: "Only properties whose title and approvals we have checked, or a written valuation within 48 hours." },
                { t: "We accompany every site visit", d: "From the first look to registry, one point of contact from our office." },
              ].map((s, i) => (
                <li key={s.t} className="flex gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-brand border border-line font-heading text-sm tabular text-accent-ink">{i + 1}</span>
                  <div>
                    <p>{s.t}</p>
                    <p className="mt-0.5 text-sm text-muted">{s.d}</p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="mt-8 rounded-brand border border-line p-5">
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted">Prefer to talk?</p>
              <address className="mt-3 space-y-2.5 text-sm not-italic">
                <p className="flex gap-2.5"><Icon name="pin" size={16} className="mt-0.5 shrink-0 text-muted" />{site.address}</p>
                <p className="flex gap-2.5"><Icon name="clock" size={16} className="mt-0.5 shrink-0 text-muted" />{site.hours}</p>
              </address>
              <div className="mt-4 flex flex-wrap gap-2">
                <a href={site.phoneHref} className="inline-flex items-center gap-2 rounded-brand border border-ink px-4 py-2.5 text-sm tabular hover:bg-ink hover:text-white"><Icon name="phone" size={16} />{site.phone}</a>
                <a href={site.whatsappHref} target="_blank" rel="noopener" className="inline-flex items-center gap-2 rounded-brand border border-ink px-4 py-2.5 text-sm hover:bg-ink hover:text-white"><Icon name="whatsapp" size={16} />WhatsApp</a>
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
                <GoogleRating rating={site.rating} reviews={site.reviews} />
                <Link href="/contact" className="text-sm text-accent-ink hover:underline">Full contact page and map</Link>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* 12. FAQ preview */}
      <Section>
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-4">
            <h2 className="text-3xl md:text-4xl">Common questions</h2>
            <p className="mt-3 text-muted">The four we are asked most often. The full list covers buying, selling, renting, legal, home loans and NRI matters.</p>
            <Link href="/faq" className="mt-4 inline-flex items-center gap-1 text-sm text-accent-ink hover:underline">
              See all questions<Icon name="arrowRight" size={16} />
            </Link>
            <div className="mt-8 rounded-brand border border-line bg-white p-5">
              <p className="text-lg">Still have a question?</p>
              <p className="mt-1 text-sm text-muted">Ask an advisor directly. We answer within working hours.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <a href={site.phoneHref} className="inline-flex items-center gap-2 rounded-brand border border-ink px-4 py-2 text-sm hover:bg-ink hover:text-white"><Icon name="phone" size={14} />Call</a>
                <a href={site.whatsappHref} target="_blank" rel="noopener" className="inline-flex items-center gap-2 rounded-brand border border-ink px-4 py-2 text-sm hover:bg-ink hover:text-white"><Icon name="whatsapp" size={14} />WhatsApp</a>
              </div>
            </div>
          </div>
          <div className="md:col-span-8">
            <Accordion items={homeFaqs} numbered />
          </div>
        </div>
      </Section>
    </>
  );
}
