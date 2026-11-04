"use client";

import { useActionState, useEffect, useRef, type ReactNode } from "react";
import type { ActionResult } from "@/lib/actions/result";

type Props = {
  action: (prev: ActionResult | null, fd: FormData) => Promise<ActionResult>;
  submitLabel: string;
  children: ReactNode;
  id?: string;
};

/** Formulario que llama a una server action y muestra su resultado (éxito o error). */
export default function ActionForm({ action, submitLabel, children, id }: Props) {
  const [state, formAction, pending] = useActionState(action, null);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) ref.current?.reset();
  }, [state]);
  return (
    <form id={id} ref={ref} action={formAction}>
      {children}
      {state && !state.ok && <p className="mini" role="alert">{state.error}</p>}
      {state?.ok && state.message && <p className="mini" style={{ color: "var(--lime)" }} role="status">{state.message}</p>}
      <button className="btn primary" type="submit" disabled={pending}>
        {pending ? "Guardando…" : submitLabel}
      </button>
    </form>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="field">
      <label>{label}</label>
      {children}
    </div>
  );
}
