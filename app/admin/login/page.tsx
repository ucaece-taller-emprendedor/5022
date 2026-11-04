import { redirect } from "next/navigation";
import DemoNotice from "@/components/DemoNotice";
import GoogleButton from "@/components/GoogleButton";
import LoginForm from "@/components/LoginForm";
import { getSessionUser } from "@/lib/auth/session";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

// Sin registro público: los superadmins se definen con ADMIN_EMAILS o por seed.
export default async function AdminLogin({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const user = await getSessionUser();
  if (user?.role === "admin" && user.status === "aprobado") redirect("/admin");
  return (
    <main className="container">
      <div className="formbox">
        <span className="kicker">ADMINISTRACIÓN</span>
        <h1>Panel de administración</h1>
        <p>Acceso solo para superadministradores. No hay registro público.</p>
        {error === "forbidden" && (
          <p className="mini" role="alert">Tu cuenta no tiene permisos de administrador. Ingresá con una cuenta de superadmin.</p>
        )}
        <GoogleButton enabled={env.googleEnabled} callbackURL="/admin" />
        <LoginForm redirectTo="/admin" admin />
        <DemoNotice />
      </div>
    </main>
  );
}
