"use client";
import { useId, useMemo, useRef, useState } from "react";
import { groupByZone, type LocalityOption } from "@/lib/localities";
import Icon from "./Icon";

interface Props {
  options: LocalityOption[];
  /** Form field name; a hidden input carries the chosen value. */
  name?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  /** Label of the "no locality" choice, e.g. "Any locality". Leave out to require a choice. */
  emptyLabel?: string;
  placeholder?: string;
  id?: string;
  inputClassName: string;
  invalid?: boolean;
}

/** Type-to-search select of localities, grouped under zone headings. Works with keyboard (arrows, Enter, Escape) and touch. */
export default function LocalitySelect({ options, name, value, defaultValue = "", onChange, emptyLabel, placeholder = "Search locality", id, inputClassName, invalid }: Props) {
  const [inner, setInner] = useState(defaultValue);
  const selected = value ?? inner;
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  const label = (o: LocalityOption) => (o.count != null ? `${o.name} (${o.count})` : o.name);
  const filtered = useMemo(() => {
    const t = query.trim().toLowerCase();
    return t ? options.filter((o) => o.name.toLowerCase().includes(t)) : options;
  }, [options, query]);
  const groups = useMemo(() => groupByZone(filtered), [filtered]);
  // Flat list in display order, with the empty choice first when allowed.
  const flat: (LocalityOption | null)[] = [...(emptyLabel && !query.trim() ? [null] : []), ...groups.flatMap((g) => g.items)];

  const choose = (v: string) => {
    if (value === undefined) setInner(v);
    onChange?.(v);
    setQuery("");
    setOpen(false);
  };
  const current = options.find((o) => o.name === selected);
  const shown = open ? query : current ? label(current) : selected;

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") { e.preventDefault(); setOpen(true); setActive((a) => Math.min(a + 1, flat.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    else if (e.key === "Enter") { if (open) { e.preventDefault(); const o = flat[active]; if (o !== undefined) choose(o ? o.name : ""); } }
    else if (e.key === "Escape") { if (open) { e.preventDefault(); e.stopPropagation(); setOpen(false); setQuery(""); } }
  }

  const hasEmpty = !!emptyLabel && !query.trim();
  const starts = groups.map((_, gi) => (hasEmpty ? 1 : 0) + groups.slice(0, gi).reduce((n, g) => n + g.items.length, 0));
  const optionId = (i: number) => `${listId}-o${i}`;
  return (
    <div className="relative">
      {name && <input type="hidden" name={name} value={selected} />}
      <input
        ref={inputRef}
        id={id}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open && flat.length ? optionId(active) : undefined}
        aria-invalid={invalid || undefined}
        autoComplete="off"
        value={shown}
        placeholder={current ? label(current) : selected || (emptyLabel ?? placeholder)}
        onFocus={() => { setOpen(true); setActive(0); }}
        onClick={() => setOpen(true)}
        onBlur={() => setTimeout(() => { setOpen(false); setQuery(""); }, 120)}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); setActive(0); }}
        onKeyDown={onKeyDown}
        className={`${inputClassName} pr-8`}
      />
      <Icon name="chevron" size={16} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted" />
      {open && (
        <ul id={listId} role="listbox" className="absolute left-0 right-0 z-30 mt-1 max-h-72 overflow-y-auto rounded-brand border border-line bg-white py-1 text-sm" onMouseDown={(e) => e.preventDefault()}>
          {hasEmpty && (
            <li id={optionId(0)} role="option" aria-selected={selected === ""} onClick={() => choose("")} onMouseEnter={() => setActive(0)} className={`cursor-pointer px-3 py-2 ${active === 0 ? "bg-bg" : ""} ${selected === "" ? "text-accent-ink" : "text-muted"}`}>{emptyLabel}</li>
          )}
          {groups.map((g, gi) => (
            <li key={g.zone} role="presentation">
              <p className="px-3 pb-1 pt-2 text-[11px] uppercase tracking-[0.1em] text-muted">{g.zone}</p>
              <ul role="group" aria-label={g.zone}>
                {g.items.map((o, k) => { const i = starts[gi] + k; return (
                  <li key={o.name} id={optionId(i)} role="option" aria-selected={selected === o.name} onClick={() => choose(o.name)} onMouseEnter={() => setActive(i)}
                    className={`flex cursor-pointer items-center justify-between gap-2 px-3 py-2 ${active === i ? "bg-bg" : ""} ${selected === o.name ? "text-accent-ink" : "text-ink"}`}>
                    <span>{o.name}</span>
                    {o.count != null && <span className="tabular text-xs text-muted">{o.count}</span>}
                  </li>
                ); })}
              </ul>
            </li>
          ))}
          {flat.length === 0 && <li className="px-3 py-2 text-muted">No locality matches “{query}”.</li>}
        </ul>
      )}
    </div>
  );
}
