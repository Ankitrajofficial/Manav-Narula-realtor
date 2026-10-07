import LegalPage from "@/components/LegalPage";
export const metadata = { title: "Privacy policy" };
export default function Page() {
  return (
    <LegalPage title="Privacy policy" updated="6 October 2026" sections={[
      { h: "What we collect", p: ["When you send an enquiry we collect your name, phone number and, if you give it, your email, budget, locality and message. We do not ask visitors to create an account."] },
      { h: "How we use it", p: ["Only to respond to your enquiry and to follow up about properties that match it. Your details are stored in our own lead database and are not sold to anyone.", "If you ask us to stop contacting you, we mark your record as do-not-contact within one working day."] },
      { id: "cookies", h: "Cookies and analytics", p: [
        "Essential cookies keep enquiry forms and our staff login working. They are always on.",
        "With your permission we use Google Analytics to count visits and see which pages are useful. Its cookies are set only after you choose \"Accept all\" in the cookie notice; with \"Essential only\" none are set. We do not use advertising cookies.",
        "You can change your choice at any time from \"Cookie settings\" at the bottom of every page.",
      ] },
      { h: "Contact", p: ["Questions about your data: write to realtormanavnarula@gmail.com or call +91 90122 90522."] },
    ]} />
  );
}
