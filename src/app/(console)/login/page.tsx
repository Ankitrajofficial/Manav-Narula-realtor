import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession, needsNewPin } from "@/lib/auth";
import { googleConfigured } from "@/lib/google-auth";
import LoginForm from "./LoginForm";
import Logo from "@/components/Logo";
import Icon from "@/components/Icon";

export const metadata = { title: "Sign in", robots: { index: false } };

const GOOGLE_ERRORS: Record<string, (email?: string) => string> = {
  not_staff: (email) => `${email ?? "That Google account"} is not on the staff list. Ask the admin to add this email on the Employees page, or sign in with another Google account.`,
  blocked: () => "This account is blocked. Contact the admin.",
  google_unverified: () => "Google has not verified this email address. Use a Gmail or Google Workspace account.",
  google_cancelled: () => "Google sign-in was cancelled.",
  google_state: () => "The sign-in took too long or the browser blocked a cookie. Try again.",
  google_failed: () => "Google sign-in did not complete. Try again in a minute.",
  google_off: () => "Google sign-in is not set up on this server. Use your email and PIN.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ reset?: string; error?: string; email?: string }> }) {
  const { reset, error, email } = await searchParams;
  const user = await getSession();
  if (user) redirect(needsNewPin(user) ? "/change-password" : user.role === "admin" ? "/admin" : "/employee");
  const google = googleConfigured();
  const message = error && GOOGLE_ERRORS[error] ? GOOGLE_ERRORS[error](email) : null;
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-3">
          <Logo size={44} />
          <div>
            <p className="font-heading text-lg leading-tight">Manav Narula Realtor</p>
            <p className="text-xs text-muted">Staff console</p>
          </div>
        </div>
        <div className="rounded-brand border border-line bg-white p-6">
          <h1 className="font-heading text-2xl">Sign in</h1>
          <p className="mt-1 text-sm text-muted">{google ? "Use the Google account whose email the admin added for you. There is no self sign-up." : "Use your email and 6-digit PIN. There is no self sign-up."}</p>
          {reset && <p className="mt-3 rounded-brand border border-accent px-3 py-2 text-sm text-accent-ink">Your PIN was reset. Sign in with the new one.</p>}
          {message && <p className="mt-3 rounded-brand border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{message}</p>}
          {google ? (
            <>
              <Link href="/api/auth/google" prefetch={false} className="mt-5 flex w-full items-center justify-center gap-3 rounded-brand border border-line bg-white px-4 py-3 text-base font-medium hover:border-ink">
                <Icon name="google" size={20} />Sign in with Google
              </Link>
              <details className="mt-5 text-sm">
                <summary className="cursor-pointer text-muted hover:text-ink">Sign in with a PIN instead</summary>
                <LoginForm />
              </details>
            </>
          ) : <LoginForm />}
        </div>
        <p className="mt-6 text-center text-xs text-muted">Built by Inook AI · Phase 2</p>
      </div>
    </div>
  );
}
