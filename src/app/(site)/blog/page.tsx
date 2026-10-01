import Image from "next/image";
import Link from "next/link";
import { Breadcrumbs, Section } from "@/components/ui";
import { getArticles } from "@/lib/site-data";

export const revalidate = 60;
import { formatDate, unsplash } from "@/lib/format";

export const metadata = { title: "Blog", description: "Market prices, legal checklists and NRI guides for property in Jalandhar, written by our advisors." };

export default async function BlogPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { category = "All" } = await searchParams;
  const articles = await getArticles();
  const cats = ["All", ...Array.from(new Set(articles.map((a) => a.category)))];
  const list = category === "All" ? articles : articles.filter((a) => a.category === category);
  return (
    <Section>
      <Breadcrumbs items={[{ label: "Blog" }]} />
      <h1 className="mt-6 text-4xl md:text-5xl">Blog</h1>
      <p className="mt-3 max-w-2xl text-muted">Prices, paperwork and process, written from the deals we handle.</p>
      <div className="mt-8 flex flex-wrap gap-2">
        {cats.map((c) => <Link key={c} href={c === "All" ? "/blog" : `/blog?category=${encodeURIComponent(c)}`} aria-current={category === c ? "page" : undefined} className={`rounded-brand border px-4 py-2 text-sm ${category === c ? "border-accent bg-accent text-white" : "border-line bg-white hover:border-ink"}`}>{c}</Link>)}
      </div>
      <ul className="mt-10 grid gap-6 md:grid-cols-3">
        {list.map((a) => (
          <li key={a.slug}>
            <Link href={`/blog/${a.slug}`} className="group block overflow-hidden rounded-brand border border-line bg-white">
              <div className="relative aspect-[4/3] bg-line"><Image src={unsplash(a.cover, 800, 600)} alt="" fill sizes="(min-width: 768px) 400px, 100vw" className="object-cover" /></div>
              <div className="p-4">
                <span className="text-xs text-accent-ink">{a.category}</span>
                <h2 className="mt-1 text-lg leading-snug group-hover:text-accent-ink">{a.title}</h2>
                <p className="mt-2 line-clamp-2 text-sm text-muted">{a.excerpt}</p>
                <p className="mt-3 text-sm text-muted">{formatDate(a.date)}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </Section>
  );
}
