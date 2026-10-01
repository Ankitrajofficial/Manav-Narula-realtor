/** A yes/no switch rendered as a form button; `action` is a bound server action that flips the value. Usable from server components. */
export default function ToggleForm({ on, action, label }: { on: boolean; action: () => Promise<void>; label: string }) {
  return (
    <form action={action}>
      <button type="submit" role="switch" aria-checked={on} aria-label={label} title={label} className={`relative inline-flex h-5 w-9 items-center rounded-full border transition-colors ${on ? "border-accent bg-accent" : "border-line bg-white"}`}>
        <span className={`inline-block h-3.5 w-3.5 rounded-full transition-transform ${on ? "translate-x-[18px] bg-white" : "translate-x-[3px] bg-muted"}`} />
      </button>
    </form>
  );
}
