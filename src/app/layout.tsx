import type { Metadata } from "next";
import "./globals.css";
import { site } from "@/data/site";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name} · Property advisors in Jalandhar`, template: `%s · ${site.name}` },
  description: "Kothis, plots, apartments and commercial spaces in Jalandhar with verified titles, RERA-registered advice and accompanied site visits. 4.8 Google rating.",
  openGraph: { siteName: site.name, locale: "en_IN", type: "website" },
  robots: { index: true, follow: true },
};

const orgSchema = {
  "@context": "https://schema.org",
  "@type": "RealEstateAgent",
  name: site.name,
  telephone: "+919012290522",
  email: site.email,
  url: site.url,
  address: { "@type": "PostalAddress", streetAddress: "66 Feet Rd, opp. Punjab & Sind Bank, IsharPuri Colony, Mithapur", addressLocality: "Jalandhar", addressRegion: "Punjab", postalCode: "144005", addressCountry: "IN" },
  aggregateRating: { "@type": "AggregateRating", ratingValue: site.rating, reviewCount: site.reviews },
  openingHours: "Mo-Sa 10:00-19:00",
  areaServed: "Jalandhar",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className="h-full" data-scroll-behavior="smooth">
      <body className="flex min-h-full flex-col">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }} />
        {children}
      </body>
    </html>
  );
}
