/**
 * Console form classes. Kept out of Form.tsx ("use client") on purpose: a server component that imports a value from a
 * client module gets a client reference, not the string, and its inputs render unstyled.
 */
export const fieldCls = "rounded-brand border border-line bg-white px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-ink disabled:bg-bg";
export const inputCls = "w-full rounded-brand border border-line bg-white px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-ink disabled:bg-bg";
export const labelCls = "mb-1 block text-xs font-medium text-ink";
