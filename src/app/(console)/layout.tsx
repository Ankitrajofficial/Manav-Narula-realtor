export default function ConsoleLayout({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-screen flex-col bg-bg text-[14px]">{children}</div>;
}
