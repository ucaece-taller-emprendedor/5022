"use client";

import { useActionState } from "react";
import { setResultAction } from "@/lib/actions/admin";

export default function ResultForm({ matchId, h, a }: { matchId: string; h: number | null; a: number | null }) {
  const [state, action, pending] = useActionState(setResultAction, null);
  return (
    <form action={action} style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
      <input type="hidden" name="matchId" value={matchId} />
      <input className="attendance-select" style={{ width: 64 }} name="homeScore" type="number" min={0} defaultValue={h ?? ""} aria-label="Puntos local" />
      <span className="muted">–</span>
      <input className="attendance-select" style={{ width: 64 }} name="awayScore" type="number" min={0} defaultValue={a ?? ""} aria-label="Puntos visitante" />
      <button className="btn" style={{ padding: "8px 12px", fontSize: 12 }} disabled={pending}>{pending ? "…" : "Guardar"}</button>
      {state && !state.ok && <span className="mini" role="alert">{state.error}</span>}
    </form>
  );
}
