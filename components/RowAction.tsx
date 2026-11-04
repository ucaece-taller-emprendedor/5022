"use client";

import { useState, useTransition } from "react";
import type { ActionResult } from "@/lib/actions/result";

/** Botón de una fila que ejecuta una server action (aprobar, quitar, etc.). */
export default function RowAction({
  action,
  label,
  confirm,
  primary,
}: {
  action: () => Promise<ActionResult>;
  label: string;
  confirm?: string;
  primary?: boolean;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <>
      <button
        className={`btn${primary ? " primary" : ""}`}
        style={{ padding: "8px 12px", fontSize: 12 }}
        disabled={pending}
        onClick={() => {
          if (confirm && !window.confirm(confirm)) return;
          start(async () => {
            const r = await action();
            setError(r.ok ? null : r.error);
          });
        }}
      >
        {pending ? "…" : label}
      </button>
      {error && <span className="mini" role="alert" style={{ marginLeft: 8, color: "#ffce94" }}>{error}</span>}
    </>
  );
}
