import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import Logo from "@/components/Logo";
import Icon from "@/components/Icon";
import ProjectImage from "@/components/ProjectImage";
import LinkEnquiryForm from "@/components/LinkEnquiryForm";
import { projectPlace, projectPrice } from "@/components/ProjectCard";
import { developerCredit, site } from "@/data/site";
import { getBusiness, getProjectBySlug, phoneHref, whatsappHref } from "@/lib/site-data";
import { countLinkVisit, getLeadLinkBySlug } from "@/lib/queries/lead-links";

// Ad landing pages are for people who click an ad; they stay out of search results (no doorway pages).
export const metadata: Metadata = { robots: { index: false, follow: false } };

const BOT = /bot|crawl|spider|facebookexternalhit|facebookcatalog|whatsapp|preview|slurp/i;

/** Ad link page (/l/<slug>): a short enquiry page for one Facebook / Instagram ad. Off links go to the website. */
export default async function AdLinkPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ preview?: string }> }) {
  const [{ slug }, { preview }] = await Promise.all([params, searchParams]);
  const link = await getLeadLinkBySlug(slug);
  if (!link) notFound();
  if (!link.active) redirect(link.project_slug ? `/projects/${link.project_slug}` : "/");
  // Count people, not link-preview crawlers or the admin's own preview.
  if (!preview && !BOT.test((await headers()).get("user-agent") ?? "")) await countLinkVisit(link.id);

  const [b, project] = await Promise.all([getBusiness(), link.project_slug ? getProjectBySlug(link.project_slug) : Promise.resolve(null)]);
  const headline = link.headline || (project ? `Enquire about ${project.name}` : "Find the right property in Jalandhar");
  const intro = link.intro || (project ? "Share your number and an advisor will call you with prices, availability and a site visit slot." : "Kothis, plots, apartments and commercial spaces. Share your number and an advisor will call you.");

  return (
    <main className="flex-1 bg-bg">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3 px-4 py-3">
          <Link href="/" className="flex items-center gap-2 font-heading text-lg"><Logo size={32} />{site.name}</Link>
          <a href={phoneHref(b)} className="inline-flex items-center gap-1.5 rounded-brand border border-line px-3 py-1.5 text-sm hover:border-ink"><Icon name="phone" size={14} />Call</a>
        </div>
      </header>
      <div className="mx-auto max-w-lg space-y-5 px-4 py-6">
        {project && (
          <div className="overflow-hidden rounded-brand border border-line bg-white">
            <div className="relative aspect-[4/3] bg-line"><ProjectImage src={project.image} name={project.name} developer={project.developer} sizes="(min-width: 512px) 512px, 100vw" priority /></div>
            <div className="p-4">
              <p className="font-heading text-xl">{project.name}</p>
              <p className="text-sm text-muted">{[project.developer && `By ${project.developer}`, projectPlace(project)].filter(Boolean).join(" · ")}</p>
              <p className="mt-2 text-lg font-bold">{projectPrice(project)}</p>
            </div>
          </div>
        )}
        <section className="rounded-brand border border-line bg-white p-5">
          <h1 className="font-heading text-2xl leading-snug">{headline}</h1>
          <p className="mt-2 text-sm text-muted">{intro}</p>
          <div className="mt-5"><LinkEnquiryForm linkId={link.id} subject={project?.name ?? link.name} /></div>
        </section>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <a href={whatsappHref(b)} className="inline-flex items-center justify-center gap-2 rounded-brand border border-line bg-white py-2.5 hover:border-ink"><Icon name="whatsapp" size={16} />WhatsApp us</a>
          <a href={phoneHref(b)} className="inline-flex items-center justify-center gap-2 rounded-brand border border-line bg-white py-2.5 hover:border-ink"><Icon name="phone" size={16} />{b.phone}</a>
        </div>
        <footer className="space-y-1 pb-4 text-center text-xs leading-relaxed text-muted">
          {project && <p>Developed by {project.developer}. {developerCredit}{project.rera ? ` Project RERA No.: ${project.rera}` : ""}</p>}
          <p>{site.name} · {b.address}</p>
          <p><Link href="/" className="hover:text-ink hover:underline">Visit our website</Link> · <Link href="/privacy" className="hover:text-ink hover:underline">Privacy</Link></p>
        </footer>
      </div>
    </main>
  );
}
