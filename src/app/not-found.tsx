import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Section } from "@/components/ui";

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <Section className="min-h-[60vh]">
          <p className="text-sm text-muted">404</p>
          <h1 className="mt-2 text-4xl md:text-5xl">That page is not here.</h1>
          <p className="mt-4 max-w-md text-muted">The listing may have been sold or the link may be wrong. The properties page has everything currently available.</p>
          <div className="mt-8 flex gap-4 text-sm">
            <Link href="/" className="rounded-brand bg-accent px-5 py-3 font-medium text-white hover:bg-accent-ink">Go home</Link>
            <Link href="/contact" className="rounded-brand border border-ink px-5 py-3 hover:bg-ink hover:text-white">Contact us</Link>
          </div>
        </Section>
      </main>
      <Footer />
    </>
  );
}
