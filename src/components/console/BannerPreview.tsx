/**
 * Renders a banner the way the public home page shows it. Carousel: the hero in its desktop (16:7) or phone (4:5) frame,
 * with the focal point, overlay theme and text over the image. Offer: the wide offer strip.
 */
export default function BannerPreview({ group, image, mobileImage, eyebrow, headline, line, ctaLabel, imageOnly = false, focalX = 0.5, focalY = 0.5, theme = "dark", frame = "desktop", compact = false }: {
  group: string; image?: string | null; mobileImage?: string | null; eyebrow?: string | null; headline: string; line?: string | null; ctaLabel?: string | null;
  imageOnly?: boolean; focalX?: number; focalY?: number; theme?: "dark" | "light"; frame?: "desktop" | "mobile"; compact?: boolean;
}) {
  if (group === "offer") {
    return (
      <div className={`relative overflow-hidden rounded-brand border border-line bg-ink ${compact ? "h-32" : "h-48"}`}>
        {image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover" />
        )}
        <div className="absolute inset-0 bg-ink/50" />
        <div className="relative flex h-full flex-col justify-center px-6 text-white">
          <p className="text-[10px] uppercase tracking-wide">Offer</p>
          <p className={`font-heading leading-tight ${compact ? "text-lg" : "text-2xl"}`}>{headline || "Headline"}</p>
          {line && <p className={`mt-1 max-w-md ${compact ? "text-xs" : "text-sm"}`}>{line}</p>}
          {ctaLabel && <span className={`mt-3 inline-flex w-fit rounded-brand bg-accent font-medium ${compact ? "px-3 py-1 text-xs" : "px-4 py-2 text-sm"}`}>{ctaLabel}</span>}
        </div>
      </div>
    );
  }
  const mobile = frame === "mobile";
  const src = mobile ? mobileImage || image : image;
  const dark = theme !== "light";
  return (
    <div className={`relative overflow-hidden rounded-brand border border-line bg-ink ${mobile ? "aspect-[4/5]" : "aspect-[16/7]"}`}>
      {src && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: `${focalX * 100}% ${focalY * 100}%` }} />
      )}
      {!imageOnly && (
        <>
          <div className={`absolute inset-0 bg-linear-to-t ${dark ? "from-black/65 via-black/25 to-transparent" : "from-bg/90 via-bg/40 to-transparent"}`} />
          <div className={`absolute inset-x-0 bottom-0 ${compact ? "p-3" : mobile ? "p-4 pb-8" : "p-5"} ${dark ? "text-white" : "text-ink"}`}>
            {eyebrow && <p className="text-[9px] font-medium uppercase tracking-[0.18em]">{eyebrow}</p>}
            <p className={`mt-1 line-clamp-2 font-heading leading-tight ${compact ? "text-base" : mobile ? "text-xl" : "text-2xl"}`}>{headline || "Headline"}</p>
            {line && !compact && <p className="mt-1 truncate text-xs">{line}</p>}
            {ctaLabel && <span className={`mt-2 inline-flex w-fit rounded-brand bg-accent font-medium text-white ${compact ? "px-2.5 py-1 text-[10px]" : "px-3 py-1.5 text-xs"}`}>{ctaLabel}</span>}
          </div>
        </>
      )}
    </div>
  );
}
