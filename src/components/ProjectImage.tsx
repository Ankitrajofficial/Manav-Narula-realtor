import Image from "next/image";
import { unsplash } from "@/lib/format";

/**
 * A project's photo, or a branded placeholder while we have no images we may use (e.g. Mexmon projects until the
 * developer gives permission). Fills its positioned parent.
 */
export default function ProjectImage({ src, name, developer, sizes, priority = false, bare = false, alt }: { src: string | null; name: string; developer: string; sizes: string; priority?: boolean; /** Background only, for a hero that sets its own title. */ bare?: boolean; alt?: string }) {
  if (src) return <Image src={unsplash(src, 1600, 900)} alt={alt || name} fill priority={priority} sizes={sizes} className="object-cover" />;
  return (
    <div role="img" aria-label={`${name}: photos coming soon`} className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden bg-[#13204a] px-6 text-center text-white">
      <svg aria-hidden="true" className="absolute inset-0 h-full w-full opacity-[0.12]" preserveAspectRatio="xMidYMax slice" viewBox="0 0 400 300">
        <g fill="#c9a24a">
          <rect x="40" y="120" width="44" height="180" /><rect x="96" y="70" width="56" height="230" /><rect x="164" y="150" width="40" height="150" />
          <rect x="216" y="40" width="64" height="260" /><rect x="292" y="110" width="48" height="190" /><rect x="350" y="170" width="36" height="130" />
        </g>
      </svg>
      {!bare && (
        <>
          <span className="relative text-[11px] uppercase tracking-[0.18em] text-[#c9a24a]">{developer}</span>
          <span className="relative mt-2 font-heading text-2xl leading-tight">{name}</span>
          <span className="relative mt-3 text-xs text-white/70">Photos coming soon</span>
        </>
      )}
    </div>
  );
}
