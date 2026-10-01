import LegalPage from "@/components/LegalPage";
export const metadata = { title: "Terms of use" };
export default function Page() {
  return (
    <LegalPage title="Terms of use" updated="28 September 2026" sections={[
      { h: "Listings", p: ["Prices, areas and availability shown on this site are indicative and change without notice. The final terms of any transaction are those in the written agreement between buyer and seller."] },
      { h: "Our role", p: ["Manav Narula Realtor acts as a real estate agent. We are not the owner or developer of the properties listed unless stated."] },
      { h: "Fees", p: ["Our fees are as stated on the Services page and are confirmed in writing before any token payment. No fee is payable for browsing or enquiring."] },
      { h: "Governing law", p: ["These terms are governed by the laws of India and the courts at Jalandhar have jurisdiction."] },
    ]} />
  );
}
