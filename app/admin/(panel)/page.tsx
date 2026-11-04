import Link from "next/link";
import AdminShell from "@/components/AdminShell";
import { Box, Metrics } from "@/components/ui";
import { getCounts } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function AdminResumen() {
  const c = await getCounts();
  return (
    <AdminShell active="resumen">
      <Metrics note="En la base de datos" items={[["Usuarios", c.users], ["Pendientes de aprobación", c.pending], ["Clubes", c.clubs], ["Partidos", c.matches]]} />
      <Box title="Qué podés hacer acá">
        <p className="muted">
          Aprobar o rechazar cuentas de club y Unión, administrar clubes, categorías, partidos y resultados. Los cambios se reflejan al instante en los paneles de aficionados, clubes y Unión.
        </p>
        {c.pending > 0 && (
          <Link className="textlink" href="/admin/usuarios">Hay {c.pending} cuenta(s) pendiente(s) de aprobación →</Link>
        )}
      </Box>
    </AdminShell>
  );
}
