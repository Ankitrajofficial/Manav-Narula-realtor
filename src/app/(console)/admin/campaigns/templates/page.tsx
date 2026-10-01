import Link from "next/link";
import PageHeader from "@/components/console/PageHeader";
import ConfirmButton from "@/components/console/ConfirmButton";
import EmptyState from "@/components/console/EmptyState";
import Icon from "@/components/Icon";
import { requireUser } from "@/lib/auth";
import { listTemplates } from "@/lib/queries/campaigns";
import { formatShortDate } from "@/lib/format";
import { deleteTemplateAction } from "../actions";

export default async function TemplatesPage() {
  await requireUser("admin");
  const templates = await listTemplates();
  return (
    <>
      <PageHeader title="Saved templates" description="Messages and attachments you reuse. Start a new campaign from any of them." actions={<Link href="/admin/campaigns" className="text-sm text-muted hover:text-ink">Back to campaigns</Link>} />
      {templates.length === 0 ? <EmptyState text="No saved templates yet. Open a campaign and press Save as template." action={{ label: "New campaign", href: "/admin/campaigns/new" }} /> : (
        <ul className="divide-y divide-line rounded-brand border border-line bg-white">
          {templates.map((t) => (
            <li key={t.id} className="flex flex-wrap items-center gap-4 px-4 py-3">
              <div className="min-w-[200px] flex-1">
                <p className="text-sm">{t.name} <span className="ml-2 text-xs text-muted">{t.message_type === "template" ? `Meta template ${t.template_name}` : "Text"}{t.media_type !== "none" ? ` · ${t.media_type}` : ""}{t.variants?.length ? ` · ${t.variants.length} variants` : ""}</span></p>
                <p className="mt-0.5 line-clamp-2 text-xs text-muted">{t.message}</p>
              </div>
              <span className="text-xs tabular text-muted">{formatShortDate(t.created_at)}</span>
              <Link href={`/admin/campaigns/new?template=${t.id}`} className="inline-flex items-center gap-1.5 rounded-brand bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-accent-ink"><Icon name="plus" size={14} />Use</Link>
              <form action={deleteTemplateAction}><input type="hidden" name="id" value={t.id} /><ConfirmButton label="Delete" confirmLabel="Delete template" /></form>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
