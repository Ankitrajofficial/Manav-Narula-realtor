import { redirect as nextRedirect, RedirectType } from "next/navigation";

/**
 * Redirect after a form or button saves something. Next adds a history entry by default in server actions, so Back would
 * reopen the form, or stay on the same record once per save. This replaces the current entry instead.
 */
export function redirect(url: string): never {
  nextRedirect(url, RedirectType.replace);
}
