/** The visitor's cookie choice, kept in this browser: "granted" (analytics allowed) or "denied" (essential only). */
export const CONSENT_KEY = "mn.cookieConsent";
/** Fired by the footer's "Cookie settings" link to open the banner again. */
export const CONSENT_OPEN_EVENT = "mn:cookie-settings";
export type Consent = "granted" | "denied";
