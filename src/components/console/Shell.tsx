import { Suspense } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import Toast from "./Toast";
import type { SessionUser } from "@/lib/auth";
import { readFlash } from "@/lib/flash";
import { levelLabel } from "@/lib/growth";

export default async function Shell({ user, nav, home, quick, notifications, children }: { user: SessionUser; nav: { href: string; label: string; icon: string }[]; home: string; quick: { label: string; href: string }[]; notifications: { count: number; href: string }; children: React.ReactNode }) {
  const flash = await readFlash();
  return (
    <div className="console flex min-h-screen flex-col md:flex-row">
      <Sidebar nav={nav} user={{ name: user.name, role: levelLabel(user.role, user.level) }} home={home} quick={quick} notifications={notifications} />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="hidden md:block"><Topbar searchPath={`${home}/search`} quick={quick} notifications={notifications} /></div>
        <main className="flex-1 px-4 py-4 md:px-6 md:py-6">{children}</main>
      </div>
      <Suspense><Toast flash={flash} /></Suspense>
    </div>
  );
}
