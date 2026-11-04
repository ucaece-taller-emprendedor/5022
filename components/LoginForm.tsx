"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";
import { loginSchema } from "@/lib/validations/auth";
import { Field } from "./ActionForm";

export default function LoginForm({ redirectTo, admin }: { redirectTo: string; admin?: boolean }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const parsed = loginSchema.safeParse(Object.fromEntries(new FormData(e.currentTarget)));
    if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? "Datos inválidos");
    setPending(true);
    const { error: authError } = await authClient.signIn.email(parsed.data);
    if (authError) {
      setPending(false);
      return setError("Correo o contraseña incorrectos. Verificá los datos" + (admin ? "." : " o creá una cuenta nueva."));
    }
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <Field label="Correo electrónico">
        <input name="email" type="email" autoComplete="email" required placeholder="nombre@ejemplo.com" />
      </Field>
      <Field label="Contraseña">
        <input name="password" type="password" autoComplete="current-password" required placeholder="Tu contraseña" />
      </Field>
      <p className="mini" role="alert">{error}</p>
      <button className="btn primary wide" type="submit" disabled={pending}>
        {pending ? "Ingresando…" : admin ? "Entrar al panel →" : "Entrar a mi panel →"}
      </button>
    </form>
  );
}
