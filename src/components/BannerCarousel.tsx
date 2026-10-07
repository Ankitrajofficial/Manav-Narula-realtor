"use client";
import { getImageProps } from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { unsplash } from "@/lib/format";
import type { Banner } from "@/lib/site-data";
import Icon from "./Icon";

const AUTOPLAY_MS = 6000;
const SWIPE_PX = 40;

/**
 * One slide's image with art direction: phones (up to 767 px) get the 4:5 mobile image, larger screens the 16:7 desktop
 * image. Without a mobile image, phones get the desktop image cropped around the focal point. Next serves both as WebP.
 */
function SlideImage({ banner: b, first }: { banner: Banner; first: boolean }) {
  const desktopSrc = unsplash(b.image, 2400, 1050);
  const loading = first ? ("eager" as const) : ("lazy" as const);
  const fetchPriority = first ? ("high" as const) : ("auto" as const);
  const desktop = getImageProps({ src: desktopSrc, alt: "", width: 2400, height: 1050, sizes: "100vw", loading, fetchPriority }).props;
  const mobile = getImageProps(b.mobileImage
    ? { src: b.mobileImage, alt: "", width: 1080, height: 1350, sizes: "100vw", loading, fetchPriority }
    : { src: desktopSrc, alt: "", width: 2400, height: 1050, sizes: "100vw", loading, fetchPriority }).props;
  const objectPosition = `${(b.focalX ?? 0.5) * 100}% ${(b.focalY ?? 0.5) * 100}%`;
  return (
    <picture>
      <source media="(max-width: 767px)" srcSet={mobile.srcSet} sizes="100vw" width={mobile.width} height={mobile.height} />
      <img {...desktop} alt="" className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition }} />
    </picture>
  );
}

/**
 * Home hero, managed under Admin → Banners. Phones: a 4:5 frame (at most 78% of the screen height) with the text over the
 * image at the bottom left, swipe to change slides. Larger screens: 16:7 (at most 80% of the screen height) with arrows.
 * Slides change every 6 s, pausing while a finger is on the hero or while a keyboard user has tabbed into it (clicks and
 * taps do not pause it), and not at all when the visitor prefers reduced motion.
 * A slide whose image carries its own text ("Image has its own text") shows the image alone, linked as a whole.
 */
export default function BannerCarousel({ banners }: { banners: Banner[] }) {
  const n = banners.length;
  const [i, setI] = useState(0);
  // Images load for slides already shown and the next one, so the rest wait until they are needed.
  const [seen, setSeen] = useState(() => new Set([0, 1]));
  const [touching, setTouching] = useState(false);
  const [focused, setFocused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const swiped = useRef(false);

  const go = (k: number) => {
    const t = ((k % n) + n) % n, after = (t + 1) % n;
    setI(t);
    setSeen((s) => (s.has(t) && s.has(after) ? s : new Set([...s, t, after])));
  };

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Restarts after every change, so a manual move gets a full 6 s too.
  useEffect(() => {
    if (n < 2 || touching || focused || reducedMotion) return;
    const t = setTimeout(() => go(i + 1), AUTOPLAY_MS);
    return () => clearTimeout(t);
  }, [i, n, touching, focused, reducedMotion]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!n) return null;
  const current = banners[i];
  const light = current.showText !== false && current.theme === "light";

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured banners"
      className="relative isolate aspect-[4/5] max-h-[78svh] w-full touch-pan-y overflow-hidden border-b border-line bg-ink md:aspect-[16/7] md:max-h-[80vh]"
      onPointerDown={(e) => {
        if (e.pointerType === "mouse") return;
        touchStart.current = { x: e.clientX, y: e.clientY };
        swiped.current = false;
        setTouching(true);
        // The finger may lift outside the hero, where its own pointerup never fires.
        const end = () => { setTouching(false); window.removeEventListener("pointerup", end); window.removeEventListener("pointercancel", end); };
        window.addEventListener("pointerup", end);
        window.addEventListener("pointercancel", end);
      }}
      onPointerUp={(e) => {
        const s = touchStart.current;
        touchStart.current = null;
        setTouching(false);
        if (!s || n < 2) return;
        const dx = e.clientX - s.x, dy = e.clientY - s.y;
        if (Math.abs(dx) > SWIPE_PX && Math.abs(dx) > Math.abs(dy) * 1.2) { swiped.current = true; go(i + (dx < 0 ? 1 : -1)); }
      }}
      onPointerCancel={() => { touchStart.current = null; setTouching(false); }}
      // A swipe that ends on a link must not also follow it.
      onClickCapture={(e) => { if (swiped.current) { e.preventDefault(); e.stopPropagation(); swiped.current = false; } }}
      // Only keyboard focus pauses: a clicked dot or arrow keeps focus, which would otherwise stop the slides for good.
      onFocus={(e) => setFocused(e.target.matches(":focus-visible"))}
      onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false); }}
    >
      {banners.map((b, k) => {
        const active = k === i;
        const Heading = k === 0 ? "h1" : "h2";
        const dark = b.theme !== "light";
        return (
          <div key={b.id} role="group" aria-roledescription="slide" aria-label={`${k + 1} of ${n}`} aria-hidden={!active} inert={!active}
            className={`absolute inset-0 transition-opacity duration-500 motion-reduce:transition-none ${active ? "opacity-100" : "pointer-events-none opacity-0"}`}>
            {seen.has(k) && <SlideImage banner={b} first={k === 0} />}
            {b.showText === false ? (
              <Link href={b.cta.href} className="absolute inset-0"><Heading className="sr-only">{b.headline}</Heading></Link>
            ) : (
              <>
                <div className={`absolute inset-0 bg-linear-to-t ${dark ? "from-black/65 via-black/25 to-transparent md:via-black/40" : "from-bg/90 via-bg/40 to-transparent md:via-bg/60"}`} />
                <div className="absolute inset-x-0 bottom-0">
                  <div className={`mx-auto max-w-[1280px] px-4 pb-[calc(var(--bottom-bar-h)+16px)] md:px-8 md:pb-24 ${dark ? "text-white" : "text-ink"}`}>
                    {b.eyebrow && <p className="text-[11px] font-medium uppercase tracking-[0.18em] md:text-xs">{b.eyebrow}</p>}
                    <Heading className="mt-2 line-clamp-2 max-w-3xl text-[clamp(28px,7vw,40px)] leading-[1.12] md:text-6xl md:leading-tight">{b.headline}</Heading>
                    {b.line && <p className="mt-2 max-w-xl truncate text-sm md:mt-4 md:whitespace-normal md:text-lg">{b.line}</p>}
                    <Link href={b.cta.href} className="mt-4 inline-flex min-h-11 w-fit items-center gap-2 rounded-brand bg-accent px-5 py-3 text-sm font-medium text-white hover:bg-accent-ink md:mt-6 md:px-6">
                      {b.cta.label}
                      <Icon name="arrowRight" size={16} />
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>
        );
      })}

      {n > 1 && (
        <div className="absolute inset-x-0 bottom-3 z-10 flex items-center justify-center gap-3 md:bottom-8">
          <button type="button" aria-label="Previous banner" onClick={() => go(i - 1)} className={`hidden h-8 w-8 items-center justify-center rounded-brand border md:flex ${light ? "border-ink/40 text-ink" : "border-white/60 text-white"}`}>
            <Icon name="arrowLeft" size={16} />
          </button>
          <div className="flex items-center">
            {banners.map((b, k) => (
              <button key={b.id} type="button" aria-label={`Banner ${k + 1}`} aria-current={k === i} onClick={() => go(k)} className="flex h-6 w-6 items-center justify-center">
                <span className={`h-2 w-2 rounded-full ${k === i ? "bg-accent" : light ? "bg-ink/40" : "bg-white/70"}`} />
              </button>
            ))}
          </div>
          <button type="button" aria-label="Next banner" onClick={() => go(i + 1)} className={`hidden h-8 w-8 items-center justify-center rounded-brand border md:flex ${light ? "border-ink/40 text-ink" : "border-white/60 text-white"}`}>
            <Icon name="arrowRight" size={16} />
          </button>
        </div>
      )}
    </section>
  );
}
