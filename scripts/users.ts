import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db, schema } from "@/lib/db";

type NewUser = typeof schema.user.$inferInsert;

/** Crea (o actualiza) un usuario con contraseña, sin pasar por el registro público. */
export async function upsertUserWithPassword(data: Omit<NewUser, "id"> & { password: string }) {
  const { password, ...fields } = data;
  const ctx = await auth.$context;
  const hash = await ctx.password.hash(password);
  const [existing] = await db.select().from(schema.user).where(eq(schema.user.email, fields.email));
  const id = existing?.id ?? randomUUID();
  if (existing) {
    await db.update(schema.user).set({ ...fields, updatedAt: new Date() }).where(eq(schema.user.id, id));
    await db.delete(schema.account).where(eq(schema.account.userId, id));
  } else {
    await db.insert(schema.user).values({ id, ...fields });
  }
  await db.insert(schema.account).values({ id: randomUUID(), accountId: id, providerId: "credential", userId: id, password: hash });
  return id;
}
