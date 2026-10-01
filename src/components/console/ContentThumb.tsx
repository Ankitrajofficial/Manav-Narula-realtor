/** Small thumbnail for console tables; plain img because uploads and remote URLs vary. */
export default function ContentThumb({ src, className = "h-9 w-12" }: { src: string | null | undefined; className?: string }) {
  if (!src) return <span className={`block rounded-brand border border-line bg-bg ${className}`} />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" className={`rounded-brand border border-line object-cover ${className}`} />;
}
