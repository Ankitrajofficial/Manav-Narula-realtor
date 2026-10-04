import Image from "next/image";

/** Hosts next.config.mjs lets the image optimizer fetch; anything else is shown as a plain img. */
const OPTIMIZABLE = /^(\/(?!\/)|https:\/\/(images\.unsplash\.com|i\.ytimg\.com)\/)/;

/**
 * Small thumbnail for console tables. Site files and uploads go through Next's image optimizer, so a list of properties
 * downloads a few KB per row instead of each full-size original (several MB for some project renders).
 */
export default function ContentThumb({ src, className = "h-9 w-12" }: { src: string | null | undefined; className?: string }) {
  if (!src) return <span className={`block rounded-brand border border-line bg-bg ${className}`} />;
  if (OPTIMIZABLE.test(src) && !/\.(pdf|mp4|3gp)$/i.test(src)) {
    return (
      <span className={`relative block overflow-hidden rounded-brand border border-line bg-bg ${className}`}>
        <Image src={src} alt="" fill sizes="96px" className="object-cover" />
      </span>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" loading="lazy" className={`rounded-brand border border-line object-cover ${className}`} />;
}
