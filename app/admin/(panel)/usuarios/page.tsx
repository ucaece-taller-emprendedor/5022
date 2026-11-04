import AdminShell from "@/components/AdminShell";
import RowAction from "@/components/RowAction";
import { Box, Table } from "@/components/ui";
import { setUserStatusAction } from "@/lib/actions/admin";
import { getUsers } from "@/lib/queries";

export const dynamic = "force-dynamic";

const ROLE_LABEL = { aficionado: "Aficionado", club: "Club", union: "Unión", admin: "Superadmin" } as const;

export default async function Usuarios() {
  const users = await getUsers();
  const pending = users.filter((u) => u.status === "pendiente" && (u.role === "club" || u.role === "union"));
  const act = (userId: string, status: string) => setUserStatusAction.bind(null, { userId, status });
  return (
    <AdminShell active="usuarios">
      <Box title={`Pendientes de aprobación · ${pending.length}`}>
        {pending.length ? (
          <Table head={["Nombre", "Correo", "Perfil", "Organización", ""]}>
            {pending.map((u) => (
              <tr key={u.id}>
                <td>{u.name}</td><td>{u.email}</td><td>{ROLE_LABEL[u.role]}</td><td>{u.organization ?? u.clubName ?? "–"}</td>
                <td style={{ whiteSpace: "nowrap" }}>
                  <RowAction primary label="Aprobar" action={act(u.id, "aprobado")} />{" "}
                  <RowAction label="Rechazar" confirm={`¿Rechazar la cuenta de ${u.email}?`} action={act(u.id, "rechazado")} />
                </td>
              </tr>
            ))}
          </Table>
        ) : <p className="muted">No hay cuentas pendientes.</p>}
      </Box>
      <Box title={`Todos los usuarios · ${users.length}`}>
        <Table head={["Nombre", "Correo", "Perfil", "Estado", ""]}>
          {users.map((u) => (
            <tr key={u.id}>
              <td>{u.name} {u.isDemo && <span className="badge-demo">DEMO</span>}</td>
              <td>{u.email}</td><td>{ROLE_LABEL[u.role]}</td><td>{u.status}</td>
              <td style={{ whiteSpace: "nowrap" }}>
                {u.role === "admin" ? (
                  <span className="mini">ADMIN_EMAILS / seed</span>
                ) : u.status === "suspendido" || u.status === "rechazado" ? (
                  <RowAction label="Reactivar" action={act(u.id, "aprobado")} />
                ) : u.status === "aprobado" ? (
                  <RowAction label="Suspender" confirm={`¿Suspender la cuenta de ${u.email}?`} action={act(u.id, "suspendido")} />
                ) : null}
              </td>
            </tr>
          ))}
        </Table>
      </Box>
    </AdminShell>
  );
}
