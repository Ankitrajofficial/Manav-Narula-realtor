"use client";
import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Icon from "@/components/Icon";
import type { ProjectUnit } from "@/data/projects";
import { unsplash } from "@/lib/format";

/**
 * A project's unit types as tabs (2 BHK | 3 BHK | Affordable | Boutique). Every panel is in the HTML so search engines read
 * them all; each links to the unit's own page. Arrow keys move between tabs.
 */
export default function UnitTabs({ units, projectSlug, projectName, active }: { units: ProjectUnit[]; projectSlug: string; projectName: string; active?: string }) {
  const [current, setCurrent] = useState(Math.max(0, units.findIndex((u) => u.slug === active)));
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const go = (i: number) => { const n = (i + units.length) % units.length; setCurrent(n); tabs.current[n]?.focus(); };
  const id = (u: ProjectUnit, part: string) => `unit-${u.slug}-${part}`;

  return (
    <div>
      <div role="tablist" aria-label={`${projectName} unit types`} className="flex gap-1 overflow-x-auto border-b border-line">
        {units.map((u, i) => (
          <button key={u.slug} ref={(el) => { tabs.current[i] = el; }} type="button" role="tab" id={id(u, "tab")} aria-controls={id(u, "panel")}
            aria-selected={i === current} tabIndex={i === current ? 0 : -1} onClick={() => setCurrent(i)}
            onKeyDown={(e) => { if (e.key === "ArrowRight") go(i + 1); else if (e.key === "ArrowLeft") go(i - 1); else if (e.key === "Home") go(0); else if (e.key === "End") go(units.length - 1); }}
            className={`-mb-px shrink-0 border-b-2 px-4 py-2.5 text-sm ${i === current ? "border-accent font-medium text-ink" : "border-transparent text-muted hover:text-ink"}`}>
            {u.label}
          </button>
        ))}
      </div>
      {units.map((u, i) => {
        const plans = u.media.filter((m) => m.kind === "floor-plan" || m.kind === "master-plan");
        const shots = u.media.filter((m) => !plans.includes(m));
        return (
          <div key={u.slug} role="tabpanel" id={id(u, "panel")} aria-labelledby={id(u, "tab")} hidden={i !== current} tabIndex={0} className="pt-5">
            <h3 className="text-xl">{u.name} at {projectName}</h3>
            {u.description[0] && <p className="mt-2 text-sm text-ink/85">{u.description[0]}</p>}
            <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 rounded-brand border border-line bg-white p-4 text-sm sm:grid-cols-3">
              <div><dt className="text-xs text-muted">Configurations</dt><dd className="mt-0.5">{u.configurations.join(", ") || "On request"}</dd></div>
              <div><dt className="text-xs text-muted">Sizes</dt><dd className="mt-0.5 tabular">{u.sizeRange || "On request"}</dd></div>
              {u.rera && <div><dt className="text-xs text-muted">Project RERA No.</dt><dd className="mt-0.5 tabular">{u.rera}</dd></div>}
            </dl>
            {(plans.length > 0 || shots.length > 0) && (
              <ul className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
                {[...plans, ...shots].map((m) => (
                  <li key={m.url}>
                    <a href={m.url} target="_blank" rel="noopener" className="block overflow-hidden rounded-brand border border-line bg-white hover:border-ink">
                      <span className="relative block aspect-[4/3]"><Image src={unsplash(m.url, 800, 600)} alt={m.alt} fill sizes="(min-width: 768px) 260px, 50vw" className={plans.includes(m) ? "object-contain p-2" : "object-cover"} /></span>
                      {plans.includes(m) && <span className="block border-t border-line px-3 py-2 text-xs">{m.alt}</span>}
                    </a>
                  </li>
                ))}
              </ul>
            )}
            {u.slug !== active && (
              <Link href={`/projects/${projectSlug}/${u.slug}`} className="mt-4 inline-flex items-center gap-1 text-sm text-accent-ink hover:underline">
                More about {u.name.toLowerCase().startsWith(u.label.toLowerCase()) ? u.name : `${u.label} homes`} at {projectName}<Icon name="arrowRight" size={14} />
              </Link>
            )}
          </div>
        );
      })}
    </div>
  );
}
