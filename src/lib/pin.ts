import { randomInt } from "node:crypto";

/** Staff sign in with a 6-digit PIN. */
export const PIN_LENGTH = 6;
/** Wrong PINs in a row before the account is locked, and for how long. */
export const MAX_FAILED_LOGINS = 5;
export const LOCK_MINUTES = 15;

const trivial = (pin: string) => /^(\d)\1+$/.test(pin) || "0123456789".includes(pin) || "9876543210".includes(pin);

/** Why this PIN cannot be used, or null when it is fine. */
export function pinError(pin: string): string | null {
  if (!new RegExp(`^\\d{${PIN_LENGTH}}$`).test(pin)) return `Use exactly ${PIN_LENGTH} digits.`;
  if (trivial(pin)) return "Too easy to guess (like 111111 or 123456). Choose another.";
  return null;
}

/** A random digit string (temporary PINs, emailed reset codes) that is never a trivial sequence. */
export function randomPin(): string {
  for (;;) {
    const pin = String(randomInt(10 ** PIN_LENGTH)).padStart(PIN_LENGTH, "0");
    if (!trivial(pin)) return pin;
  }
}
