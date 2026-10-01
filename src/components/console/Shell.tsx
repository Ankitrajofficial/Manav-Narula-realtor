import { Suspense } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import Toast from "./Toast";
import type { SessionUser } from "@/lib/auth";

export default function Shell({ user, nav, home, quick, notifications, children }: { user: SessionUser; nav: { href: string; label: string; icon: string }[]; home: string; quick: { label: string; href: string }[]; notifications: { count: number; href: string }; children: React.ReactNode }) {
  return (
    <div className="console flex min-h-screen flex-col md:flex-row">
      <Sidebar nav={nav} user={user} home={home} quick={quick} notifications={notifications} />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="hidden md:block"><Topbar searchPath={`${home}/search`} quick={quick} notifications={notifications} /></div>
        <main className="flex-1 px-4 py-4 md:px-6 md:py-6">{children}</main>
      </div>
      <Suspense><Toast /></Suspense>
    </div>
  );
}
