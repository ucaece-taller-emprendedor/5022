import { redirect } from "next/navigation";
import { getSessionUser, panelPath } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

/** Punto de entrada: manda a cada usuario a su panel según rol y estado. */
export default async function AppIndex() {
  const user = await getSessionUser();
  if (!user) redirect("/app/login");
  if (user.status !== "aprobado" && user.role !== "admin") redirect("/app/pendiente");
  redirect(panelPath(user.role));
}
