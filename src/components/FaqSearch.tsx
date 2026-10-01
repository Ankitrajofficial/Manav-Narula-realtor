"use client";
import { useMemo, useState } from "react";
import Accordion from "./Accordion";
import Icon from "./Icon";
import { inputCls } from "./ui";

export default function FaqSearch({ groups }: { groups: { group: string; items: { q: string; a: string }[] }[] }) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return groups;
    return groups.map((g) => ({ ...g, items: g.items.filter((it) => it.q.toLowerCase().includes(t) || it.a.toLowerCase().includes(t)) })).filter((g) => g.items.length);
  }, [q, groups]);
  return (
    <div>
      <div className="relative max-w-xl">
        <Icon name="search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search questions, e.g. stamp duty" className={`${inputCls} pl-10`} aria-label="Search questions" />
      </div>
      <nav aria-label="FAQ groups" className="mt-6 flex flex-wrap gap-2 text-sm">
        {groups.map((g) => <a key={g.group} href={`#faq-${g.group.replace(/\s+/g, "-").toLowerCase()}`} className="rounded-brand border border-line bg-white px-3 py-1.5 hover:border-ink">{g.group}</a>)}
      </nav>
      <div className="mt-10 space-y-12">
        {filtered.map((g) => (
          <section key={g.group} id={`faq-${g.group.replace(/\s+/g, "-").toLowerCase()}`} className="scroll-mt-24">
            <h2 className="mb-4 text-2xl">{g.group}</h2>
            <Accordion items={g.items} />
          </section>
        ))}
        {filtered.length === 0 && <p className="text-muted">No question matches. Ask us directly on the contact page.</p>}
      </div>
    </div>
  );
}
