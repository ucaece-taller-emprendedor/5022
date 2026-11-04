"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { assertRole } from "@/lib/auth/session";
import { db, schema } from "@/lib/db";
import { categorySchema, clubSchema, matchSchema, resultSchema, userStatusSchema } from "@/lib/validations/admin";
import { idSchema } from "@/lib/validations/club";
import { fail, formObject, ok, run, type ActionResult } from "./result";

const { user, clubs, categories, matches } = schema;
const refresh = () => revalidatePath("/", "layout");

// Cada acción valida el rol admin en el servidor: ocultar botones en la UI no alcanza.

export async function setUserStatusAction(input: { userId: string; status: string }): Promise<ActionResult> {
  return run(async () => {
    const me = await assertRole("admin");
    const data = userStatusSchema.parse(input);
    if (data.userId === me.id) return fail("No podés cambiar el estado de tu propia cuenta.");
    const [target] = await db.select().from(user).where(eq(user.id, data.userId));
    if (!target) return fail("Usuario no encontrado.");
    if (target.role === "admin") return fail("Los superadmins se gestionan con ADMIN_EMAILS.");
    await db.update(user).set({ status: data.status, updatedAt: new Date() }).where(eq(user.id, data.userId));
    if (target.clubId && target.role === "club") {
      await db.update(clubs).set({ status: data.status === "aprobado" ? "activo" : "pendiente" }).where(eq(clubs.id, target.clubId));
    }
    refresh();
    return ok();
  });
}

export async function createClubAction(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  return run(async () => {
    await assertRole("admin");
    const data = clubSchema.parse(formObject(fd));
    await db.insert(clubs).values({ name: data.name, status: "activo" });
    refresh();
    return ok("Club creado.");
  });
}

export async function deleteClubAction(id: string): Promise<ActionResult> {
  return run(async () => {
    await assertRole("admin");
    await db.delete(clubs).where(eq(clubs.id, idSchema.parse(id)));
    refresh();
    return ok();
  });
}

export async function createCategoryAction(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  return run(async () => {
    await assertRole("admin");
    await db.insert(categories).values(categorySchema.parse(formObject(fd)));
    refresh();
    return ok("Categoría creada.");
  });
}

export async function deleteCategoryAction(id: string): Promise<ActionResult> {
  return run(async () => {
    await assertRole("admin");
    await db.delete(categories).where(eq(categories.id, idSchema.parse(id)));
    refresh();
    return ok();
  });
}

export async function createMatchAction(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  return run(async () => {
    await assertRole("admin");
    await db.insert(matches).values(matchSchema.parse(formObject(fd)));
    refresh();
    return ok("Partido cargado.");
  });
}

export async function setResultAction(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  return run(async () => {
    await assertRole("admin");
    const data = resultSchema.parse(formObject(fd));
    const res = await db
      .update(matches)
      .set({ homeScore: data.homeScore, awayScore: data.awayScore })
      .where(and(eq(matches.id, data.matchId)))
      .returning({ id: matches.id });
    if (!res.length) return fail("Partido no encontrado.");
    refresh();
    return ok("Resultado guardado.");
  });
}

export async function deleteMatchAction(id: string): Promise<ActionResult> {
  return run(async () => {
    await assertRole("admin");
    await db.delete(matches).where(eq(matches.id, idSchema.parse(id)));
    refresh();
    return ok();
  });
}
