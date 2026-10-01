export function formatPrice(rupees: number, purpose: "Buy" | "Rent" = "Buy"): string {
  if (purpose === "Rent") return `₹${rupees.toLocaleString("en-IN")}/mo`;
  if (rupees >= 1_00_00_000) {
    const cr = rupees / 1_00_00_000;
    return `₹${Number.isInteger(cr) ? cr : cr.toFixed(2).replace(/0+$/, "").replace(/\.$/, "")} Cr`;
  }
  const l = rupees / 1_00_000;
  return `₹${Number.isInteger(l) ? l : l.toFixed(1)} L`;
}

export function formatArea(area: number, unit: string): string {
  return `${area.toLocaleString("en-IN")} ${unit}`;
}

export function pricePerSqft(price: number, area: number, unit: string): string {
  const sqft = unit === "sq.yd" ? area * 9 : area;
  return `₹${Math.round(price / sqft).toLocaleString("en-IN")}/sq.ft`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

export function unsplash(id: string, w = 1200, h = 900): string {
  if (/^https?:\/\//.test(id) || id.startsWith("/")) return id;
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&h=${h}&q=70`;
}

export function formatDateTime(v: string | Date | null | undefined): string {
  if (!v) return "";
  return new Date(v).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
}

export function formatShortDate(v: string | Date | null | undefined): string {
  if (!v) return "";
  return new Date(v).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function relativeTime(v: string | Date | null | undefined): string {
  if (!v) return "";
  const diff = (Date.now() - new Date(v).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} h ago`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)} d ago`;
  return formatShortDate(v);
}

export function formatINR(n: number | string | null | undefined): string {
  const v = Number(n ?? 0);
  return `₹${v.toLocaleString("en-IN")}`;
}
