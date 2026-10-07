import { Breadcrumbs, Section } from "@/components/ui";

export default function LegalPage({ title, updated, sections }: { title: string; updated: string; sections: { h: string; p: string[]; id?: string }[] }) {
  return (
    <Section>
      <Breadcrumbs items={[{ label: title }]} />
      <h1 className="mt-6 text-4xl md:text-5xl">{title}</h1>
      <p className="mt-2 text-sm text-muted">Last updated {updated}</p>
      <div className="prose-article mt-10">
        {sections.map((s) => (
          <div key={s.h} id={s.id} className="scroll-mt-24">
            <h2>{s.h}</h2>
            {s.p.map((t, i) => <p key={i} className="text-ink/85">{t}</p>)}
          </div>
        ))}
      </div>
    </Section>
  );
}
