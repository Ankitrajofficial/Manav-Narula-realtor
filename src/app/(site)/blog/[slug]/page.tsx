import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Breadcrumbs, Container } from "@/components/ui";
import Markdown from "@/components/console/Markdown";
import AuthorCard from "@/components/AuthorCard";
import { getArticleBySlug, getArticles } from "@/lib/site-data";

export const revalidate = 60;
import { site } from "@/data/site";
import { formatDate, unsplash } from "@/lib/format";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const a = await getArticleBySlug((await params).slug);
  if (!a) return {};
  return { title: a.title, description: a.excerpt, openGraph: { type: "article", images: [unsplash(a.cover)] } };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const a = await getArticleBySlug((await params).slug);
  if (!a) notFound();
  const articles = await getArticles();
  const related = articles.filter((x) => x.slug !== a.slug).slice(0, 2);
  const schema = { "@context": "https://schema.org", "@type": "Article", headline: a.title, datePublished: a.date, author: { "@type": "Person", name: a.author, ...(a.authorTitle ? { jobTitle: a.authorTitle } : {}) }, publisher: { "@type": "Organization", name: site.name }, image: unsplash(a.cover) };
  return (
    <Container className="py-8 md:py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <Breadcrumbs items={[{ label: "Blog", href: "/blog" }, { label: a.category, href: `/blog?category=${encodeURIComponent(a.category)}` }, { label: a.title }]} />
      <article className="mt-8 max-w-3xl">
        <span className="text-xs text-accent-ink">{a.category}</span>
        <h1 className="mt-2 text-4xl leading-tight md:text-5xl">{a.title}</h1>
        <p className="mt-4 text-sm text-muted">By {a.author}{a.authorTitle ? `, ${a.authorTitle}` : ""} · {formatDate(a.date)}</p>
        <div className="relative mt-8 aspect-[4/3] overflow-hidden rounded-brand border border-line bg-line"><Image src={unsplash(a.cover, 1200, 900)} alt="" fill priority sizes="800px" className="object-cover" /></div>
        <Markdown source={a.body.join("\n\n")} className="prose-article mt-10 text-lg leading-relaxed text-ink/90" />
        {a.authorTitle && <AuthorCard name={a.author} title={a.authorTitle} photo={a.authorPhoto} />}
        <div className="mt-12 rounded-brand border border-line bg-white p-6">
          <p className="text-xl">Have a question about this?</p>
          <p className="mt-1 text-sm text-muted">Send us your situation and an advisor will call you back within working hours.</p>
          <Link href="/contact" className="mt-4 inline-flex rounded-brand bg-accent px-5 py-3 text-sm font-medium text-white hover:bg-accent-ink">Send enquiry</Link>
        </div>
      </article>
      <section className="mt-16 max-w-3xl">
        <h2 className="text-2xl">Related articles</h2>
        <ul className="mt-4 divide-y divide-line border-y border-line">
          {related.map((r) => (
            <li key={r.slug} className="py-4">
              <Link href={`/blog/${r.slug}`} className="hover:text-accent-ink"><span className="text-xs text-accent-ink">{r.category}</span><p className="mt-1 text-lg">{r.title}</p></Link>
              <p className="mt-1 text-sm text-muted">{formatDate(r.date)}</p>
            </li>
          ))}
        </ul>
      </section>
    </Container>
  );
}
