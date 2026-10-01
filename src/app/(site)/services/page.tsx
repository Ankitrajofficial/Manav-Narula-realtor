import Link from "next/link";
import Icon from "@/components/Icon";
import { Breadcrumbs, Section } from "@/components/ui";
import { services } from "@/data/site";

export const metadata = { title: "Services", description: "Buying, selling and valuation, renting, legal and documentation, home loans, NRI services and property management in Jalandhar, with fees stated upfront." };

export default function ServicesPage() {
  return (
    <Section>
      <Breadcrumbs items={[{ label: "Services" }]} />
      <h1 className="mt-6 text-4xl md:text-5xl">Services</h1>
      <p className="mt-3 max-w-2xl text-muted">Seven things we do, what each includes and what it costs. Every fee is confirmed in writing before you pay anything.</p>
      <nav aria-label="Services" className="mt-8 flex flex-wrap gap-2 text-sm">
        {services.map((s) => <a key={s.id} href={`#${s.id}`} className="rounded-brand border border-line bg-white px-3 py-1.5 hover:border-ink">{s.title}</a>)}
      </nav>
      <div className="mt-12 divide-y divide-line border-t border-line">
        {services.map((s) => (
          <section key={s.id} id={s.id} className="grid scroll-mt-24 gap-6 py-12 md:grid-cols-12">
            <div className="md:col-span-4">
              <h2 className="text-3xl">{s.title}</h2>
            </div>
            <div className="md:col-span-5">
              <p className="text-ink/85">{s.description}</p>
              <ul className="mt-5 space-y-2 text-sm">
                {s.points.map((pt) => <li key={pt} className="flex gap-2"><Icon name="check" size={16} className="mt-0.5 shrink-0 text-accent" />{pt}</li>)}
              </ul>
              <p className="mt-5 text-sm text-muted">{s.fee}</p>
            </div>
            <div className="md:col-span-3 md:text-right">
              <Link href={s.id === "loans" ? "/home-loans" : `/contact?service=${s.id}`} className="inline-flex rounded-brand bg-accent px-5 py-3 text-sm font-medium text-white hover:bg-accent-ink">{s.id === "loans" ? "Home loan details" : "Enquire"}</Link>
            </div>
          </section>
        ))}
      </div>
    </Section>
  );
}
