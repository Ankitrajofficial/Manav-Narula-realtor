import LegalPage from "@/components/LegalPage";
export const metadata = { title: "Disclaimer" };
export default function Page() {
  return (
    <LegalPage title="Disclaimer" updated="28 September 2026" sections={[
      { h: "Property information", p: ["Photographs, floor plans and distances are for illustration. Areas are as declared by the owner or developer and should be verified in the sale documents. RERA numbers for projects belong to the respective developers."] },
      { h: "Home loans", p: ["Loan sanction is at the sole discretion of the bank. Rates quoted are indicative and subject to the bank's terms."] },
      { h: "No advice", p: ["Content on the blog is general information, not legal or tax advice. Consult a qualified advocate or chartered accountant for your situation."] },
    ]} />
  );
}
