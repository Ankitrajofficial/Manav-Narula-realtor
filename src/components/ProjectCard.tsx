import Image from "next/image";
import Link from "next/link";
import type { Project } from "@/data/projects";
import { unsplash } from "@/lib/format";
import { Tag } from "./ui";

export default function ProjectCard({ p, showProgress = false }: { p: Project; showProgress?: boolean }) {
  return (
    <Link href={`/projects/${p.slug}`} className="group block overflow-hidden rounded-brand border border-line bg-white">
      <div className="relative aspect-[4/3] bg-line">
        <Image src={unsplash(p.image, 800, 600)} alt={p.name} fill sizes="(min-width: 768px) 400px, 100vw" className="object-cover" />
        <span className="absolute left-3 top-3"><Tag>{p.status}</Tag></span>
      </div>
      <div className="p-4">
        <h3 className="text-xl leading-snug group-hover:text-accent-ink">{p.name}</h3>
        <p className="mt-1 text-sm text-muted">{p.locality} · {p.developer}</p>
        <p className="mt-2 text-sm">{p.configurations.map((c) => c.type).join(", ")}</p>
        <dl className="mt-3 grid grid-cols-2 gap-2 border-t border-line pt-3 text-sm">
          <div><dt className="text-muted">Starting</dt><dd className="font-bold tabular">{p.startingPrice}</dd></div>
          <div><dt className="text-muted">Possession</dt><dd className="tabular">{p.possession}</dd></div>
        </dl>
        {showProgress && (
          <div className="mt-3">
            <div className="flex justify-between text-xs text-muted"><span>Progress</span><span className="tabular">{p.progress}%</span></div>
            <div className="mt-1 h-1.5 w-full rounded-brand bg-line"><div className="h-1.5 rounded-brand bg-accent" style={{ width: `${p.progress}%` }} /></div>
          </div>
        )}
      </div>
    </Link>
  );
}
