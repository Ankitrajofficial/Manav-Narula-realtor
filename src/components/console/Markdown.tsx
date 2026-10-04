/** Tiny markdown renderer for blog bodies: headings, paragraphs, bold, italics, links, bullet and numbered lists, and
 * images on a line of their own (![caption](/path), shown whole with the caption underneath). */
function inline(s: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g;
  let last = 0, m: RegExpExecArray | null, k = 0;
  while ((m = re.exec(s))) {
    if (m.index > last) out.push(s.slice(last, m.index));
    const t = m[0];
    if (t.startsWith("**")) out.push(<strong key={k++}>{t.slice(2, -2)}</strong>);
    else if (t.startsWith("[")) { const mm = /\[([^\]]+)\]\(([^)]+)\)/.exec(t)!; out.push(<a key={k++} href={mm[2]} className="text-accent-ink underline">{mm[1]}</a>); }
    else out.push(<em key={k++}>{t.slice(1, -1)}</em>);
    last = m.index + t.length;
  }
  if (last < s.length) out.push(s.slice(last));
  return out;
}

export default function Markdown({ source, className = "" }: { source: string; className?: string }) {
  const blocks = source.replace(/\r\n/g, "\n").split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  return (
    <div className={className}>
      {blocks.map((b, i) => {
        if (b.startsWith("### ")) return <h3 key={i}>{inline(b.slice(4))}</h3>;
        if (b.startsWith("## ")) return <h2 key={i}>{inline(b.slice(3))}</h2>;
        if (b.startsWith("# ")) return <h2 key={i}>{inline(b.slice(2))}</h2>;
        const img = /^!\[([^\]]*)\]\(([^)\s]+)\)$/.exec(b);
        if (img) return (
          <figure key={i} className="my-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img[2].startsWith("/") && !img[2].startsWith("//") ? `/_next/image?url=${encodeURIComponent(img[2])}&w=1200&q=75` : img[2]} alt={img[1]} loading="lazy" className="w-full rounded-brand border border-line bg-white" />
            {img[1] && <figcaption className="mt-2 text-sm text-muted">{img[1]}</figcaption>}
          </figure>
        );
        const lines = b.split("\n");
        if (lines.every((l) => /^[-*] /.test(l))) return <ul key={i}>{lines.map((l, j) => <li key={j}>{inline(l.slice(2))}</li>)}</ul>;
        if (lines.every((l) => /^\d+\. /.test(l))) return <ol key={i} className="list-decimal pl-5">{lines.map((l, j) => <li key={j}>{inline(l.replace(/^\d+\. /, ""))}</li>)}</ol>;
        return <p key={i}>{inline(lines.join(" "))}</p>;
      })}
    </div>
  );
}
