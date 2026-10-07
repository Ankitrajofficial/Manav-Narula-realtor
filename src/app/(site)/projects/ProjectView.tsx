import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import EnquiryForm from "@/components/EnquiryForm";
import ShareButtons from "@/components/ShareButtons";
import Accordion from "@/components/Accordion";
import ProjectImage from "@/components/ProjectImage";
import { configSummary, projectPlace, projectPrice } from "@/components/ProjectCard";
import Icon from "@/components/Icon";
import { Breadcrumbs, Container, Tag } from "@/components/ui";
import { developerCredit, propertyDevelopers, site, workEthics } from "@/data/site";
import type { Project, ProjectMedia, ProjectUnit } from "@/data/projects";
import { phoneHref, whatsappHref, type Business } from "@/lib/site-data";
import UnitTabs from "./UnitTabs";
import { formatPrice, unsplash } from "@/lib/format";

/** Title and description for a project page or one of its unit-type pages. */
export function projectMetadata(p: Project, unit?: ProjectUnit): Metadata {
  const path = `/projects/${p.slug}${unit ? `/${unit.slug}` : ""}`;
  const title = unit ? unit.seoTitle || `${unit.name} at ${p.name}, ${projectPlace(p)} | ${site.name}` : p.seoTitle || `${p.name}, ${projectPlace(p)} | ${site.name}`;
  const description = (unit ? unit.seoDescription || unit.description[0] : null) || p.seoDescription || p.description[0];
  const image = (unit?.media.find((m) => m.kind !== "floor-plan") ?? null)?.url ?? p.image;
  return {
    title: { absolute: title }, description, alternates: { canonical: path },
    // A draft seen in an admin preview must never be indexed.
    ...(p.published === false ? { robots: { index: false, follow: false } } : {}),
    openGraph: { title, description, type: "website", ...(image ? { images: [{ url: unsplash(image, 1200, 630), alt: p.media?.find((m) => m.url === image)?.alt ?? unit?.media.find((m) => m.url === image)?.alt ?? p.name }] } : {}) },
  };
}

/** A grid of photos, each with its own alt text, opening full size in a new tab. */
function Shots({ items, className = "" }: { items: ProjectMedia[]; className?: string }) {
  return (
    <ul className={`grid grid-cols-2 gap-3 md:grid-cols-3 ${className}`}>
      {items.map((m) => (
        <li key={m.url}><a href={m.url} target="_blank" rel="noopener" className="relative block aspect-[4/3] overflow-hidden rounded-brand border border-line bg-line">
          <Image src={unsplash(m.url, 800, 600)} alt={m.alt} fill sizes="(min-width: 768px) 260px, 50vw" className="object-cover" />
        </a></li>
      ))}
    </ul>
  );
}

function Section({ title, children, id }: { title: string; children: React.ReactNode; id?: string }) {
  return (
    <section id={id} className="mt-12 scroll-mt-24">
      <h2 className="text-2xl">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

/** The project page; with `unit`, the SEO page of one unit type (same data, that unit's tab open and its copy first). */
export default function ProjectView({ p, business, unit }: { p: Project; business: Business; unit?: ProjectUnit }) {
  const place = projectPlace(p);
  const url = `${site.url}/projects/${p.slug}${unit ? `/${unit.slug}` : ""}`;
  const title = unit ? `${unit.name} at ${p.name}` : p.name;
  const units = p.units ?? [];
  // The developer's tab under Properties, for the breadcrumb and the back link.
  const dev = propertyDevelopers.find((d) => d.slug === p.developerSlug);
  const types = configSummary(p.configurations.map((c) => c.type));
  const facts = [
    ...(types ? [{ label: "Configurations", value: types }] : []),
    ...(p.sizeRange ? [{ label: "Sizes", value: p.sizeRange }] : []),
    { label: "Price", value: projectPrice(p) },
    ...(p.possession ? [{ label: "Possession", value: p.possession }] : []),
    ...p.keyFacts.filter((f) => f.label !== "Configurations"),
  ];
  // Images by section (see ProjectMedia): the first elevation is the hero; the rest of the photos form the gallery.
  const media = p.media ?? [];
  const ofKind = (...kinds: string[]) => media.filter((m) => kinds.includes(m.kind));
  const unitShot = unit?.media.find((m) => m.kind === "elevation" || m.kind === "interior" || m.kind === "gallery");
  const cover = unitShot ?? ofKind("elevation")[0] ?? ofKind("interior", "gallery")[0];
  const photos = ofKind("elevation", "interior", "gallery").filter((m) => m !== cover);
  const plans = ofKind("floor-plan"), masterPlans = ofKind("master-plan"), amenityShots = ofKind("amenity"), maps = ofKind("location-map");
  const heroSrc = cover?.url ?? p.image;
  const faqs = p.faqs ?? [];
  const schema = [
    {
      "@context": "https://schema.org", "@type": "RealEstateListing", name: title, url, description: unit?.description[0] ?? p.description[0],
      ...(media.length ? { image: ofKind("elevation", "interior", "gallery").slice(0, 6).map((m) => (m.url.startsWith("/") ? `${site.url}${m.url}` : unsplash(m.url, 1200, 900))) } : {}),
      offers: p.priceFrom ? { "@type": "Offer", priceCurrency: "INR", price: p.priceFrom, availability: "https://schema.org/InStock" } : undefined,
      about: {
        "@type": /BHK|Penthouse|Duplex/i.test(types) ? "ApartmentComplex" : "Residence", name: p.name,
        address: { "@type": "PostalAddress", streetAddress: p.address || p.locality, addressLocality: p.city || "Jalandhar", addressRegion: "Punjab", addressCountry: "IN" },
        ...(p.amenities.length ? { amenityFeature: p.amenities.slice(0, 20).map((a) => ({ "@type": "LocationFeatureSpecification", name: a, value: true })) } : {}),
      },
      provider: { "@type": "RealEstateAgent", name: site.name, telephone: business.phone, url: site.url },
      ...(p.developer ? { brand: { "@type": "Organization", name: p.developer, ...(p.developerSlug ? { url: `${site.url}/developers/${p.developerSlug}` } : {}) } } : {}),
      ...(p.rera ? { identifier: { "@type": "PropertyValue", name: "Project RERA No.", value: p.rera } } : {}),
    },
    ...(faqs.length ? [{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) }] : []),
  ];

  return (
    <>
      {p.published === false && <p role="status" className="bg-[#fff4d6] px-4 py-2 text-center text-sm text-ink">Draft preview: only admins can see this page until the project is published.</p>}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      {/* Hero */}
      <div className="relative h-[420px] border-b border-line bg-line md:h-[520px]">
        <ProjectImage src={heroSrc} alt={cover?.alt} name={p.name} developer={p.developer} sizes="100vw" priority bare />
        {heroSrc && <div className="absolute inset-0 bg-ink/50" />}
        <Container className="relative flex h-full flex-col justify-end pb-10 text-white">
          <span className="flex flex-wrap items-center gap-3"><Tag>{p.status}</Tag>{!heroSrc && <span className="text-xs text-white/70">Photos coming soon</span>}</span>
          <h1 className="mt-3 text-4xl md:text-6xl">{title}</h1>
          <p className="mt-3 text-sm md:text-base">Developed by {p.developerSlug ? <Link href={`/developers/${p.developerSlug}`} className="font-bold underline-offset-4 hover:underline">{p.developer}</Link> : <strong>{p.developer}</strong>}</p>
          <p className="mt-1 text-xs text-white/80">{developerCredit}</p>
          <p className="mt-1 text-sm text-white/85">{p.address || place}</p>
          {(unit?.rera || p.rera) && <p className="mt-1 text-sm tabular text-white/85">Project RERA No.: {unit?.rera || p.rera}</p>}
          <div className="mt-5 flex flex-wrap gap-2">
            <a href={phoneHref(business)} className="inline-flex items-center gap-2 rounded-brand bg-accent px-5 py-3 text-sm font-medium text-white hover:bg-accent-ink"><Icon name="phone" size={16} />Call {business.phone}</a>
            <a href={whatsappHref(business)} target="_blank" rel="noopener" className="inline-flex items-center gap-2 rounded-brand border border-white px-5 py-3 text-sm text-white hover:bg-white hover:text-ink"><Icon name="whatsapp" size={16} />WhatsApp</a>
            <a href="#enquire" className="inline-flex items-center gap-2 rounded-brand border border-white/60 px-5 py-3 text-sm text-white hover:border-white">Ask for price and plans</a>
          </div>
        </Container>
      </div>

      <Container className="py-8 md:py-12">
        <Breadcrumbs items={[{ label: "Properties", href: "/properties" }, ...(dev ? [{ label: dev.label, href: `/properties?developer=${dev.slug}` }] : []), ...(unit ? [{ label: p.name, href: `/projects/${p.slug}` }, { label: unit.label }] : [{ label: p.name }])]} />
        <div className="mt-8 grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-8">
            {/* Key facts strip */}
            <div className="flex items-start justify-between gap-4">
              <p className="text-2xl font-bold">{projectPrice(p)}</p>
              <ShareButtons title={p.name} />
            </div>
            <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-5 border-y border-line py-6 sm:grid-cols-3">
              {facts.map((f) => <div key={f.label}><dt className="text-xs text-muted">{f.label}</dt><dd className="mt-0.5 text-sm tabular">{f.value}</dd></div>)}
            </dl>

            {unit && (
              <div className="mt-10">
                <div className="prose-article text-ink/85">{unit.description.map((t, i) => <p key={i}>{t}</p>)}</div>
                {unit.highlights.length > 0 && (
                  <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                    {unit.highlights.map((h) => <li key={h} className="flex gap-2 text-sm"><Icon name="check" size={16} className="mt-0.5 shrink-0 text-accent" />{h}</li>)}
                  </ul>
                )}
                <h2 className="mt-10 text-2xl">About {p.name}</h2>
              </div>
            )}
            {p.description.length > 0 && <div className={`prose-article text-ink/85 ${unit ? "mt-4" : "mt-10"}`}>{p.description.map((t, i) => <p key={i}>{t}</p>)}</div>}
            {(p.highlights ?? []).length > 0 && (
              <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                {p.highlights!.map((h) => <li key={h} className="flex gap-2 text-sm"><Icon name="check" size={16} className="mt-0.5 shrink-0 text-accent" />{h}</li>)}
              </ul>
            )}

            {p.configurations.length > 0 && (
              <Section title="Configurations">
                <table className="w-full border-y border-line text-sm">
                  <thead className="text-left text-muted"><tr><th className="py-3 font-normal">Type</th><th className="py-3 font-normal">Size</th><th className="hidden py-3 font-normal sm:table-cell">Notes</th><th className="py-3 text-right font-normal">Price</th></tr></thead>
                  <tbody className="divide-y divide-line">
                    {p.configurations.map((c, i) => (
                      <tr key={c.type + i}>
                        <td className="py-3">{c.type}<span className="block text-xs text-muted sm:hidden">{c.note}</span></td>
                        <td className="py-3 tabular">{c.area || "On request"}</td>
                        <td className="hidden py-3 text-muted sm:table-cell">{c.note}</td>
                        <td className="py-3 text-right tabular">{c.price || "On request"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Section>
            )}

            {units.length > 0 && (
              <Section title="Unit types" id="unit-types">
                <UnitTabs units={units} projectSlug={p.slug} projectName={p.name} active={unit?.slug} />
              </Section>
            )}

            {(p.amenities.length > 0 || amenityShots.length > 0) && (
              <Section title="Amenities">
                {amenityShots.length > 0 && <Shots items={amenityShots} className={p.amenities.length ? "mb-6" : ""} />}
                {p.amenities.length > 0 && <ul className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">{p.amenities.map((a) => <li key={a} className="flex gap-2"><Icon name="check" size={16} className="mt-0.5 shrink-0 text-accent" />{a}</li>)}</ul>}
              </Section>
            )}

            <Section title="Location">
              {maps.map((m) => (
                <a key={m.url} href={m.url} target="_blank" rel="noopener" className="mb-4 block overflow-hidden rounded-brand border border-line bg-white hover:border-ink">
                  <span className="relative block aspect-[16/9]"><Image src={m.url} alt={m.alt} fill sizes="(min-width: 1024px) 760px, 100vw" className="object-contain" /></span>
                </a>
              ))}
              <p className="flex gap-2 text-sm"><Icon name="pin" size={16} className="mt-0.5 shrink-0 text-muted" />{p.address || place}</p>
              {(p.locationHighlights ?? []).length > 0 && (
                <>
                  <ul className="mt-4 grid gap-2 text-sm sm:grid-cols-2">{p.locationHighlights!.map((l) => <li key={l} className="rounded-brand border border-line bg-white px-3 py-2">{l}</li>)}</ul>
                  <p className="mt-2 text-xs text-muted">Travel times as stated by the developer.</p>
                </>
              )}
            </Section>

            {plans.length > 0 && (
              <Section title="Floor plans" id="floor-plans">
                <ul className="grid grid-cols-2 gap-3 md:grid-cols-3">
                  {plans.map((f) => (
                    <li key={f.url}><a href={f.url} target="_blank" rel="noopener" className="block overflow-hidden rounded-brand border border-line bg-white hover:border-ink">
                      <span className="relative block aspect-[4/3] bg-white"><Image src={f.url} alt={f.alt} fill sizes="300px" className="object-contain p-2" /></span>
                      <span className="block border-t border-line px-3 py-2 text-xs">{f.alt}</span>
                    </a></li>
                  ))}
                </ul>
              </Section>
            )}

            {masterPlans.length > 0 && (
              <Section title="Master plan" id="master-plan">
                {masterPlans.map((m) => (
                  <a key={m.url} href={m.url} target="_blank" rel="noopener" className="mb-3 block overflow-hidden rounded-brand border border-line bg-white hover:border-ink">
                    <span className="relative block aspect-[16/10]"><Image src={m.url} alt={m.alt} fill sizes="(min-width: 1024px) 760px, 100vw" className="object-contain p-2" /></span>
                  </a>
                ))}
              </Section>
            )}

            {(photos.length > 0 || p.brochure) && (
              <Section title="Gallery" id="gallery">
                {photos.length > 0 && <Shots items={photos} />}
                {p.brochure && <a href={p.brochure} download className="mt-6 inline-flex items-center gap-2 rounded-brand border border-ink px-5 py-3 text-sm hover:bg-ink hover:text-white"><Icon name="download" size={16} />Download brochure (PDF)</a>}
              </Section>
            )}

            <Section title={`Why buy through ${site.name}`}>
              <p className="text-sm text-muted">We are sales agents for {p.name}, developed by {p.developer}. You deal with one advisor from the first call to registry, and our help costs you nothing extra on the developer&apos;s price.</p>
              <ul className="mt-5 grid gap-4 sm:grid-cols-2">
                {[...workEthics.slice(1), { icon: "bank", title: "Home loans compared for you", text: "We compare offers from our partner banks and prepare your file until sanction." }].map((w) => (
                  <li key={w.title} className="flex gap-3 rounded-brand border border-line bg-white p-4">
                    <Icon name={w.icon} size={20} className="mt-0.5 shrink-0 text-accent" />
                    <div><p className="text-sm font-medium">{w.title}</p><p className="mt-1 text-sm text-muted">{w.text}</p></div>
                  </li>
                ))}
              </ul>
            </Section>

            {faqs.length > 0 && <Section title="Questions buyers ask" id="faq"><Accordion items={faqs} /></Section>}

            <aside aria-label="RERA disclaimer" className="mt-12 rounded-brand border border-line bg-bg p-4 text-xs leading-relaxed text-muted">
              <p className="font-medium text-ink">RERA disclaimer</p>
              <p className="mt-1">
                {p.name} is developed by {p.developer}{p.rera ? ` and registered with the Punjab Real Estate Regulatory Authority as ${p.rera}` : ""}. {site.name} is a sales agent for the project and is not the developer. {developerCredit}{" "}
                Configurations, sizes, amenities and timelines are as declared by the developer and may change; the builder-buyer agreement and the RERA registration prevail.
                {p.rera ? " Check the registration at rera.punjab.gov.in before you book." : " Ask us for the RERA registration before you pay any token."} Images are indicative.
                {p.priceFrom ? ` Prices start from ${formatPrice(p.priceFrom)} and exclude taxes and charges unless stated.` : ""}
              </p>
            </aside>
          </div>

          <aside className="lg:col-span-4">
            <div id="enquire" className="sticky top-24 scroll-mt-24 rounded-brand border border-line bg-white p-5">
              <h2 className="text-xl">Enquire about {title}</h2>
              <p className="mb-4 mt-1 text-sm text-muted">Price list, floor plans, availability and a site visit.</p>
              <EnquiryForm variant="project" subject={unit ? `${p.name} (${unit.label})` : p.name} submitLabel="Send enquiry" projectId={p.id} />
              <p className="mt-4 border-t border-line pt-3 text-xs text-muted">Or call <a href={phoneHref(business)} className="text-ink hover:underline">{business.phone}</a> · Developed by {p.developerSlug ? <Link href={`/developers/${p.developerSlug}`} className="text-ink hover:underline">{p.developer}</Link> : p.developer}</p>
            </div>
          </aside>
        </div>
        <p className="mt-12 text-sm"><Link href={dev ? `/properties?developer=${dev.slug}` : "/properties"} className="text-accent-ink hover:underline">← {dev ? `All ${dev.label} properties` : "All properties"}</Link></p>
      </Container>
    </>
  );
}
