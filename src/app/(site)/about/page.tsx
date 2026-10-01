import Link from "next/link";
import Icon from "@/components/Icon";
import { Breadcrumbs, GoogleRating, Section, SectionTitle } from "@/components/ui";
import { aboutCommitments, certifications, milestones, site, team } from "@/data/site";

export const metadata = { title: "About", description: "Manav Narula Realtor has advised families in Jalandhar since 2012. Our story, work ethics, team and certifications." };

export default function AboutPage() {
  return (
    <>
      <Section className="border-b border-line">
        <Breadcrumbs items={[{ label: "About" }]} />
        <div className="mt-6 grid gap-10 md:grid-cols-12">
          <div className="md:col-span-7">
            <h1 className="text-4xl md:text-5xl">Property advice in Jalandhar since {site.foundedYear}</h1>
            <div className="prose-article mt-6 text-ink/85">
              <p>Manav Narula opened this office on 66 Feet Road in {site.foundedYear} after watching two families in his own lane lose money on plots with unclear titles. The idea was simple: check the paperwork first, price honestly, and be present at every visit.</p>
              <p>Fourteen years later the office is still on the same road. We have handed keys to over 500 families, built a legal desk with an empanelled advocate, and started an NRI desk for owners who live in Canada, the UK and Australia.</p>
            </div>
          </div>
          <div className="md:col-span-4 md:col-start-9">
            <h2 className="text-xl">Our mission</h2>
            <p className="mt-3 text-muted">To make every property deal in Jalandhar as clean and predictable as buying from a trusted shop: clear price, clear paperwork, no surprises.</p>
            <GoogleRating rating={site.rating} reviews={site.reviews} className="mt-6" />
          </div>
        </div>
      </Section>

      <Section>
        <SectionTitle title="Our work ethics" intro="Six commitments, the same on every deal, whatever its size." />
        <ol className="grid gap-x-10 gap-y-8 md:grid-cols-2 lg:grid-cols-3">
          {aboutCommitments.map((c, i) => (
            <li key={c.title} className="border-t border-line pt-4">
              <p className="text-xs tabular text-accent-ink">0{i + 1}</p>
              <h3 className="mt-2 text-xl">{c.title}</h3>
              <p className="mt-2 text-sm text-muted">{c.text}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section className="border-y border-line bg-white">
        <SectionTitle title="Milestones" />
        <ol className="relative border-l border-line pl-8">
          {milestones.map((m) => (
            <li key={m.year} className="relative pb-10 last:pb-0">
              <span className="absolute -left-[37px] top-1 h-3 w-3 rounded-full border-2 border-accent bg-white" />
              <p className="text-sm tabular text-muted">{m.year}</p>
              <p className="mt-1 max-w-xl">{m.text}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section>
        <SectionTitle title="The team" intro="Four people, one point of contact for you throughout." />
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {team.map((t) => (
            <li key={t.name} className="rounded-brand border border-line bg-white p-5">
              <span className="flex h-14 w-14 items-center justify-center rounded-brand border border-ink font-heading text-lg">{t.initials}</span>
              <h3 className="mt-4 text-xl">{t.name}</h3>
              <p className="text-sm text-accent-ink">{t.role}</p>
              <p className="mt-2 text-sm text-muted">{t.line}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section className="border-y border-line bg-white">
        <SectionTitle title="Certifications" />
        <ul className="grid gap-8 md:grid-cols-2">
          {certifications.map((c) => (
            <li key={c.title} className="flex gap-4">
              <Icon name="shield" size={24} className="mt-0.5 shrink-0 text-accent" />
              <div><h3 className="text-lg">{c.title}</h3><p className="mt-1 text-sm text-muted">{c.text}</p></div>
            </li>
          ))}
        </ul>
      </Section>

      <Section>
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-3xl">Talk to us about your property</h2>
            <p className="mt-2 text-muted">A call costs nothing and we will tell you plainly whether we can help.</p>
          </div>
          <div className="flex gap-3">
            <Link href="/contact" className="rounded-brand bg-accent px-5 py-3 text-sm font-medium text-white hover:bg-accent-ink">Send enquiry</Link>
            <a href={site.phoneHref} className="rounded-brand border border-ink px-5 py-3 text-sm hover:bg-ink hover:text-white">Call {site.phone}</a>
          </div>
        </div>
      </Section>
    </>
  );
}
