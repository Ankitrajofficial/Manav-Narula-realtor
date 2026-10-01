"use client";
import { useFormStatus } from "react-dom";

export const fieldCls = "rounded-brand border border-line bg-white px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-ink disabled:bg-bg";
export const inputCls = "w-full rounded-brand border border-line bg-white px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-ink disabled:bg-bg";
export const labelCls = "mb-1 block text-xs font-medium text-ink";

export function Field({ label, htmlFor, error, hint, children, className = "" }: { label: string; htmlFor?: string; error?: string; hint?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className={labelCls}>{label}</label>
      {children}
      {error ? <p className="mt-1 text-xs text-red-700" role="alert">{error}</p> : hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement> & { error?: string }) {
  const { error, className = "", ...rest } = props;
  return <input {...rest} aria-invalid={!!error} className={`${inputCls} ${error ? "border-red-600" : ""} ${className}`} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement> & { error?: string }) {
  const { error, className = "", children, ...rest } = props;
  return <select {...rest} aria-invalid={!!error} className={`${inputCls} ${error ? "border-red-600" : ""} ${className}`}>{children}</select>;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: string; ref?: React.Ref<HTMLTextAreaElement> }) {
  const { error, className = "", ref, ...rest } = props;
  return <textarea {...rest} ref={ref} aria-invalid={!!error} className={`${inputCls} ${error ? "border-red-600" : ""} ${className}`} />;
}

export function SubmitButton({ children, variant = "primary", className = "", formAction, name, value }: { children: React.ReactNode; variant?: "primary" | "secondary" | "danger"; className?: string; formAction?: (fd: FormData) => void | Promise<void>; name?: string; value?: string }) {
  const { pending } = useFormStatus();
  const v = variant === "primary" ? "bg-accent text-white hover:bg-accent-ink" : variant === "danger" ? "bg-red-700 text-white hover:bg-red-800" : "border border-line bg-white text-ink hover:border-ink";
  return (
    <button type="submit" disabled={pending} formAction={formAction} name={name} value={value} className={`inline-flex items-center justify-center gap-2 rounded-brand px-4 py-2 text-sm font-medium disabled:opacity-60 ${v} ${className}`}>
      {pending ? "Saving…" : children}
    </button>
  );
}

export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="rounded-brand border border-red-600 bg-white px-3 py-2 text-sm text-red-700" role="alert">{message}</p>;
}

export function Section({ title, children, description }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-brand border border-line bg-white p-5">
      <h2 className="text-base">{title}</h2>
      {description && <p className="mt-1 text-xs text-muted">{description}</p>}
      <div className="mt-4 grid gap-4 md:grid-cols-2">{children}</div>
    </section>
  );
}
