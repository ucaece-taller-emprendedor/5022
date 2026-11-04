import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser, panelPath } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Cuenta pendiente | 5022" };

const MESSAGES = {
  pendiente: ["Tu cuenta está pendiente de aprobación", "Un administrador de 5022 tiene que aprobar tu cuenta antes de que puedas usar el panel. Volvé a ingresar más tarde."],
  rechazado: ["Tu solicitud no fue aprobada", "Un administrador rechazó la solicitud de esta cuenta. Si creés que es un error, contactá a la Unión."],
  suspendido: ["Tu cuenta está suspendida", "Un administrador suspendió esta cuenta. Contactá a la Unión para más información."],
} as const;

export default async function Pendiente() {
  const user = await getSessionUser();
  if (!user) redirect("/app/login");
  if (user.status === "aprobado") redirect(panelPath(user.role));
  const [title, text] = MESSAGES[user.status as keyof typeof MESSAGES];
  return (
    <main className="container">
      <div className="formbox">
        <span className="kicker">ESTADO DE LA CUENTA</span>
        <h1>{title}</h1>
        <p>{text}</p>
        <div className="notice">
          Cuenta: <b>{user.email}</b> · Perfil solicitado: <b>{user.role === "club" ? "Club" : "Unión"}</b>
          {user.organization ? <> · {user.organization}</> : null}
        </div>
        <Link className="btn wide" href="/">Volver al inicio</Link>
      </div>
    </main>
  );
}
