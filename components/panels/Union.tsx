import { Box, Fixture, Metrics, Standings, Table } from "@/components/ui";
import { nextRound, playedMatches, type MatchRow } from "@/lib/standings";

type Cat = { id: string; competition: string; name: string; season: string };
type ClubRow = { id: string; name: string; isDemo: boolean };

export default function Union({
  section, matches, category, categories, clubs, allMatches,
}: {
  section: string;
  matches: MatchRow[];
  category: Cat | null;
  categories: Cat[];
  clubs: ClubRow[];
  allMatches: MatchRow[];
}) {
  const played = playedMatches(matches);
  const next = nextRound(matches);
  const rounds = [...new Set(matches.map((m) => m.round))].sort((a, b) => a - b);
  const label = category ? `${category.competition} · ${category.name}` : "Sin competencias";
  const clubCount = new Set(matches.flatMap((m) => [m.homeId, m.awayId])).size;

  if (section === "competencias")
    return (
      <>
        <Box title={label}>
          <p className="muted">{category?.season} · {clubCount} clubes participantes · {played.length} encuentros finalizados.</p>
        </Box>
        <Box title="Clasificación"><Standings matches={matches} /></Box>
      </>
    );
  if (section === "calendario")
    return rounds.length ? (
      <>{rounds.map((r) => <Box key={r} title={`Fecha ${r}`}><Fixture items={matches.filter((m) => m.round === r)} /></Box>)}</>
    ) : <Box title="Calendario"><p className="muted">Todavía no hay partidos cargados.</p></Box>;
  if (section === "clubes")
    return (
      <Box title="Clubes participantes">
        <Table head={["Club", "Competencia", "Estado"]}>
          {clubs.map((c) => {
            const comps = [...new Set(allMatches.filter((m) => m.homeId === c.id || m.awayId === c.id).map((m) => m.categoryId))]
              .map((id) => categories.find((x) => x.id === id))
              .filter((x): x is Cat => Boolean(x))
              .map((x) => `${x.competition} · ${x.name}`);
            return (
              <tr key={c.id}><td>{c.name}</td><td>{comps.join(", ") || "–"}</td><td>{c.isDemo ? "Demo" : "Activo"}</td></tr>
            );
          })}
        </Table>
      </Box>
    );
  return (
    <>
      <Metrics items={[
        ["Clubes", clubs.length],
        ["Torneos demo", categories.length],
        ["Partidos disputados", played.length],
        ["Partidos programables", matches.filter((m) => !m.played).length],
      ]} />
      <div className="dashboard-grid">
        <Box title="Competencia activa">
          <div className="fixture"><b>{label}</b><span className="pill">DEMO</span></div>
          <p className="muted">{clubCount} equipos · {rounds.length} fechas ilustrativas</p>
        </Box>
        <Box title="Próxima jornada"><Fixture items={matches.filter((m) => !m.played && m.round === next)} empty="No hay partidos programados." /></Box>
      </div>
    </>
  );
}
