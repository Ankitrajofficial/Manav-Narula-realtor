"use client";
import { useActionState } from "react";
import { SubmitButton } from "@/components/console/Form";
import { reimportProjects, type ReimportState } from "./actions";

/** Upload the scraper's projects_tree.json to refresh project facts; shows what changed and what was kept. */
export default function ReimportPanel() {
  const [state, act] = useActionState<ReimportState, FormData>(reimportProjects, {});
  return (
    <section className="mb-5 rounded-brand border border-line bg-white p-4">
      <h2 className="text-base">Re-import from JSON</h2>
      <p className="mt-1 text-xs text-muted">
        Upload the scraper&apos;s <code>projects_tree.json</code>. Facts (RERA, sizes, key facts, amenities, unit types) are refreshed; anything you edited here is kept;
        our copy and images are only filled where empty; nothing is published. New projects found on the developer&apos;s site are added as drafts.
      </p>
      <form action={act} className="mt-3 flex flex-wrap items-center gap-3">
        <input type="file" name="json" accept="application/json,.json" required className="text-sm text-muted file:mr-3 file:rounded-brand file:border file:border-line file:bg-white file:px-3 file:py-1.5 file:text-sm file:text-ink" />
        <SubmitButton variant="secondary">Re-import</SubmitButton>
      </form>
      {state.error && <p role="alert" className="mt-3 text-sm text-red-700">{state.error}</p>}
      {state.summary && (
        <div role="status" className="mt-4">
          <p className="text-sm font-medium">Re-import done: {state.summary}.</p>
          <table className="mt-2 w-full text-left text-xs">
            <thead className="text-muted"><tr><th className="py-1.5 pr-3 font-normal">Project</th><th className="py-1.5 pr-3 font-normal">Result</th><th className="py-1.5 pr-3 font-normal">Facts updated</th><th className="py-1.5 pr-3 font-normal">Your edits kept</th><th className="py-1.5 font-normal">To confirm</th></tr></thead>
            <tbody className="divide-y divide-line">
              {state.rows!.map((r) => (
                <tr key={r.name}>
                  <td className="py-1.5 pr-3 text-ink">{r.name}</td>
                  <td className="py-1.5 pr-3">{r.action}</td>
                  <td className="py-1.5 pr-3">{r.factsUpdated.join(", ") || "—"}</td>
                  <td className="py-1.5 pr-3">{r.keptEdited.join(", ") || "—"}</td>
                  <td className="py-1.5 tabular">{r.toConfirm || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
