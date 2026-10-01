import Link from "next/link";

export default function StatTile({ label, value, hint, href }: { label: string; value: string | number; hint?: string; href?: string }) {
  const body = (
    <>
      <p className="text-xs uppercase tracking-[0.08em] text-muted">{label}</p>
      <p className="mt-2 text-2xl tabular">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </>
  );
  const cls = "block rounded-brand border border-line bg-white p-4";
  return href ? <Link href={href} className={`${cls} hover:border-ink`}>{body}</Link> : <div className={cls}>{body}</div>;
}
