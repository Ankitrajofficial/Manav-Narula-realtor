import Image from "next/image";
import { site } from "@/data/site";

/** Small card under a team member's article: passport-size photo, name and designation. */
export default function AuthorCard({ name, title, photo }: { name: string; title: string; photo?: string | null }) {
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("");
  return (
    <aside aria-label="About the author" className="mt-12 flex items-center gap-4 rounded-brand border border-line bg-white p-4 sm:p-5">
      <span className="relative block h-[92px] w-[72px] shrink-0 overflow-hidden rounded-brand border border-line bg-bg">
        {photo ? <Image src={photo} alt={`${name}, ${title}`} fill sizes="72px" className="object-cover" />
          : <span className="flex h-full w-full items-center justify-center font-heading text-xl text-muted">{initials}</span>}
      </span>
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-[0.12em] text-muted">Written by</p>
        <p className="mt-1 font-heading text-xl leading-tight">{name}</p>
        <p className="mt-0.5 text-sm text-accent-ink">{title}, {site.name}</p>
      </div>
    </aside>
  );
}
