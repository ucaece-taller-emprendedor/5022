import Link from "next/link";
import { getSessionUser, panelPath } from "@/lib/auth/session";
import LogoutButton from "./LogoutButton";

export default async function SiteHeader() {
  const user = await getSessionUser();
  return (
    <header className="topbar">
      <div className="container nav">
        <Link className="brand" href="/">
          <span className="brandmark">↗</span>5022
        </Link>
        <nav className="navlinks">
          <Link href="/partidos">Partidos</Link>
          <Link href="/posiciones">Posiciones</Link>
          <Link href="/#funcionalidades">La plataforma</Link>
        </nav>
        <div className="navright">
          {user ? (
            <>
              <Link className="btn ghost" href={user.role === "aficionado" || user.status === "aprobado" ? panelPath(user.role) : "/app/pendiente"}>
                Mi panel
              </Link>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link className="btn ghost" href="/app/login">Ingresar</Link>
              <Link className="btn primary" href="/app/registro">Registrarme →</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
