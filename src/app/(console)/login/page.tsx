import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import LoginForm from "./LoginForm";

export const metadata = { title: "Sign in", robots: { index: false } };

export default async function LoginPage() {
  const user = await getSession();
  if (user) redirect(user.role === "admin" ? "/admin" : "/employee");
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-brand border border-ink font-heading">MN</span>
          <div>
            <p className="font-heading text-lg leading-tight">Manav Narula Realtor</p>
            <p className="text-xs text-muted">Staff console</p>
          </div>
        </div>
        <div className="rounded-brand border border-line bg-white p-6">
          <h1 className="font-heading text-2xl">Sign in</h1>
          <p className="mt-1 text-sm text-muted">Use the email and password given by the admin. There is no self sign-up.</p>
          <LoginForm />
        </div>
        <p className="mt-6 text-center text-xs text-muted">Built by Inook AI · Phase 2</p>
      </div>
    </div>
  );
}
