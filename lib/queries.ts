import "server-only";
import { alias } from "drizzle-orm/pg-core";
import { and, asc, count, desc, eq, inArray } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import type { MatchRow } from "@/lib/standings";

const { categories, clubs, matches, players, attendance, injuries, user } = schema;

export const getCategories = () => db.select().from(categories).orderBy(asc(categories.competition), asc(categories.name));

export async function resolveCategory(id?: string) {
  const all = await getCategories();
  const current = all.find((c) => c.id === id) ?? all[0] ?? null;
  return { all, current };
}

export async function getMatches(categoryId?: string): Promise<MatchRow[]> {
  const home = alias(clubs, "home");
  const away = alias(clubs, "away");
  const rows = await db
    .select({
      id: matches.id, categoryId: matches.categoryId, round: matches.round,
      homeId: matches.homeClubId, awayId: matches.awayClubId, home: home.name, away: away.name,
      h: matches.homeScore, a: matches.awayScore,
    })
    .from(matches)
    .innerJoin(home, eq(matches.homeClubId, home.id))
    .innerJoin(away, eq(matches.awayClubId, away.id))
    .where(categoryId ? eq(matches.categoryId, categoryId) : undefined)
    .orderBy(asc(matches.round), asc(home.name));
  return rows.map((r) => ({ ...r, played: r.h !== null && r.a !== null }));
}

export const getClubs = () => db.select().from(clubs).orderBy(asc(clubs.name));
export const getActiveClubs = () => db.select().from(clubs).where(eq(clubs.status, "activo")).orderBy(asc(clubs.name));

export const getPlayers = (clubId: string) =>
  db.select().from(players).where(eq(players.clubId, clubId)).orderBy(asc(players.name));

export async function getAttendance(clubId: string, date: string) {
  const rows = await db
    .select({ playerId: attendance.playerId, status: attendance.status })
    .from(attendance)
    .innerJoin(players, eq(attendance.playerId, players.id))
    .where(and(eq(players.clubId, clubId), eq(attendance.date, date)));
  return Object.fromEntries(rows.map((r) => [r.playerId, r.status])) as Record<string, string>;
}

export const getInjuries = (clubId: string) =>
  db
    .select({ id: injuries.id, player: players.name, date: injuries.date, area: injuries.area, status: injuries.status })
    .from(injuries)
    .innerJoin(players, eq(injuries.playerId, players.id))
    .where(eq(players.clubId, clubId))
    .orderBy(desc(injuries.date), desc(injuries.createdAt));

export const getUsers = () =>
  db
    .select({
      id: user.id, name: user.name, email: user.email, role: user.role, status: user.status,
      organization: user.organization, isDemo: user.isDemo, createdAt: user.createdAt, clubName: clubs.name,
    })
    .from(user)
    .leftJoin(clubs, eq(user.clubId, clubs.id))
    .orderBy(desc(user.createdAt));

export async function getCounts() {
  const [[u], [pend], [c], [m]] = await Promise.all([
    db.select({ n: count() }).from(user),
    db.select({ n: count() }).from(user).where(and(eq(user.status, "pendiente"), inArray(user.role, ["club", "union"]))),
    db.select({ n: count() }).from(clubs),
    db.select({ n: count() }).from(matches),
  ]);
  return { users: u?.n ?? 0, pending: pend?.n ?? 0, clubs: c?.n ?? 0, matches: m?.n ?? 0 };
}
