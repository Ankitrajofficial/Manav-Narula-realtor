import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MobileBar from "@/components/MobileBar";
import { getBusiness } from "@/lib/site-data";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const b = await getBusiness();
  return (
    <>
      <Header phone={b.phone} />
      <main className="flex-1">{children}</main>
      <Footer />
      <MobileBar />
    </>
  );
}
