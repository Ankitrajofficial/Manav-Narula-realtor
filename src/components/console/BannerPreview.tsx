/** Renders a banner the way the public home page shows it: carousel (16:9, dark overlay) or the wide offer strip. */
export default function BannerPreview({ group, image, headline, line, ctaLabel, imageOnly = false, compact = false }: { group: string; image?: string | null; headline: string; line?: string | null; ctaLabel?: string | null; imageOnly?: boolean; compact?: boolean }) {
  const isOffer = group === "offer";
  return (
    <div className={`relative overflow-hidden rounded-brand border border-line bg-ink ${isOffer ? (compact ? "h-32" : "h-48") : compact ? "h-40" : "h-64"}`}>
      {image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover" />
      )}
      {!imageOnly && <>
      <div className={`absolute inset-0 ${isOffer ? "bg-ink/50" : "bg-ink/45"}`} />
      <div className={`relative flex h-full flex-col text-white ${isOffer ? "justify-center px-6" : "justify-end px-6 pb-6"}`}>
        {isOffer && <p className="text-[10px] uppercase tracking-wide">Offer</p>}
        <p className={`font-heading leading-tight ${compact ? "text-lg" : "text-2xl"}`}>{headline || "Headline"}</p>
        {line && <p className={`mt-1 max-w-md ${compact ? "text-xs" : "text-sm"}`}>{line}</p>}
        {ctaLabel && <span className={`mt-3 inline-flex w-fit rounded-brand bg-accent font-medium ${compact ? "px-3 py-1 text-xs" : "px-4 py-2 text-sm"}`}>{ctaLabel}</span>}
      </div>
      </>}
    </div>
  );
}
