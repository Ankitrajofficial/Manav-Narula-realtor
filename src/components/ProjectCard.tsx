import Link from "next/link";
import type { Project } from "@/data/projects";
import { formatPrice } from "@/lib/format";
import ProjectImage from "./ProjectImage";
import { Tag } from "./ui";
import { developerCredit } from "@/data/site";

/** "2 BHK, 3 BHK" -> "2 & 3 BHK"; other types listed as they are. */
export function configSummary(types: string[]): string {
  const unique = [...new Set(types)];
  const bhk = unique.filter((t) => /^\d+(\+\d+)?\s*BHK$/i.test(t)).map((t) => t.replace(/\s*BHK$/i, ""));
  const rest = unique.filter((t) => !/^\d+(\+\d+)?\s*BHK$/i.test(t));
  const parts = [...(bhk.length ? [`${bhk.length > 1 ? `${bhk.slice(0, -1).join(", ")} & ${bhk[bhk.length - 1]}` : bhk[0]} BHK`] : []), ...rest];
  return parts.join(" · ");
}
export const projectPrice = (p: Project) => (p.priceFrom ? `From ${formatPrice(p.priceFrom)}` : "Price on request");
export const projectPlace = (p: Project) => [p.locality, p.city && p.city !== "Jalandhar" ? p.city : null].filter(Boolean).join(", ");

/** Card for a developer project: the developer named and credited, and the project RERA. We are the developer's sales agents. */
export default function ProjectCard({ p, fixed = false }: { p: Project; fixed?: boolean }) {
  // The title link stretches over the whole card; the developer link sits above it so both can be clicked.
  return (
    <div className={`group relative flex shrink-0 snap-start flex-col overflow-hidden rounded-brand border border-[#c9c9c6] bg-white transition-colors hover:border-ink ${fixed ? "w-[320px]" : "w-full"}`}>
      <div className="relative aspect-[4/3] bg-line">
        <ProjectImage src={p.image} name={p.name} developer={p.developer} sizes="(min-width: 768px) 400px, 100vw" />
        <span className="absolute left-3 top-3"><Tag>{p.status}</Tag></span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-xl leading-snug group-hover:text-accent-ink">
          <Link href={`/projects/${p.slug}`} className="after:absolute after:inset-0 after:content-['']">{p.name}</Link>
        </h3>
        {p.developer && (p.developerSlug
          ? <Link href={`/developers/${p.developerSlug}`} className="relative z-10 mt-0.5 self-start text-sm text-muted hover:text-ink hover:underline">By {p.developer}</Link>
          : <p className="mt-0.5 text-sm text-muted">By {p.developer}</p>)}
        <p className="mt-1 text-sm text-muted">{[configSummary(p.configurations.map((c) => c.type)), projectPlace(p)].filter(Boolean).join(" · ")}</p>
        <p className="mt-3 text-lg font-bold">{projectPrice(p)}</p>
        <div className="mt-auto border-t border-line pt-3 text-xs leading-relaxed text-muted">
          <p>Developed by <span className="text-ink">{p.developer}</span>. {developerCredit}</p>
          {/* Only a real registration number is shown; projects still waiting for theirs show no RERA line. */}
          {p.rera && <p className="mt-0.5 tabular">Project RERA No.: {p.rera}</p>}
        </div>
      </div>
    </div>
  );
}
