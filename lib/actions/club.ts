"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { assertRole } from "@/lib/auth/session";
import { db, schema } from "@/lib/db";
import { attendanceSchema, idSchema, injurySchema, playerSchema } from "@/lib/validations/club";
import { fail, formObject, ok, run, type ActionResult } from "./result";

const { players, attendance, injuries } = schema;
const refresh = () => revalidatePath("/app/club", "layout");

async function ownPlayer(playerId: string, clubId: string) {
  const [p] = await db.select({ id: players.id }).from(players).where(and(eq(players.id, playerId), eq(players.clubId, clubId)));
  return Boolean(p);
}

export async function addPlayerAction(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  return run(async () => {
    const me = await assertRole("club");
    const data = playerSchema.parse(formObject(fd));
    await db.insert(players).values({ ...data, clubId: me.clubId! });
    refresh();
    return ok("Jugador agregado.");
  });
}

export async function deletePlayerAction(id: string): Promise<ActionResult> {
  return run(async () => {
    const me = await assertRole("club");
    await db.delete(players).where(and(eq(players.id, idSchema.parse(id)), eq(players.clubId, me.clubId!)));
    refresh();
    return ok();
  });
}

export async function setAttendanceAction(input: { playerId: string; date: string; status: string }): Promise<ActionResult> {
  return run(async () => {
    const me = await assertRole("club");
    const data = attendanceSchema.parse(input);
    if (!(await ownPlayer(data.playerId, me.clubId!))) return fail("Ese jugador no pertenece a tu club.");
    if (data.status === "") {
      await db.delete(attendance).where(and(eq(attendance.playerId, data.playerId), eq(attendance.date, data.date)));
    } else {
      await db
        .insert(attendance)
        .values({ playerId: data.playerId, date: data.date, status: data.status })
        .onConflictDoUpdate({ target: [attendance.playerId, attendance.date], set: { status: data.status } });
    }
    refresh();
    return ok();
  });
}

export async function addInjuryAction(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  return run(async () => {
    const me = await assertRole("club");
    const data = injurySchema.parse(formObject(fd));
    if (!(await ownPlayer(data.playerId, me.clubId!))) return fail("Ese jugador no pertenece a tu club.");
    await db.insert(injuries).values(data);
    refresh();
    return ok("Lesión registrada.");
  });
}

export async function deleteInjuryAction(id: string): Promise<ActionResult> {
  return run(async () => {
    const me = await assertRole("club");
    const injuryId = idSchema.parse(id);
    const [row] = await db
      .select({ id: injuries.id })
      .from(injuries)
      .innerJoin(players, eq(injuries.playerId, players.id))
      .where(and(eq(injuries.id, injuryId), eq(players.clubId, me.clubId!)));
    if (!row) return fail("Registro no encontrado.");
    await db.delete(injuries).where(eq(injuries.id, injuryId));
    refresh();
    return ok();
  });
}
