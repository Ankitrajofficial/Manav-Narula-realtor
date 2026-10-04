import LegalPage from "@/components/LegalPage";
export const metadata = { title: "Privacy policy" };
export default function Page() {
  return (
    <LegalPage title="Privacy policy" updated="28 September 2026" sections={[
      { h: "What we collect", p: ["When you send an enquiry we collect your name, phone number and, if you give it, your email, budget, locality and message. We do not ask visitors to create an account."] },
      { h: "How we use it", p: ["Only to respond to your enquiry and to follow up about properties that match it. Your details are stored in our own lead database and are not sold to anyone.", "If you ask us to stop contacting you, we mark your record as do-not-contact within one working day."] },
      { h: "Cookies and analytics", p: ["This site does not set tracking cookies today. If analytics is switched on in future, a consent notice will appear before any such cookie is set."] },
      { h: "Contact", p: ["Questions about your data: write to realtormanavnarula@gmail.com or call +91 90122 90522."] },
    ]} />
  );
}
