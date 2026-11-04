"use server";

import { redirect } from "next/navigation";
import { eq, sql } from "drizzle-orm";
import { APIError } from "better-auth/api";
import { auth } from "@/lib/auth";
import { getSessionUser } from "@/lib/auth/session";
import { db, schema } from "@/lib/db";
import { isAdminEmail } from "@/lib/env";
import { registerSchema, requestProfileSchema } from "@/lib/validations/auth";
import { fail, formObject, run, type ActionResult } from "./result";

const { user, clubs } = schema;

/** Busca el club por nombre: lo reutiliza si no tiene dueño, o lo crea como pendiente. */
async function claimClub(name: string): Promise<{ clubId: string } | { error: string }> {
  const [existing] = await db.select().from(clubs).where(sql`lower(${clubs.name}) = lower(${name})`);
  if (existing) {
    const [owner] = await db.select({ id: user.id }).from(user).where(eq(user.clubId, existing.id)).limit(1);
    if (owner) return { error: "Ese club ya tiene una cuenta asociada. Si es tuyo, pedile acceso a la Unión o al administrador." };
    return { clubId: existing.id };
  }
  const [created] = await db.insert(clubs).values({ name, status: "pendiente" }).returning({ id: clubs.id });
  return { clubId: created!.id };
}

export async function registerAction(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const result = await run(async () => {
    const data = registerSchema.parse(formObject(fd));
    if (isAdminEmail(data.email)) return fail("Este correo no puede registrarse desde acá.");

    let clubId: string | null = null;
    if (data.role === "club") {
      const claimed = await claimClub(data.organization!);
      if ("error" in claimed) return fail(claimed.error);
      clubId = claimed.clubId;
    }

    try {
      const res = await auth.api.signUpEmail({ body: { name: data.name, email: data.email, password: data.password } });
      await db
        .update(user)
        .set({
          role: data.role,
          status: data.role === "aficionado" ? "aprobado" : "pendiente",
          organization: data.role === "aficionado" ? null : data.organization,
          clubId,
        })
        .where(eq(user.id, res.user.id));
    } catch (err) {
      if (err instanceof APIError) {
        const code = (err.body as { code?: string } | undefined)?.code ?? "";
        if (code.includes("USER_ALREADY_EXISTS")) return fail("Este correo ya tiene una cuenta. Entrá desde “Ingresar”.");
        return fail((err.body as { message?: string } | undefined)?.message ?? "No pudimos crear la cuenta.");
      }
      throw err;
    }
    return { ok: true } as const;
  });
  if (!result.ok) return result;
  redirect("/app");
}

/** Un aficionado (p. ej. registrado con Google) pide pasar a Club o Unión: queda pendiente de aprobación. */
export async function requestProfileAction(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const result = await run(async () => {
    const current = await getSessionUser();
    if (!current || current.role !== "aficionado") return fail("Solo una cuenta de aficionado puede pedir otro perfil.");
    const data = requestProfileSchema.parse(formObject(fd));
    let clubId: string | null = null;
    if (data.role === "club") {
      const claimed = await claimClub(data.organization);
      if ("error" in claimed) return fail(claimed.error);
      clubId = claimed.clubId;
    }
    await db.update(user).set({ role: data.role, status: "pendiente", organization: data.organization, clubId }).where(eq(user.id, current.id));
    return { ok: true } as const;
  });
  if (!result.ok) return result;
  redirect("/app/pendiente");
}
