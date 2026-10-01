import Link from "next/link";

export default function EmptyState({ text, action }: { text: string; action?: { label: string; href: string } }) {
  return (
    <div className="rounded-brand border border-dashed border-line bg-white p-10 text-center">
      <p className="text-sm text-muted">{text}</p>
      {action && <Link href={action.href} className="mt-4 inline-flex rounded-brand bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-ink">{action.label}</Link>}
    </div>
  );
}
