import { redirect } from "next/navigation";
import { getSession, needsNewPin } from "@/lib/auth";
import LoginForm from "./LoginForm";
import Logo from "@/components/Logo";

export const metadata = { title: "Sign in", robots: { index: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ reset?: string }> }) {
  const { reset } = await searchParams;
  const user = await getSession();
  if (user) redirect(needsNewPin(user) ? "/change-password" : user.role === "admin" ? "/admin" : "/employee");
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
          <p className="mt-1 text-sm text-muted">Use your email and 6-digit PIN. There is no self sign-up.</p>
          {reset && <p className="mt-3 rounded-brand border border-accent px-3 py-2 text-sm text-accent-ink">Your PIN was reset. Sign in with the new one.</p>}
          <LoginForm />
        </div>
        <p className="mt-6 text-center text-xs text-muted">Built by Inook AI · Phase 2</p>
      </div>
    </div>
  );
}
