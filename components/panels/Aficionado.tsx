import { Box, Fixture, Metrics, Standings, Table } from "@/components/ui";
import { completedRounds, computeStandings, lastPlayedRound, nextRound, playedMatches, type MatchRow } from "@/lib/standings";

export default function Aficionado({ section, matches }: { section: string; matches: MatchRow[] }) {
  const played = playedMatches(matches);
  const last = lastPlayedRound(matches);
  const next = nextRound(matches);
  const nextMatches = matches.filter((m) => !m.played && m.round === next);
  const standings = computeStandings(matches);
  const total = played.reduce((s, m) => s + (m.h ?? 0) + (m.a ?? 0), 0);

  if (section === "partidos")
    return (
      <>
        <Box title={`Resultados${played.length ? ` · Fechas 1 a ${last}` : ""}`}><Fixture items={played} empty="Todavía no hay resultados." /></Box>
        <Box title={`Próxima fecha${next ? ` · Fecha ${next}` : ""}`}><Fixture items={nextMatches} empty="No hay partidos programados." /></Box>
      </>
    );
  if (section === "posiciones") return <Box title="Tabla calculada desde los resultados"><Standings matches={matches} /></Box>;
  if (section === "estadisticas")
    return (
      <>
        <Metrics items={[
          ["Partidos jugados", played.length],
          ["Puntos totales", total],
          ["Promedio por partido", played.length ? (total / played.length).toFixed(1) : "–"],
          ["Equipos", standings.length],
        ]} />
        <Box title="Rendimiento por equipo">
          <Table head={["Equipo", "Puntos a favor", "En contra", "Diferencia"]}>
            {standings.map((x) => (
              <tr key={x.id}><td>{x.name}</td><td>{x.pf}</td><td>{x.pc}</td><td>{x.pf - x.pc}</td></tr>
            ))}
          </Table>
        </Box>
      </>
    );
  return (
    <>
      <Metrics items={[
        ["Equipos", standings.length],
        ["Partidos finalizados", played.length],
        ["Fechas completas", completedRounds(matches)],
        ["Próxima fecha", next ?? "–"],
      ]} />
      <div className="dashboard-grid">
        <Box title="Últimos resultados"><Fixture items={played.filter((m) => m.round === last)} empty="Todavía no hay resultados." /></Box>
        <Box title="Próxima jornada"><Fixture items={nextMatches} empty="No hay partidos programados." /></Box>
      </div>
    </>
  );
}
