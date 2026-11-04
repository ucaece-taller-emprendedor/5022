import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import DemoNotice from "@/components/DemoNotice";
import GoogleButton from "@/components/GoogleButton";
import LoginForm from "@/components/LoginForm";
import { getSessionUser } from "@/lib/auth/session";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Ingresar | 5022" };

export default async function Login() {
  if (await getSessionUser()) redirect("/app");
  return (
    <main className="container">
      <div className="formbox">
        <span className="kicker">ACCESO A 5022</span>
        <h1>Ingresar</h1>
        <p>Ingresá con tu cuenta. La sesión queda iniciada en este dispositivo.</p>
        <GoogleButton enabled={env.googleEnabled} callbackURL="/app" />
        <LoginForm redirectTo="/app" />
        <DemoNotice />
        <p style={{ textAlign: "center" }}>
          ¿No tenés cuenta? <Link href="/app/registro" style={{ color: "var(--lime)" }}>Registrate</Link>
        </p>
      </div>
    </main>
  );
}
