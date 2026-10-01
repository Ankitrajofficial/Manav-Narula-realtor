import Image from "next/image";
import Link from "next/link";
import type { Property } from "@/data/properties";
import { formatArea, formatPrice, unsplash } from "@/lib/format";
import { Tag, TrustRow } from "./ui";

function specLine(p: Property) {
  const parts: string[] = [];
  if (p.bhk) parts.push(`${p.bhk} BHK`);
  parts.push(formatArea(p.area, p.areaUnit));
  if (!p.bhk) parts.unshift(p.type);
  parts.push(p.locality);
  return parts.join(" · ");
}

export default function PropertyCard({ p, fixed = true }: { p: Property; fixed?: boolean }) {
  return (
    <Link
      href={`/properties/${p.slug}`}
      className={`group block shrink-0 snap-start overflow-hidden rounded-brand border border-line bg-white ${fixed ? "w-[320px]" : "w-full"}`}
    >
      <div className="relative aspect-[4/3] bg-line">
        <Image src={unsplash(p.images[0], 800, 600)} alt={p.title} fill sizes="320px" className="object-cover" />
        <span className="absolute left-3 top-3"><Tag>{p.status}</Tag></span>
      </div>
      <div className="p-4">
        <h3 className="truncate text-lg leading-snug group-hover:text-accent-ink">{p.title}</h3>
        <p className="mt-1 truncate text-sm text-muted">{specLine(p)}</p>
        <p className="mt-2 line-clamp-2 text-sm text-ink/80">{p.description}</p>
        <p className="mt-3 text-lg font-bold tabular">{formatPrice(p.price, p.purpose)}</p>
        <div className="mt-3 border-t border-line pt-3">
          <TrustRow items={p.trust} />
        </div>
      </div>
    </Link>
  );
}
