import Link from "next/link";
import FaqSearch from "@/components/FaqSearch";
import { Breadcrumbs, Section } from "@/components/ui";
import { getFaqGroups } from "@/lib/site-data";

export const revalidate = 60;

export const metadata = { title: "FAQ", description: "Answers on buying, selling, renting, legal, home loans and NRI property questions in Jalandhar." };

export default async function FaqPage() {
  const faqGroups = await getFaqGroups();
  const schema = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqGroups.flatMap((g) => g.items.map((i) => ({ "@type": "Question", name: i.q, acceptedAnswer: { "@type": "Answer", text: i.a } }))) };
  return (
    <Section>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <Breadcrumbs items={[{ label: "FAQ" }]} />
      <h1 className="mt-6 text-4xl md:text-5xl">Questions we are asked most</h1>
      <p className="mt-3 mb-8 max-w-2xl text-muted">If yours is not here, <Link href="/contact" className="text-accent-ink hover:underline">send it to us</Link> and we will answer within working hours.</p>
      <div className="max-w-3xl"><FaqSearch groups={faqGroups} /></div>
    </Section>
  );
}
