/**
 * Seed de DEMO: datos ficticios marcados con is_demo = true y un usuario de prueba por rol.
 * Es idempotente: borra los datos demo anteriores y los vuelve a crear. No toca datos reales.
 * Uso: npm run db:seed   (no correr en producción real)
 */
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { upsertUserWithPassword } from "./users";

export const DEMO_PASSWORD = "Demo-5022-rugby!";
const DEMO_USERS = {
  aficionado: "aficionado@demo.5022.test",
  club: "club@demo.5022.test",
  union: "union@demo.5022.test",
  admin: "admin@demo.5022.test",
};

const teams = ["Mar del Plata Club", "Sporting", "San Ignacio", "Universitario", "Comercial", "Los Cardos", "Biguá", "Pueyrredón"];
const rounds: [string, string, number | null, number | null][][] = [
  [["Mar del Plata Club", "Pueyrredón", 31, 12], ["Sporting", "Biguá", 26, 17], ["San Ignacio", "Los Cardos", 19, 22], ["Universitario", "Comercial", 24, 18]],
  [["Mar del Plata Club", "Biguá", 28, 15], ["Pueyrredón", "Los Cardos", 17, 21], ["Sporting", "Comercial", 30, 14], ["San Ignacio", "Universitario", 20, 20]],
  [["Mar del Plata Club", "Los Cardos", 22, 18], ["Biguá", "Comercial", 12, 25], ["Pueyrredón", "Universitario", 16, 27], ["Sporting", "San Ignacio", 24, 19]],
  [["Mar del Plata Club", "Comercial", null, null], ["Los Cardos", "Universitario", null, null], ["Biguá", "San Ignacio", null, null], ["Pueyrredón", "Sporting", null, null]],
  [["Mar del Plata Club", "Universitario", null, null], ["Comercial", "San Ignacio", null, null], ["Los Cardos", "Sporting", null, null], ["Biguá", "Pueyrredón", null, null]],
];
const players: [string, string, number, number][] = [
  ["Mateo Fernández", "Pilar", 3, 0], ["Tomás Rodríguez", "Hooker", 3, 1], ["Lucas Martínez", "Segunda línea", 3, 0], ["Nicolás Pérez", "Medio scrum", 3, 1],
  ["Juan García", "Apertura", 3, 2], ["Franco López", "Centro", 3, 1], ["Agustín Díaz", "Wing", 3, 2], ["Pedro Silva", "Fullback", 2, 1],
];

async function main() {
  const { user, clubs, categories, matches, players: playersT } = schema;

  // Limpieza de datos demo anteriores (los clubes/categorías demo arrastran partidos y jugadores por cascada).
  await db.delete(user).where(eq(user.isDemo, true));
  await db.delete(matches).where(eq(matches.isDemo, true));
  await db.delete(clubs).where(eq(clubs.isDemo, true));
  await db.delete(categories).where(eq(categories.isDemo, true));

  const insertedClubs = await db.insert(clubs).values(teams.map((name) => ({ name, status: "activo" as const, isDemo: true }))).returning();
  const clubId = (name: string) => insertedClubs.find((c) => c.name === name)!.id;
  const [category] = await db
    .insert(categories)
    .values({ competition: "Torneo Regional", name: "Primera", season: "Temporada ficticia", isDemo: true })
    .returning();

  await db.insert(matches).values(
    rounds.flatMap((r, i) =>
      r.map(([home, away, h, a]) => ({
        categoryId: category!.id, round: i + 1, homeClubId: clubId(home), awayClubId: clubId(away), homeScore: h, awayScore: a, isDemo: true,
      })),
    ),
  );
  await db.insert(playersT).values(
    players.map(([name, position, matchesPlayed, tries]) => ({ clubId: clubId("Mar del Plata Club"), name, position, matchesPlayed, tries, isDemo: true })),
  );

  const base = { isDemo: true, emailVerified: true, status: "aprobado" as const };
  await upsertUserWithPassword({ ...base, name: "Aficionado Demo", email: DEMO_USERS.aficionado, role: "aficionado", password: DEMO_PASSWORD });
  await upsertUserWithPassword({ ...base, name: "Club Demo", email: DEMO_USERS.club, role: "club", clubId: clubId("Mar del Plata Club"), organization: "Mar del Plata Club", password: DEMO_PASSWORD });
  await upsertUserWithPassword({ ...base, name: "Unión Demo", email: DEMO_USERS.union, role: "union", organization: "Unión de Rugby de Mar del Plata (demo)", password: DEMO_PASSWORD });
  await upsertUserWithPassword({ ...base, name: "Superadmin Demo", email: DEMO_USERS.admin, role: "admin", password: DEMO_PASSWORD });

  console.log("Seed demo listo.");
  console.table(Object.entries(DEMO_USERS).map(([rol, email]) => ({ rol, email, contraseña: DEMO_PASSWORD })));
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
