/**
 * Dependency-free PDF report writer: A4 landscape, Helvetica, a header block with the brand mark,
 * report title, generated date and the filters applied, then a paginated table.
 */
export interface PdfTable { columns: { label: string; width: number }[]; rows: string[][] }
export interface PdfReport { title: string; subtitle?: string; meta: string[]; table: PdfTable; footer?: string }

const W = 842, H = 595, M = 36;
const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)").replace(/[^\x20-\x7E]/g, (c) => (c === "₹" ? "Rs " : c === "·" ? "-" : ""));
const clip = (s: string, w: number, size: number) => { const max = Math.floor(w / (size * 0.5)); return s.length > max ? s.slice(0, Math.max(0, max - 1)) + "…".replace("…", "...") : s; };

export function buildPdf(r: PdfReport): Uint8Array {
  const pages: string[] = [];
  const rowH = 18, size = 9, headerBottom = 110;
  const perPage = Math.floor((H - headerBottom - M - 30) / rowH);
  const chunks: string[][][] = [];
  for (let i = 0; i < Math.max(1, r.table.rows.length); i += perPage) chunks.push(r.table.rows.slice(i, i + perPage));

  chunks.forEach((rows, pi) => {
    let c = "";
    const text = (x: number, y: number, s: string, sz = size, bold = false, color = "0 0 0") => { c += `BT /${bold ? "F2" : "F1"} ${sz} Tf ${color} rg ${x} ${H - y} Td (${esc(s)}) Tj ET\n`; };
    const line = (x1: number, y1: number, x2: number, y2: number, g = 0.85) => { c += `${g} G 0.5 w ${x1} ${H - y1} m ${x2} ${H - y2} l S\n`; };
    // Brand mark
    c += `0 G 0.75 w ${M} ${H - M - 26} 26 26 re S\n`;
    text(M + 5, M + 18, "MN", 10, true);
    text(M + 34, M + 12, "Manav Narula Realtor", 11, true);
    text(M + 34, M + 24, "66 Feet Rd, Mithapur, Jalandhar 144005  |  +91 90122 90522", 7.5, false, "0.42 0.42 0.42");
    text(W - M - 200, M + 12, `Generated ${new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}`, 8, false, "0.42 0.42 0.42");
    text(W - M - 200, M + 24, `Page ${pi + 1} of ${chunks.length}`, 8, false, "0.42 0.42 0.42");
    line(M, M + 34, W - M, M + 34, 0.6);
    text(M, M + 56, r.title, 16, true);
    if (r.subtitle) text(M, M + 70, r.subtitle, 9, false, "0.42 0.42 0.42");
    text(M, M + 84, r.meta.length ? `Filters: ${r.meta.join("  |  ")}` : "Filters: none", 8, false, "0.42 0.42 0.42");
    // Table header
    let y = headerBottom;
    let x = M;
    c += `0.98 0.98 0.97 rg ${M} ${H - y - 4} ${W - 2 * M} ${rowH} re f\n`;
    for (const col of r.table.columns) { text(x + 4, y + 9, col.label, 8, true); x += col.width; }
    y += rowH;
    line(M, y - 4, W - M, y - 4, 0.6);
    if (rows.length === 0) text(M + 4, y + 9, "No records match these filters.", 9, false, "0.42 0.42 0.42");
    for (const row of rows) {
      x = M;
      row.forEach((cell, i) => { const col = r.table.columns[i]; text(x + 4, y + 9, clip(cell ?? "", col.width - 8, size), size); x += col.width; });
      y += rowH;
      line(M, y - 4, W - M, y - 4);
    }
    if (r.footer && pi === chunks.length - 1) text(M, y + 14, r.footer, 9, true);
    pages.push(c);
  });

  const objs: string[] = [];
  const add = (s: string) => { objs.push(s); return objs.length; };
  const f1 = add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>");
  const f2 = add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>");
  const pagesIdx = objs.length + 1 + pages.length * 2;
  const pageIds: number[] = [];
  for (const content of pages) {
    const cid = add(`<< /Length ${Buffer.byteLength(content, "latin1")} >>\nstream\n${content}endstream`);
    pageIds.push(add(`<< /Type /Page /Parent ${pagesIdx} 0 R /MediaBox [0 0 ${W} ${H}] /Contents ${cid} 0 R /Resources << /Font << /F1 ${f1} 0 R /F2 ${f2} 0 R >> >> >>`));
  }
  const pagesId = add(`<< /Type /Pages /Kids [${pageIds.map((i) => `${i} 0 R`).join(" ")}] /Count ${pageIds.length} >>`);
  const catalog = add(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`);
  let out = "%PDF-1.4\n";
  const offsets: number[] = [];
  objs.forEach((o, i) => { offsets.push(Buffer.byteLength(out, "latin1")); out += `${i + 1} 0 obj\n${o}\nendobj\n`; });
  const xref = Buffer.byteLength(out, "latin1");
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n${offsets.map((o) => String(o).padStart(10, "0") + " 00000 n \n").join("")}trailer\n<< /Size ${objs.length + 1} /Root ${catalog} 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return new Uint8Array(Buffer.from(out, "latin1"));
}

export function pdfResponse(bytes: Uint8Array, filename: string) {
  return new Response(bytes as BodyInit, { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${filename}"` } });
}
