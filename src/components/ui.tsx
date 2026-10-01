import Link from "next/link";
import Icon from "./Icon";

export function Container({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-[1280px] px-4 md:px-8 ${className}`}>{children}</div>;
}

export function Section({ children, className = "", id }: { children: React.ReactNode; className?: string; id?: string }) {
  return (
    <section id={id} className={`py-14 md:py-24 ${className}`}>
      <Container>{children}</Container>
    </section>
  );
}

export function SectionTitle({ title, intro, action }: { title: string; intro?: string; action?: { label: string; href: string } }) {
  return (
    <div className="mb-8 flex flex-col gap-3 md:mb-12 md:flex-row md:items-end md:justify-between">
      <div>
        <h2 className="text-3xl md:text-4xl">{title}</h2>
        {intro && <p className="mt-2 max-w-2xl text-muted">{intro}</p>}
      </div>
      {action && (
        <Link href={action.href} className="inline-flex items-center gap-1 text-sm text-accent-ink hover:underline">
          {action.label}
          <Icon name="arrowRight" size={16} />
        </Link>
      )}
    </div>
  );
}

type BtnProps = { href?: string; children: React.ReactNode; variant?: "primary" | "secondary" | "ghost"; className?: string; type?: "button" | "submit"; onClick?: () => void; disabled?: boolean };

const btnBase = "inline-flex items-center justify-center gap-2 rounded-brand px-5 py-3 text-sm font-medium transition-colors";
const variants = {
  primary: "bg-accent text-white hover:bg-accent-ink",
  secondary: "border border-ink text-ink hover:bg-ink hover:text-white",
  ghost: "border border-line text-ink hover:border-ink",
};

export function Button({ href, children, variant = "primary", className = "", type = "button", onClick, disabled }: BtnProps) {
  const cls = `${btnBase} ${variants[variant]} ${className}`;
  if (href) return <Link href={href} className={cls}>{children}</Link>;
  return (
    <button type={type} className={cls} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

export function Tag({ children }: { children: React.ReactNode }) {
  return <span className="inline-block rounded-brand border border-line bg-bg px-2 py-0.5 text-xs text-ink">{children}</span>;
}

export const trustLabels: Record<string, string> = {
  verified: "Verified title",
  rera: "RERA registered",
  visit: "Site visit available",
};

export function TrustRow({ items, size = "sm" }: { items: string[]; size?: "sm" | "md" }) {
  return (
    <ul className={`flex flex-wrap gap-x-4 gap-y-1 ${size === "sm" ? "text-xs" : "text-sm"} text-ink`}>
      {items.map((t) => (
        <li key={t} className="flex items-center gap-1.5">
          <Icon name="shield" size={size === "sm" ? 14 : 18} className="text-accent" />
          {trustLabels[t] ?? t}
        </li>
      ))}
    </ul>
  );
}

export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-muted">
      <ol className="flex flex-wrap items-center gap-1">
        <li><Link href="/" className="hover:text-ink">Home</Link></li>
        {items.map((it, i) => (
          <li key={i} className="flex items-center gap-1">
            <span aria-hidden="true">/</span>
            {it.href ? <Link href={it.href} className="hover:text-ink">{it.label}</Link> : <span className="text-ink">{it.label}</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function GoogleRating({ rating, reviews, className = "" }: { rating: number; reviews: number; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 text-sm ${className}`}>
      <Icon name="google" size={18} className="text-ink" />
      <span className="flex items-center gap-1">
        <Icon name="star" size={14} className="text-accent" />
        <strong className="tabular">{rating.toFixed(1)}</strong>
        <span className="text-muted">({reviews} Google reviews)</span>
      </span>
    </span>
  );
}

export function Field({ label, children, htmlFor }: { label: string; children: React.ReactNode; htmlFor: string }) {
  return (
    <label htmlFor={htmlFor} className="block text-sm">
      <span className="mb-1.5 block text-ink">{label}</span>
      {children}
    </label>
  );
}

export const inputCls = "w-full rounded-brand border border-line bg-white px-3 py-2.5 text-sm text-ink placeholder:text-muted focus:border-ink";
