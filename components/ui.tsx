import type { ReactNode } from "react";
import { computeStandings, type MatchRow } from "@/lib/standings";

export function Box({ title, children }: { title: ReactNode; children: ReactNode }) {
  return (
    <section className="panel">
      <h3>{title}</h3>
      {children}
    </section>
  );
}

export function Metrics({ items, note = "Datos demo" }: { items: [string, ReactNode][]; note?: string }) {
  return (
    <div className="statgrid">
      {items.map(([label, val]) => (
        <div className="stat" key={label}>
          <span>{label}</span>
          <b>{val}</b>
          <span>{note}</span>
        </div>
      ))}
    </div>
  );
}

export function Fixture({ items, empty = "Sin partidos para mostrar." }: { items: MatchRow[]; empty?: string }) {
  if (!items.length) return <p className="muted">{empty}</p>;
  return (
    <>
      {items.map((m) => (
        <div className="fixture" key={m.id}>
          <div>
            <div className="fixture-names">
              {m.home} <span className="muted">vs</span> {m.away}
            </div>
            <div className="fixture-sub">
              Fecha {m.round} · {m.played ? "Finalizado" : "A programar"}
            </div>
          </div>
          <div className="fixture-score">{m.played ? `${m.h} – ${m.a}` : "Pendiente"}</div>
        </div>
      ))}
    </>
  );
}

export function Standings({ matches }: { matches: MatchRow[] }) {
  const rows = computeStandings(matches);
  return (
    <>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>#</th><th>Equipo</th><th>PJ</th><th>G</th><th>E</th><th>P</th><th>PF</th><th>PC</th><th>Pts</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((x, i) => (
              <tr key={x.id}>
                <td className="rank">{i + 1}</td>
                <td><b>{x.name}</b></td>
                <td>{x.pj}</td><td>{x.g}</td><td>{x.e}</td><td>{x.p}</td><td>{x.pf}</td><td>{x.pc}</td>
                <td><b>{x.pts}</b></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mini">Sistema simplificado de demo: 4 puntos por victoria y 2 por empate; no se aplican bonus.</p>
    </>
  );
}

export function Table({ head, children }: { head: ReactNode[]; children: ReactNode }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>{head.map((h, i) => <th key={i}>{h}</th>)}</tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
