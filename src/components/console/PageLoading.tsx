/** Shown inside the console the moment a link is clicked, while the next page loads (Next.js loading.tsx). */
export default function PageLoading() {
  return (
    <div aria-busy="true" aria-live="polite" className="animate-pulse">
      <span className="sr-only">Loading…</span>
      <div className="h-7 w-48 rounded-brand bg-line" />
      <div className="mt-2 h-4 w-80 max-w-full rounded-brand bg-line/70" />
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => <div key={i} className="h-20 rounded-brand border border-line bg-white" />)}
      </div>
      <div className="mt-5 space-y-2">
        {[0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="h-12 rounded-brand border border-line bg-white" />)}
      </div>
    </div>
  );
}
