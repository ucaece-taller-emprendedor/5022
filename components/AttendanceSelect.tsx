"use client";

import { useState, useTransition } from "react";
import { setAttendanceAction } from "@/lib/actions/club";

export default function AttendanceSelect({
  playerId, name, date, value,
}: { playerId: string; name: string; date: string; value: string }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <>
      <select
        className="attendance-select"
        aria-label={`Asistencia de ${name}`}
        defaultValue={value}
        disabled={pending}
        onChange={(e) => {
          const status = e.target.value;
          start(async () => {
            const r = await setAttendanceAction({ playerId, date, status });
            setError(r.ok ? null : r.error);
          });
        }}
      >
        <option value="">Sin registrar</option>
        <option value="presente">Presente</option>
        <option value="ausente">Ausente</option>
        <option value="justificado">Justificado</option>
      </select>
      {error && <span className="mini" role="alert">{error}</span>}
    </>
  );
}
