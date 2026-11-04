"use client";

import { useActionState, useState } from "react";
import { registerAction } from "@/lib/actions/auth";
import { Field } from "./ActionForm";

export default function RegisterForm() {
  const [state, action, pending] = useActionState(registerAction, null);
  const [role, setRole] = useState("aficionado");
  return (
    <form action={action}>
      <Field label="Nombre completo">
        <input name="name" autoComplete="name" required placeholder="Nombre y apellido" />
      </Field>
      <Field label="Correo electrónico">
        <input name="email" type="email" autoComplete="email" required placeholder="nombre@ejemplo.com" />
      </Field>
      <Field label="Contraseña">
        <input name="password" type="password" autoComplete="new-password" minLength={8} required placeholder="Mínimo 8 caracteres" />
      </Field>
      <Field label="Tipo de cuenta">
        <select name="role" value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="aficionado">Aficionado</option>
          <option value="club">Club</option>
          <option value="union">Unión</option>
        </select>
      </Field>
      {role !== "aficionado" && (
        <Field label={role === "club" ? "Nombre del club" : "Nombre de la Unión"}>
          <input name="organization" required placeholder={role === "club" ? "Ej: Club Atlético…" : "Ej: Unión de Rugby de…"} />
        </Field>
      )}
      {role !== "aficionado" && (
        <p className="mini">Las cuentas de club y Unión quedan <b>pendientes</b> hasta que un administrador las apruebe.</p>
      )}
      <p className="mini" role="alert">{state && !state.ok ? state.error : null}</p>
      <button className="btn primary wide" type="submit" disabled={pending}>
        {pending ? "Creando cuenta…" : "Crear cuenta y entrar →"}
      </button>
    </form>
  );
}
