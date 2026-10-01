import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import EnquiryForm from "@/components/EnquiryForm";
import ShareButtons from "@/components/ShareButtons";
import Icon from "@/components/Icon";
import { Breadcrumbs, Container, Tag } from "@/components/ui";
import { getProjectBySlug } from "@/lib/site-data";

export const revalidate = 60;
import { unsplash } from "@/lib/format";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = await getProjectBySlug((await params).slug);
  if (!p) return {};
  return { title: `${p.name}, ${p.locality}`, description: p.description[0] };
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const p = await getProjectBySlug((await params).slug);
  if (!p) notFound();
  return (
    <>
      <div className="relative h-[360px] border-b border-line bg-line md:h-[480px]">
        <Image src={unsplash(p.image, 1600, 900)} alt={p.name} fill priority sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-ink/45" />
        <Container className="relative flex h-full flex-col justify-end pb-10 text-white">
          <Tag>{p.status}</Tag>
          <h1 className="mt-3 text-4xl md:text-6xl">{p.name}</h1>
          <p className="mt-2">{p.locality}, Jalandhar · by {p.developer}</p>
        </Container>
      </div>
      <Container className="py-8 md:py-12">
        <Breadcrumbs items={[{ label: "Projects", href: "/projects" }, { label: p.name }]} />
        <div className="mt-8 grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <div className="flex items-center justify-between gap-4">
              <p className="text-2xl">From <span className="font-bold tabular">{p.startingPrice}</span> <span className="text-base text-muted">· possession {p.possession}</span></p>
              <ShareButtons title={p.name} />
            </div>
            <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-5 border-y border-line py-6 sm:grid-cols-3">
              {p.keyFacts.map((f) => <div key={f.label}><dt className="text-xs text-muted">{f.label}</dt><dd className="text-sm tabular">{f.value}</dd></div>)}
            </dl>
            <section className="mt-10">
              <div className="prose-article text-ink/85">{p.description.map((t, i) => <p key={i}>{t}</p>)}</div>
            </section>
            <section className="mt-12">
              <h2 className="text-2xl">Configurations</h2>
              <table className="mt-4 w-full border-y border-line text-sm">
                <thead className="text-left text-muted"><tr><th className="py-3 font-normal">Type</th><th className="py-3 font-normal">Area</th><th className="py-3 text-right font-normal">Price</th></tr></thead>
                <tbody className="divide-y divide-line">
                  {p.configurations.map((c) => <tr key={c.type}><td className="py-3">{c.type}</td><td className="py-3 tabular">{c.area}</td><td className="py-3 text-right font-bold tabular">{c.price}</td></tr>)}
                </tbody>
              </table>
            </section>
            <section className="mt-12">
              <h2 className="text-2xl">Construction progress</h2>
              <div className="mt-4 flex items-center justify-between text-sm"><span className="text-muted">Overall</span><span className="tabular">{p.progress}%</span></div>
              <div className="mt-2 h-2 w-full rounded-brand bg-line"><div className="h-2 rounded-brand bg-accent" style={{ width: `${p.progress}%` }} /></div>
              <ol className="mt-5 grid grid-cols-5 gap-2 text-xs">
                {p.milestones.map((m) => (
                  <li key={m.label} className="flex flex-col items-start gap-1.5">
                    <span className={`flex h-5 w-5 items-center justify-center rounded-full border ${m.done ? "border-accent bg-accent text-white" : "border-line bg-white"}`}>{m.done && <Icon name="check" size={12} />}</span>
                    <span className={m.done ? "text-ink" : "text-muted"}>{m.label}</span>
                  </li>
                ))}
              </ol>
            </section>
            <section className="mt-12">
              <h2 className="text-2xl">Amenities</h2>
              <ul className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">{p.amenities.map((a) => <li key={a} className="flex items-center gap-2"><Icon name="check" size={16} className="text-accent" />{a}</li>)}</ul>
            </section>
            <section className="mt-12">
              <h2 className="text-2xl">Master plan and gallery</h2>
              <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
                {p.gallery.map((g, i) => <div key={g + i} className="relative aspect-[4/3] overflow-hidden rounded-brand border border-line bg-line"><Image src={unsplash(g, 800, 600)} alt={`${p.name} view ${i + 1}`} fill sizes="400px" className="object-cover" /></div>)}
              </div>
              <a href={p.brochure} download className="mt-6 inline-flex items-center gap-2 rounded-brand border border-ink px-5 py-3 text-sm hover:bg-ink hover:text-white"><Icon name="download" size={16} />Download brochure (PDF)</a>
            </section>
            <p className="mt-12 text-xs text-muted">RERA registration: {p.rera}. Prices and possession dates are as declared by the developer and subject to the builder-buyer agreement.</p>
          </div>
          <aside className="lg:col-span-4">
            <div className="sticky top-24 rounded-brand border border-line bg-white p-5">
              <h2 className="text-xl">Enquire about {p.name}</h2>
              <p className="mb-4 mt-1 text-sm text-muted">Current availability, payment plan and a site visit.</p>
              <EnquiryForm variant="project" subject={p.name} submitLabel="Send enquiry" projectId={p.id} />
            </div>
          </aside>
        </div>
      </Container>
    </>
  );
}
