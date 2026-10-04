import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Gallery from "@/components/Gallery";
import EnquiryForm from "@/components/EnquiryForm";
import PropertyCard from "@/components/PropertyCard";
import ShareButtons from "@/components/ShareButtons";
import Icon from "@/components/Icon";
import { Breadcrumbs, Container, Tag, TrustRow } from "@/components/ui";
import type { Property } from "@/data/properties";
import { getProperties, getPropertyBySlug, publicAddress } from "@/lib/site-data";

export const revalidate = 60;

function similarProperties(all: Property[], p: Property, n = 3) {
  const score = (x: Property) => (x.type === p.type ? 2 : 0) + (x.locality === p.locality ? 2 : 0) + (x.purpose === p.purpose ? 1 : 0);
  return all.filter((x) => x.slug !== p.slug).sort((a, b) => score(b) - score(a)).slice(0, n);
}
import { site } from "@/data/site";

/** A description paragraph: "## " starts a sub-heading, and a block of "- " lines is a bullet list. */
function DescriptionBlock({ text }: { text: string }) {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length === 1 && lines[0].startsWith("## ")) return <h3 className="mb-3 mt-8 text-xl">{lines[0].slice(3)}</h3>;
  if (lines.every((l) => l.startsWith("- "))) return <ul className="mb-5 list-disc space-y-1 pl-5">{lines.map((l) => <li key={l}>{l.slice(2)}</li>)}</ul>;
  return <p>{text}</p>;
}
import { formatArea, formatPrice, pricePerSqft, unsplash } from "@/lib/format";
import Logo from "@/components/Logo";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = await getPropertyBySlug((await params).slug);
  if (!p) return {};
  return { title: p.metaTitle ? { absolute: p.metaTitle } : `${p.title}, ${p.locality}`, description: p.metaDescription || p.description, openGraph: { images: [unsplash(p.images[0], 1200, 900)] } };
}

export default async function PropertyPage({ params }: { params: Promise<{ slug: string }> }) {
  const p = await getPropertyBySlug((await params).slug);
  if (!p) notFound();
  const all = await getProperties();
  const specs = [
    p.bhk && { icon: "bed", label: "BHK", value: `${p.bhk} BHK` },
    p.baths && { icon: "bath", label: "Baths", value: String(p.baths) },
    p.area > 0 && { icon: "area", label: "Area", value: formatArea(p.area, p.areaUnit) },
    p.floor && { icon: "layers", label: "Floor", value: p.floor },
    p.facing && { icon: "compass", label: "Facing", value: p.facing },
    p.furnishing && { icon: "sofa", label: "Furnishing", value: p.furnishing },
    p.parking && { icon: "car", label: "Parking", value: p.parking },
    p.possession && { icon: "calendar", label: "Possession", value: p.possession },
  ].filter(Boolean) as { icon: string; label: string; value: string }[];
  const schema = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: p.title,
    description: p.description,
    url: `${site.url}/properties/${p.slug}`,
    image: p.images.map((i) => unsplash(i)),
    offers: { "@type": "Offer", price: p.price, priceCurrency: "INR", availability: "https://schema.org/InStock" },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <Container className="py-8 md:py-12">
        <Breadcrumbs items={[{ label: "Properties", href: "/properties" }, { label: p.locality, href: `/properties?locality=${encodeURIComponent(p.locality)}&purpose=${p.purpose}` }, { label: p.title }]} />
        <div className="mt-8 grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <Gallery images={p.images} alt={p.title} />
            <div className="mt-8 flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3"><Tag>{p.status}</Tag><span className="text-sm text-muted">{p.type} · {p.purpose === "Rent" ? "For rent" : "For sale"}</span></div>
                <h1 className="mt-3 text-3xl md:text-4xl">{p.title}</h1>
                <p className="mt-1 text-muted">{publicAddress(p)}</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold tabular">{formatPrice(p.price, p.purpose)}</p>
                {p.purpose === "Buy" && p.price > 0 && p.area > 0 && <p className="text-sm tabular text-muted">{pricePerSqft(p.price, p.area, p.areaUnit)}</p>}
              </div>
            </div>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-y border-line py-4">
              <TrustRow items={p.trust} size="md" />
              <ShareButtons title={p.title} />
            </div>

            <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
              {specs.map((s) => (
                <div key={s.label} className="flex gap-3">
                  <Icon name={s.icon} size={22} className="mt-0.5 shrink-0 text-muted" />
                  <div><dt className="text-xs text-muted">{s.label}</dt><dd className="text-sm tabular">{s.value}</dd></div>
                </div>
              ))}
            </dl>

            <section className="mt-12">
              <h2 className="text-2xl">About this property</h2>
              <div className="prose-article mt-4 text-justify hyphens-auto text-ink/85">{p.longDescription.map((t, i) => <DescriptionBlock key={i} text={t} />)}</div>
            </section>

            <section className="mt-12">
              <h2 className="text-2xl">Amenities</h2>
              <ul className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                {p.amenities.map((a) => <li key={a} className="flex items-center gap-2"><Icon name="check" size={16} className="text-accent" />{a}</li>)}
              </ul>
            </section>

            {p.masterPlan && (
              <section className="mt-12">
                <h2 className="text-2xl">Master plan</h2>
                <a href={p.masterPlan} target="_blank" rel="noopener" className="mt-4 block overflow-hidden rounded-brand border border-line bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.masterPlan} alt={`Master plan of ${p.title}`} loading="lazy" className="mx-auto h-auto max-h-[80vh] w-auto max-w-full" />
                </a>
                <p className="mt-2 text-xs text-muted">Tap to open full size.</p>
              </section>
            )}

            {!!p.floorPlans?.length && (
              <section className="mt-12">
                <h2 className="text-2xl">Floor plans</h2>
                <div className={`mt-4 grid gap-6 ${p.floorPlans.length > 1 ? "sm:grid-cols-2" : ""}`}>
                  {p.floorPlans.map((fp) => (
                    <figure key={fp.url}>
                      <a href={fp.url} target="_blank" rel="noopener" className="block overflow-hidden rounded-brand border border-line bg-white">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={fp.url} alt={fp.label ? `${fp.label} floor plan, ${p.title}` : `Floor plan of ${p.title}`} loading="lazy" className="h-auto w-full" />
                      </a>
                      {fp.label && <figcaption className="mt-2 text-sm">{fp.label}</figcaption>}
                    </figure>
                  ))}
                </div>
                <p className="mt-3 text-xs text-muted">Tap a plan to open it full size.</p>
              </section>
            )}

            {p.nearby.length > 0 && <section className="mt-12">
              <h2 className="text-2xl">Nearby</h2>
              <ul className="mt-4 divide-y divide-line border-y border-line text-sm">
                {p.nearby.map((n) => <li key={n.name} className="flex justify-between py-3"><span>{n.name}</span><span className="tabular text-muted">{n.distance}</span></li>)}
              </ul>
            </section>}

            <section className="mt-12 text-xs text-muted">
              <p>Listed by {site.name}.</p>
              <p className="mt-1">Areas and distances are as declared by the owner and approximate. Verify in the sale documents before payment.</p>
            </section>
          </div>

          <aside className="lg:col-span-4">
            <div className="sticky top-24 space-y-4">
              <div className="rounded-brand border border-line bg-white p-5">
                <h2 className="text-xl">Schedule a visit</h2>
                <p className="mb-4 mt-1 text-sm text-muted">Accompanied visits, usually within 24 hours.</p>
                <EnquiryForm variant="visit" subject={`${p.title}, ${p.locality}`} propertyId={p.id} />
              </div>
              <div className="flex items-center gap-4 rounded-brand border border-line bg-white p-5">
                <Logo size={48} />
                <div className="text-sm">
                  <p>Manav Narula</p>
                  <p className="text-muted">Principal advisor</p>
                  <div className="mt-2 flex gap-3">
                    <a href={site.phoneHref} className="inline-flex items-center gap-1 text-accent-ink hover:underline"><Icon name="phone" size={14} />Call</a>
                    <a href={site.whatsappHref} target="_blank" rel="noopener" className="inline-flex items-center gap-1 text-accent-ink hover:underline"><Icon name="whatsapp" size={14} />WhatsApp</a>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>

        <section className="mt-20">
          <h2 className="text-3xl">Similar properties</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {similarProperties(all, p).map((q) => <PropertyCard key={q.slug} p={q} fixed={false} />)}
          </div>
        </section>
      </Container>
    </>
  );
}
