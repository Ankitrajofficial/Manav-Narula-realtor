import Icon from "@/components/Icon";

export default function ReportSection({ title, description, report, from, to, children }: { title: string; description?: string; report: string; from: string; to: string; children: React.ReactNode }) {
  const base = `/admin/reports/export?report=${report}&from=${from}&to=${to}`;
  return (
    <section className="rounded-brand border border-line bg-white p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base">{title}</h2>
          {description && <p className="mt-0.5 text-xs text-muted">{description}</p>}
        </div>
        <div className="flex gap-2">
          <a href={`${base}&format=csv`} className="inline-flex items-center gap-1.5 rounded-brand border border-line px-3 py-1.5 text-xs hover:border-ink"><Icon name="download" size={12} />Export CSV</a>
          <a href={`${base}&format=pdf`} className="inline-flex items-center gap-1.5 rounded-brand border border-line px-3 py-1.5 text-xs hover:border-ink"><Icon name="file" size={12} />Export PDF</a>
        </div>
      </div>
      {children}
    </section>
  );
}
