import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import DemoNotice from "@/components/DemoNotice";
import GoogleButton from "@/components/GoogleButton";
import RegisterForm from "@/components/RegisterForm";
import { getSessionUser } from "@/lib/auth/session";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Registrarme | 5022" };

export default async function Registro() {
  if (await getSessionUser()) redirect("/app");
  return (
    <main className="container">
      <div className="formbox">
        <span className="kicker">ACCESO A 5022</span>
        <h1>Crear cuenta</h1>
        <p>Elegí un perfil. Después del registro entrarás directamente a su panel específico.</p>
        <GoogleButton enabled={env.googleEnabled} callbackURL="/app" />
        {env.googleEnabled && <p className="mini">Con Google entrás como aficionado; desde tu panel podés pedir el perfil de club o Unión.</p>}
        <RegisterForm />
        <DemoNotice />
        <p style={{ textAlign: "center" }}>
          ¿Ya tenés cuenta? <Link href="/app/login" style={{ color: "var(--lime)" }}>Ingresá</Link>
        </p>
      </div>
    </main>
  );
}
