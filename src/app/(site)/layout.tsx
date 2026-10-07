import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MobileBar from "@/components/MobileBar";
import SitePopups from "@/components/SitePopups";
import { getBusiness } from "@/lib/site-data";
import { getLivePopups } from "@/lib/queries/popups";
import { listLocalityOptions } from "@/lib/queries/common";
import CookieConsent from "@/components/CookieConsent";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [b, popups] = await Promise.all([getBusiness(), getLivePopups()]);
  const localities = popups.some((p) => p.kind === "consultation") ? await listLocalityOptions() : [];
  return (
    <>
      <Header phone={b.phone} />
      <main className="flex-1">{children}</main>
      <Footer />
      <MobileBar />
      <CookieConsent />
      {popups.length > 0 && <SitePopups popups={popups} localities={localities} />}
    </>
  );
}
