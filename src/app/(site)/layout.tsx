import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MobileBar from "@/components/MobileBar";
import ConsultationPopup from "@/components/ConsultationPopup";
import { getBusiness, getPopupSettings } from "@/lib/site-data";
import { listLocalityOptions } from "@/lib/queries/common";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [b, popup] = await Promise.all([getBusiness(), getPopupSettings()]);
  const localities = popup.enabled ? await listLocalityOptions() : [];
  return (
    <>
      <Header phone={b.phone} />
      <main className="flex-1">{children}</main>
      <Footer />
      <MobileBar />
      {popup.enabled && <ConsultationPopup headline={popup.headline} text={popup.text} delaySeconds={popup.delaySeconds} localities={localities} />}
    </>
  );
}
