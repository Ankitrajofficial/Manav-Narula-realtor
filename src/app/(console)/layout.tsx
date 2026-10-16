import type { Metadata } from "next";

// Staff pages only: lets the console be added to a phone's home screen (see login/app-manifest).
export const metadata: Metadata = { manifest: "/login/app-manifest", appleWebApp: { capable: true, title: "MN Console", statusBarStyle: "default" } };

export default function ConsoleLayout({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-screen flex-col bg-bg text-[14px]">{children}</div>;
}
