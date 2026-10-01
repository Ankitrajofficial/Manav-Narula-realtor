"use client";
import Image from "next/image";
import { useActionState, useEffect, useState, useTransition } from "react";
import Icon from "@/components/Icon";
import { Field, FormError, Input, SubmitButton } from "@/components/console/Form";
import { deleteBank, deleteVideo, reorderBanks, reorderVideos, saveBank, saveVideo, toggleBank, toggleVideo, type ItemFormState } from "./actions";

export interface BankItem { id: number; name: string; tagline: string | null; logo_url: string | null; is_active: boolean }
export interface VideoItem { id: number; youtube_id: string; title: string | null; is_active: boolean }

/** Rows that can be dragged into a new order (desktop) or moved with the arrow buttons (phone and keyboard). */
function SortableList<T extends { id: number }>({ items, onReorder, render }: { items: T[]; onReorder: (ids: number[]) => Promise<void>; render: (item: T, controls: React.ReactNode) => React.ReactNode }) {
  const [list, setList] = useState(items);
  const [dragId, setDragId] = useState<number | null>(null);
  const [, start] = useTransition();
  const [prevItems, setPrevItems] = useState(items);
  if (items !== prevItems) { setPrevItems(items); setList(items); }
  const commit = (next: T[]) => { setList(next); start(() => onReorder(next.map((x) => x.id))); };
  const move = (from: number, to: number) => {
    if (to < 0 || to >= list.length || from === to) return;
    const next = [...list];
    const [it] = next.splice(from, 1);
    next.splice(to, 0, it);
    commit(next);
  };
  return (
    <ul className="divide-y divide-line rounded-brand border border-line bg-white">
      {list.map((item, i) => (
        <li
          key={item.id}
          onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }}
          onDrop={(e) => { e.preventDefault(); if (dragId != null) move(list.findIndex((x) => x.id === dragId), i); setDragId(null); }}
          onDragEnd={() => setDragId(null)}
          className={dragId === item.id ? "opacity-50" : ""}
        >
          {render(item, (
            <span className="flex shrink-0 items-center gap-1">
              <span draggable onDragStart={(e) => { setDragId(item.id); e.dataTransfer.effectAllowed = "move"; }} className="hidden cursor-grab px-1 text-muted active:cursor-grabbing md:inline" title="Drag to reorder" aria-hidden="true"><Icon name="menu" size={16} /></span>
              <button type="button" onClick={() => move(i, i - 1)} disabled={i === 0} aria-label="Move up" className="flex h-8 w-8 items-center justify-center rounded-brand border border-line hover:border-ink disabled:opacity-40"><Icon name="up" size={12} /></button>
              <button type="button" onClick={() => move(i, i + 1)} disabled={i === list.length - 1} aria-label="Move down" className="flex h-8 w-8 items-center justify-center rounded-brand border border-line hover:border-ink disabled:opacity-40"><Icon name="down" size={12} /></button>
            </span>
          ))}
        </li>
      ))}
    </ul>
  );
}

function Switch({ on, label, onToggle }: { on: boolean; label: string; onToggle: () => Promise<void> }) {
  const [pending, start] = useTransition();
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} title={label} disabled={pending} onClick={() => start(onToggle)} className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition-colors disabled:opacity-60 ${on ? "border-accent bg-accent" : "border-line bg-white"}`}>
      <span className={`inline-block h-3.5 w-3.5 rounded-full transition-transform ${on ? "translate-x-[18px] bg-white" : "translate-x-[3px] bg-muted"}`} />
    </button>
  );
}

function DeleteButton({ onDelete, label }: { onDelete: () => Promise<void>; label: string }) {
  const [arm, setArm] = useState(false);
  const [pending, start] = useTransition();
  if (!arm) return <button type="button" onClick={() => setArm(true)} aria-label={label} className="flex h-8 w-8 items-center justify-center rounded-brand border border-line text-red-700 hover:border-red-700"><Icon name="trash" size={14} /></button>;
  return (
    <span className="inline-flex items-center gap-1">
      <button type="button" disabled={pending} onClick={() => start(onDelete)} className="rounded-brand bg-red-700 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-red-800">Delete</button>
      <button type="button" onClick={() => setArm(false)} className="rounded-brand border border-line px-2.5 py-1.5 text-xs">Cancel</button>
    </span>
  );
}

function useClosingForm(action: (p: ItemFormState, fd: FormData) => Promise<ItemFormState>, onDone: () => void) {
  const [state, act] = useActionState<ItemFormState, FormData>(action, {});
  useEffect(() => { if (state.ok) onDone(); }, [state.ok]); // eslint-disable-line react-hooks/exhaustive-deps
  return [state, act] as const;
}

function BankForm({ bank, onDone }: { bank?: BankItem; onDone: () => void }) {
  const [state, act] = useClosingForm(saveBank.bind(null, bank?.id ?? null), onDone);
  const e = state.errors ?? {};
  return (
    <form action={act} className="space-y-3 bg-bg p-4">
      <FormError message={state.message} />
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Bank name" htmlFor={`bank-name-${bank?.id ?? "new"}`} error={e.name}><Input id={`bank-name-${bank?.id ?? "new"}`} name="name" defaultValue={bank?.name} required maxLength={80} /></Field>
        <Field label="Short line" htmlFor={`bank-line-${bank?.id ?? "new"}`} hint="For example: Rates from 8.4%"><Input id={`bank-line-${bank?.id ?? "new"}`} name="tagline" defaultValue={bank?.tagline ?? ""} maxLength={80} /></Field>
        <Field label="Logo" htmlFor={`bank-logo-${bank?.id ?? "new"}`} error={e.logo} hint="PNG, JPG or WebP. Shown in greyscale, full colour on hover.">
          <input id={`bank-logo-${bank?.id ?? "new"}`} name="logo" type="file" accept="image/png,image/jpeg,image/webp" className="block w-full text-sm" />
        </Field>
        <div className="flex flex-col justify-end gap-2 pb-1 text-sm">
          {bank?.logo_url && (
            <>
              <input type="hidden" name="logo_current" value={bank.logo_url} />
              <label className="flex items-center gap-2"><input type="checkbox" name="remove_logo" className="accent-[#00BF63]" />Remove current logo</label>
            </>
          )}
          <label className="flex items-center gap-2"><input type="checkbox" name="is_active" defaultChecked={bank?.is_active ?? true} className="accent-[#00BF63]" />Show on the website</label>
        </div>
      </div>
      <div className="flex gap-2">
        <SubmitButton>{bank ? "Save bank" : "Add bank"}</SubmitButton>
        <button type="button" onClick={onDone} className="rounded-brand border border-line bg-white px-4 py-2 text-sm hover:border-ink">Cancel</button>
      </div>
    </form>
  );
}

function VideoForm({ video, onDone }: { video?: VideoItem; onDone: () => void }) {
  const [state, act] = useClosingForm(saveVideo.bind(null, video?.id ?? null), onDone);
  const e = state.errors ?? {};
  const key = video?.id ?? "new";
  return (
    <form action={act} className="space-y-3 bg-bg p-4">
      <FormError message={state.message} />
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="YouTube link" htmlFor={`video-url-${key}`} error={e.url} hint="Watch, youtu.be, Shorts and embed links all work."><Input id={`video-url-${key}`} name="url" defaultValue={video ? `https://www.youtube.com/watch?v=${video.youtube_id}` : ""} required placeholder="https://www.youtube.com/watch?v=…" /></Field>
        <Field label="Title" htmlFor={`video-title-${key}`} hint="Leave blank to use the YouTube title."><Input id={`video-title-${key}`} name="title" defaultValue={video?.title ?? ""} maxLength={120} /></Field>
      </div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="is_active" defaultChecked={video?.is_active ?? true} className="accent-[#00BF63]" />Show on the website</label>
      <div className="flex gap-2">
        <SubmitButton>{video ? "Save video" : "Add video"}</SubmitButton>
        <button type="button" onClick={onDone} className="rounded-brand border border-line bg-white px-4 py-2 text-sm hover:border-ink">Cancel</button>
      </div>
    </form>
  );
}

export function BanksManager({ banks }: { banks: BankItem[] }) {
  const [editing, setEditing] = useState<number | "new" | null>(null);
  return (
    <div className="space-y-3">
      {banks.length === 0 ? <p className="rounded-brand border border-line bg-white p-4 text-sm text-muted">No partner banks yet.</p> : (
        <SortableList items={banks} onReorder={reorderBanks} render={(b, controls) => (
          <>
            <div className="flex items-center gap-3 px-3 py-2.5">
              {controls}
              <span className="relative flex h-10 w-16 shrink-0 items-center justify-center overflow-hidden rounded-brand border border-line bg-white">
                {b.logo_url ? <Image src={b.logo_url} alt="" fill sizes="64px" className="object-contain p-1" /> : <Icon name="bank" size={18} className="text-muted" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{b.name}</p>
                <p className="truncate text-xs text-muted">{b.tagline || "No short line"}</p>
              </div>
              <Switch on={b.is_active} label={b.is_active ? `Hide ${b.name}` : `Show ${b.name}`} onToggle={() => toggleBank(b.id, !b.is_active)} />
              <button type="button" onClick={() => setEditing(editing === b.id ? null : b.id)} aria-label={`Edit ${b.name}`} className="flex h-8 w-8 items-center justify-center rounded-brand border border-line hover:border-ink"><Icon name="edit" size={14} /></button>
              <DeleteButton label={`Delete ${b.name}`} onDelete={() => deleteBank(b.id)} />
            </div>
            {editing === b.id && <BankForm bank={b} onDone={() => setEditing(null)} />}
          </>
        )} />
      )}
      {editing === "new" ? (
        <div className="overflow-hidden rounded-brand border border-line"><BankForm onDone={() => setEditing(null)} /></div>
      ) : (
        <button type="button" onClick={() => setEditing("new")} className="inline-flex items-center gap-1.5 rounded-brand bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-ink"><Icon name="plus" size={16} />Add bank</button>
      )}
    </div>
  );
}

export function VideosManager({ videos }: { videos: VideoItem[] }) {
  const [editing, setEditing] = useState<number | "new" | null>(null);
  return (
    <div className="space-y-3">
      {videos.length === 0 ? <p className="rounded-brand border border-line bg-white p-4 text-sm text-muted">No videos yet. The video section stays hidden on the website until you add one.</p> : (
        <SortableList items={videos} onReorder={reorderVideos} render={(v, controls) => (
          <>
            <div className="flex items-center gap-3 px-3 py-2.5">
              {controls}
              <span className="relative h-10 w-16 shrink-0 overflow-hidden rounded-brand border border-line bg-ink">
                <Image src={`https://i.ytimg.com/vi/${v.youtube_id}/mqdefault.jpg`} alt="" fill sizes="64px" className="object-cover" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{v.title || "Untitled video"}</p>
                <a href={`https://www.youtube.com/watch?v=${v.youtube_id}`} target="_blank" rel="noopener" className="text-xs text-muted hover:text-ink">youtu.be/{v.youtube_id}</a>
              </div>
              <Switch on={v.is_active} label={v.is_active ? "Hide video" : "Show video"} onToggle={() => toggleVideo(v.id, !v.is_active)} />
              <button type="button" onClick={() => setEditing(editing === v.id ? null : v.id)} aria-label="Edit video" className="flex h-8 w-8 items-center justify-center rounded-brand border border-line hover:border-ink"><Icon name="edit" size={14} /></button>
              <DeleteButton label="Delete video" onDelete={() => deleteVideo(v.id)} />
            </div>
            {editing === v.id && <VideoForm video={v} onDone={() => setEditing(null)} />}
          </>
        )} />
      )}
      {editing === "new" ? (
        <div className="overflow-hidden rounded-brand border border-line"><VideoForm onDone={() => setEditing(null)} /></div>
      ) : (
        <button type="button" onClick={() => setEditing("new")} className="inline-flex items-center gap-1.5 rounded-brand bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-ink"><Icon name="plus" size={16} />Add video</button>
      )}
    </div>
  );
}
