import ActionForm, { Field } from "@/components/ActionForm";
import AttendanceSelect from "@/components/AttendanceSelect";
import RowAction from "@/components/RowAction";
import { Box, Fixture, Metrics, Table } from "@/components/ui";
import { addInjuryAction, addPlayerAction, deleteInjuryAction, deletePlayerAction } from "@/lib/actions/club";
import { INJURY_AREAS, INJURY_STATUSES } from "@/lib/db/schema";
import { getAttendance, getInjuries, getPlayers } from "@/lib/queries";
import { computeStandings, type MatchRow } from "@/lib/standings";

export default async function Club({
  section, clubId, clubName, matches, date,
}: { section: string; clubId: string; clubName: string; matches: MatchRow[]; date: string }) {
  const clubGames = matches.filter((m) => m.homeId === clubId || m.awayId === clubId);
  const record = computeStandings(matches).find((x) => x.id === clubId) ?? { pj: 0, g: 0, e: 0, p: 0, pf: 0, pc: 0, pts: 0 };
  const players = await getPlayers(clubId);

  if (section === "plantel")
    return (
      <>
        <Box title={`Plantel · ${players.length} ${players.length === 1 ? "jugador" : "jugadores"}`}>
          {players.length ? (
            <Table head={["Jugador", "Posición", "PJ", "Tries", ""]}>
              {players.map((p) => (
                <tr key={p.id}>
                  <td>{p.name}</td><td>{p.position}</td><td>{p.matchesPlayed}</td><td>{p.tries}</td>
                  <td><RowAction label="Quitar" confirm={`¿Quitar a ${p.name} del plantel?`} action={deletePlayerAction.bind(null, p.id)} /></td>
                </tr>
              ))}
            </Table>
          ) : <p className="muted">Todavía no cargaste jugadores. Agregá el primero abajo.</p>}
        </Box>
        <Box title="Agregar jugador">
          <ActionForm action={addPlayerAction} submitLabel="Agregar al plantel">
            <Field label="Nombre"><input name="name" required placeholder="Nombre y apellido" /></Field>
            <Field label="Posición"><input name="position" required placeholder="Ej: Pilar, Apertura, Wing" /></Field>
            <Field label="Partidos jugados"><input name="matchesPlayed" type="number" min={0} defaultValue={0} /></Field>
            <Field label="Tries"><input name="tries" type="number" min={0} defaultValue={0} /></Field>
          </ActionForm>
        </Box>
      </>
    );

  if (section === "asistencias") {
    const saved = await getAttendance(clubId, date);
    const count = (s: string) => players.filter((p) => saved[p.id] === s).length;
    return (
      <>
        <Metrics items={[
          ["Jugadores", players.length],
          ["Presentes", count("presente")],
          ["Ausentes", count("ausente")],
          ["Sin registrar", players.filter((p) => !saved[p.id]).length],
        ]} />
        <Box title="Asistencia al entrenamiento">
          <p className="muted">Marcá la asistencia de cada jugador. Los cambios se guardan en la base de datos.</p>
          <form method="get" className="field">
            <label htmlFor="att-date">Fecha de entrenamiento</label>
            <input type="date" id="att-date" name="fecha" defaultValue={date} aria-label="Fecha del entrenamiento" />
            <button className="btn" type="submit" style={{ marginTop: 10 }}>Ver fecha</button>
          </form>
          {players.length ? (
            <Table head={["Jugador", "Posición", "Asistencia"]}>
              {players.map((p) => (
                <tr key={p.id}>
                  <td>{p.name}</td><td>{p.position}</td>
                  <td><AttendanceSelect key={`${p.id}-${date}`} playerId={p.id} name={p.name} date={date} value={saved[p.id] ?? ""} /></td>
                </tr>
              ))}
            </Table>
          ) : <p className="muted">Primero cargá jugadores en la sección Plantel.</p>}
        </Box>
      </>
    );
  }

  if (section === "lesiones") {
    const data = await getInjuries(clubId);
    return (
      <>
        <Metrics items={[
          ["Lesiones registradas", data.length],
          ["En recuperación", data.filter((x) => x.status === "En recuperación").length],
          ["Alta deportiva", data.filter((x) => x.status === "Alta deportiva").length],
          ["Jugadores del plantel", players.length],
        ]} />
        <Box title="Registrar lesión">
          <p className="muted">Registro interno de ejemplo. Evitá ingresar información médica real: esta demo no tiene controles de privacidad avanzados.</p>
          {players.length ? (
            <ActionForm action={addInjuryAction} submitLabel="Guardar registro">
              <Field label="Jugador">
                <select name="playerId" required>{players.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
              </Field>
              <Field label="Fecha"><input type="date" name="date" required defaultValue={date} /></Field>
              <Field label="Zona afectada (ejemplo)">
                <select name="area">{INJURY_AREAS.map((a) => <option key={a}>{a}</option>)}</select>
              </Field>
              <Field label="Estado">
                <select name="status">{INJURY_STATUSES.map((a) => <option key={a}>{a}</option>)}</select>
              </Field>
            </ActionForm>
          ) : <p className="muted">Primero cargá jugadores en la sección Plantel.</p>}
        </Box>
        <Box title="Seguimiento de lesiones">
          {data.length ? (
            <Table head={["Jugador", "Fecha", "Zona", "Estado", ""]}>
              {data.map((x) => (
                <tr key={x.id}>
                  <td>{x.player}</td><td>{x.date}</td><td>{x.area}</td><td>{x.status}</td>
                  <td><RowAction label="Quitar" action={deleteInjuryAction.bind(null, x.id)} /></td>
                </tr>
              ))}
            </Table>
          ) : <p className="muted">Todavía no hay lesiones registradas.</p>}
        </Box>
      </>
    );
  }

  if (section === "partidos") return <Box title="Calendario del club"><Fixture items={clubGames} empty="Tu club todavía no tiene partidos cargados." /></Box>;

  if (section === "rendimiento")
    return (
      <>
        <Metrics items={[
          ["PJ", record.pj],
          ["G / E / P", `${record.g} / ${record.e} / ${record.p}`],
          ["Puntos a favor", record.pf],
          ["Puntos en contra", record.pc],
        ]} />
        <Box title="Resumen deportivo">
          <p className="muted">
            Diferencia de puntos: <b>{record.pf - record.pc > 0 ? "+" : ""}{record.pf - record.pc}</b>. Estos valores se calculan a partir de los mismos partidos visibles para los aficionados.
          </p>
        </Box>
      </>
    );

  return (
    <>
      <Metrics items={[["Club", clubName], ["Partidos jugados", record.pj], ["Victorias", record.g], ["Puntos en tabla", record.pts]]} />
      <div className="dashboard-grid">
        <Box title="Mis partidos"><Fixture items={clubGames} empty="Tu club todavía no tiene partidos cargados." /></Box>
        <Box title="Próximo rival"><Fixture items={clubGames.filter((m) => !m.played).slice(0, 1)} empty="Sin próximo rival." /></Box>
      </div>
    </>
  );
}
