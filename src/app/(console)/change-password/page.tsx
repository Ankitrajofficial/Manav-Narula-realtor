import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { logoutAction } from "../actions";
import ChangePasswordForm from "./ChangePasswordForm";

export const metadata = { title: "Change password", robots: { index: false } };

export default async function ChangePasswordPage() {
  const user = await getSession();
  if (!user) redirect("/login");
  const home = user.role === "admin" ? "/admin" : "/employee";
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="rounded-brand border border-line bg-white p-6">
          <h1 className="font-heading text-2xl">{user.must_reset ? "Set your own password" : "Change password"}</h1>
          <p className="mt-1 text-sm text-muted">
            {user.must_reset ? `Welcome, ${user.name}. You signed in with a temporary password. Choose your own before you continue.` : `Signed in as ${user.email}.`}
          </p>
          <ChangePasswordForm />
        </div>
        <div className="mt-4 flex justify-center gap-4 text-sm">
          {!user.must_reset && <Link href={home} className="text-muted hover:text-ink">Back to console</Link>}
          <form action={logoutAction}><button type="submit" className="text-muted hover:text-ink">Log out</button></form>
        </div>
      </div>
    </div>
  );
}
