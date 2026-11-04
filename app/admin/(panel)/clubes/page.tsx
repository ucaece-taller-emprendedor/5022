import AdminShell from "@/components/AdminShell";
import ActionForm, { Field } from "@/components/ActionForm";
import RowAction from "@/components/RowAction";
import { Box, Table } from "@/components/ui";
import { createClubAction, deleteClubAction } from "@/lib/actions/admin";
import { getClubs } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function Clubes() {
  const clubs = await getClubs();
  return (
    <AdminShell active="clubes">
      <Box title="Nuevo club">
        <ActionForm action={createClubAction} submitLabel="Crear club">
          <Field label="Nombre del club"><input name="name" required placeholder="Ej: Club Atlético…" /></Field>
        </ActionForm>
      </Box>
      <Box title={`Clubes · ${clubs.length}`}>
        <Table head={["Club", "Estado", ""]}>
          {clubs.map((c) => (
            <tr key={c.id}>
              <td>{c.name} {c.isDemo && <span className="badge-demo">DEMO</span>}</td>
              <td>{c.status === "activo" ? "Activo" : "Pendiente de aprobación"}</td>
              <td><RowAction label="Eliminar" confirm={`¿Eliminar el club ${c.name}? Se borra también su plantel.`} action={deleteClubAction.bind(null, c.id)} /></td>
            </tr>
          ))}
        </Table>
        <p className="mini">Un club con partidos cargados no se puede eliminar hasta borrar sus partidos.</p>
      </Box>
    </AdminShell>
  );
}
