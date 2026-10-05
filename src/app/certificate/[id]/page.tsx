import Link from "next/link";
import { notFound } from "next/navigation";
import Logo from "@/components/Logo";
import { requireUser } from "@/lib/auth";
import { getCertificate } from "@/lib/queries/growth";
import { site } from "@/data/site";
import PrintButton from "./PrintButton";

export const metadata = { title: "Certificate", robots: { index: false } };

const longDate = (v: Date | string | null) => (v ? new Date(v).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" }) : "");

/** Printable certificate. Admins see every certificate; an intern sees only their own. */
export default async function CertificatePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const id = Number((await params).id);
  const c = Number.isInteger(id) ? await getCertificate(id) : null;
  if (!c || (user.role !== "admin" && c.user_id !== user.id)) notFound();
  const back = user.role === "admin" ? "/admin/certificates" : "/employee/growth";
  const period = c.start_date && c.end_date ? `from ${longDate(c.start_date)} to ${longDate(c.end_date)}` : c.start_date ? `from ${longDate(c.start_date)}` : "";

  return (
    <main className="min-h-screen bg-bg px-4 py-6 print:bg-white print:p-0">
      <style>{"@page { size: A4 landscape; margin: 0; } @media print { .no-print { display: none !important; } }"}</style>
      <div className="no-print mx-auto mb-4 flex max-w-[1000px] flex-wrap items-center justify-between gap-3">
        <Link href={back} className="text-sm text-muted hover:text-ink">← Back</Link>
        {c.revoked ? <p className="text-sm text-red-700">This certificate has been revoked.</p> : <PrintButton />}
      </div>

      <article className="relative mx-auto aspect-[297/210] w-full max-w-[1000px] bg-white p-[3%] shadow-sm print:h-screen print:max-w-none print:shadow-none" aria-label={`${c.title} for ${c.user_name}`}>
        <div className="flex h-full flex-col items-center justify-between border-[3px] border-double px-[6%] py-[4%] text-center" style={{ borderColor: "#B8962E" }}>
          <div className="flex flex-col items-center gap-2">
            <Logo size={56} />
            <p className="text-xs uppercase tracking-[0.3em] text-muted">{site.name}</p>
          </div>

          <div className="flex flex-col items-center">
            <h1 className="font-heading text-[clamp(22px,4vw,44px)] leading-tight">{c.title}</h1>
            <p className="mt-3 text-sm text-muted">This is to certify that</p>
            <p className="mt-2 border-b px-6 pb-1 font-heading text-[clamp(24px,4.5vw,48px)] leading-tight" style={{ borderColor: "#B8962E" }}>{c.user_name}</p>
            <p className="mt-3 max-w-[70ch] text-sm leading-relaxed">
              has successfully completed an internship with {site.name}{period ? ` ${period}` : ""} and has demonstrated the following skills:
            </p>
            <ul className="mt-3 flex max-w-[80ch] flex-wrap justify-center gap-2">
              {c.skills.map((s) => <li key={s} className="rounded-brand border px-3 py-1 text-xs" style={{ borderColor: "#B8962E" }}>{s}</li>)}
            </ul>
            {c.remarks && <p className="mt-3 text-sm italic text-muted">{c.remarks}</p>}
          </div>

          <div className="grid w-full grid-cols-3 items-end gap-4 text-xs">
            <div className="text-left">
              <p className="text-muted">Certificate no.</p>
              <p className="font-mono tabular">{c.code}</p>
            </div>
            <div>
              <p className="text-muted">Issued on</p>
              <p>{longDate(c.issue_date)}</p>
            </div>
            <div className="text-right">
              <div className="ml-auto mb-1 h-8 w-40 border-b border-ink" />
              <p>Manav Narula</p>
              <p className="text-muted">Founder, {site.name}</p>
            </div>
          </div>
        </div>
        {c.revoked && <p className="absolute inset-0 flex items-center justify-center font-heading text-6xl text-red-700/30 -rotate-12" aria-hidden="true">REVOKED</p>}
      </article>
    </main>
  );
}
