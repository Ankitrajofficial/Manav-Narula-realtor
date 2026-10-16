import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession, needsNewPin } from "@/lib/auth";
import { logoutAction } from "../actions";
import ChangePasswordForm from "./ChangePasswordForm";

export const metadata = { title: "Change PIN", robots: { index: false } };

export default async function ChangePasswordPage() {
  const user = await getSession();
  if (!user) redirect("/login");
  const home = user.role === "admin" ? "/admin" : "/employee";
  const forced = needsNewPin(user);
  const intro = user.must_reset ? "You signed in with a temporary PIN." : "Staff now sign in with a 6-digit PIN instead of a password.";
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="rounded-brand border border-line bg-white p-6">
          <h1 className="font-heading text-2xl">{forced ? "Set your PIN" : "Change PIN"}</h1>
          <p className="mt-1 text-sm text-muted">
            {forced ? `Welcome, ${user.name}. ${intro} Choose your own PIN before you continue.` : `Signed in as ${user.email}.`}
          </p>
          <ChangePasswordForm firstPin={!user.pin_set && !user.must_reset} />
        </div>
        <div className="mt-4 flex justify-center gap-4 text-sm">
          {!forced && <Link href={home} className="text-muted hover:text-ink">Back to console</Link>}
          <form action={logoutAction}><button type="submit" className="text-muted hover:text-ink">Log out</button></form>
        </div>
      </div>
    </div>
  );
}
