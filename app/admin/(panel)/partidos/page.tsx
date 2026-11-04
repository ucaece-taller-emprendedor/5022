import AdminShell from "@/components/AdminShell";
import ActionForm, { Field } from "@/components/ActionForm";
import CategoryTabs from "@/components/CategoryTabs";
import ResultForm from "@/components/ResultForm";
import RowAction from "@/components/RowAction";
import { Box, Table } from "@/components/ui";
import { createMatchAction, deleteMatchAction } from "@/lib/actions/admin";
import { getActiveClubs, getMatches, resolveCategory } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function Partidos({ searchParams }: { searchParams: Promise<{ categoria?: string }> }) {
  const { categoria } = await searchParams;
  const { all, current } = await resolveCategory(categoria);
  const [clubs, matches] = await Promise.all([getActiveClubs(), current ? getMatches(current.id) : Promise.resolve([])]);
  return (
    <AdminShell active="partidos">
      <CategoryTabs categories={all} currentId={current?.id} basePath="/admin/partidos" />
      {!current ? (
        <Box title="Partidos"><p className="muted">Primero creá una categoría.</p></Box>
      ) : (
        <>
          <Box title="Nuevo partido">
            <ActionForm action={createMatchAction} submitLabel="Cargar partido">
              <input type="hidden" name="categoryId" value={current.id} />
              <Field label="Fecha (número de jornada)"><input name="round" type="number" min={1} required defaultValue={1} /></Field>
              <Field label="Local"><select name="homeClubId" required>{clubs.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
              <Field label="Visitante"><select name="awayClubId" required>{clubs.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
              <Field label="Puntos local (vacío si no se jugó)"><input name="homeScore" type="number" min={0} /></Field>
              <Field label="Puntos visitante (vacío si no se jugó)"><input name="awayScore" type="number" min={0} /></Field>
            </ActionForm>
          </Box>
          <Box title={`${current.competition} · ${current.name} · ${matches.length} partidos`}>
            <Table head={["Fecha", "Partido", "Resultado", ""]}>
              {matches.map((m) => (
                <tr key={m.id}>
                  <td>{m.round}</td>
                  <td><b>{m.home}</b> <span className="muted">vs</span> <b>{m.away}</b></td>
                  <td><ResultForm matchId={m.id} h={m.h} a={m.a} /></td>
                  <td><RowAction label="Eliminar" confirm="¿Eliminar este partido?" action={deleteMatchAction.bind(null, m.id)} /></td>
                </tr>
              ))}
            </Table>
          </Box>
        </>
      )}
    </AdminShell>
  );
}
