import AdminShell from "@/components/AdminShell";
import ActionForm, { Field } from "@/components/ActionForm";
import RowAction from "@/components/RowAction";
import { Box, Table } from "@/components/ui";
import { createCategoryAction, deleteCategoryAction } from "@/lib/actions/admin";
import { getCategories } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function Categorias() {
  const cats = await getCategories();
  return (
    <AdminShell active="categorias">
      <Box title="Nueva categoría">
        <ActionForm action={createCategoryAction} submitLabel="Crear categoría">
          <Field label="Competencia"><input name="competition" required placeholder="Ej: Torneo Regional" /></Field>
          <Field label="Categoría"><input name="name" required placeholder="Ej: Primera" /></Field>
          <Field label="Temporada"><input name="season" required placeholder="Ej: Temporada 2026" /></Field>
        </ActionForm>
      </Box>
      <Box title={`Categorías · ${cats.length}`}>
        <Table head={["Competencia", "Categoría", "Temporada", ""]}>
          {cats.map((c) => (
            <tr key={c.id}>
              <td>{c.competition} {c.isDemo && <span className="badge-demo">DEMO</span>}</td><td>{c.name}</td><td>{c.season}</td>
              <td><RowAction label="Eliminar" confirm={`¿Eliminar ${c.competition} · ${c.name}? Se borran también sus partidos.`} action={deleteCategoryAction.bind(null, c.id)} /></td>
            </tr>
          ))}
        </Table>
      </Box>
    </AdminShell>
  );
}
