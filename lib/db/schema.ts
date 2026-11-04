import { relations } from "drizzle-orm";
import { boolean, date, index, integer, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";

export const ROLES = ["aficionado", "club", "union", "admin"] as const;
export type Role = (typeof ROLES)[number];
export const USER_STATUSES = ["aprobado", "pendiente", "rechazado", "suspendido"] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

// ── Better Auth (los usuarios viven en la base de la app) ──────────────────────
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  // Campos propios de 5022
  role: text("role", { enum: ROLES }).notNull().default("aficionado"),
  status: text("status", { enum: USER_STATUSES }).notNull().default("aprobado"),
  organization: text("organization"),
  clubId: uuid("club_id").references(() => clubs.id, { onDelete: "set null" }),
  isDemo: boolean("is_demo").notNull().default(false),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ── Dominio del rugby ──────────────────────────────────────────────────────────
export const clubs = pgTable("clubs", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  // pendiente: club registrado por un usuario que todavía no aprobó el admin
  status: text("status", { enum: ["activo", "pendiente"] }).notNull().default("activo"),
  isDemo: boolean("is_demo").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  competition: text("competition").notNull(),
  name: text("name").notNull(),
  season: text("season").notNull(),
  isDemo: boolean("is_demo").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [unique().on(t.competition, t.name, t.season)]);

export const matches = pgTable("matches", {
  id: uuid("id").primaryKey().defaultRandom(),
  categoryId: uuid("category_id").notNull().references(() => categories.id, { onDelete: "cascade" }),
  round: integer("round").notNull(),
  homeClubId: uuid("home_club_id").notNull().references(() => clubs.id, { onDelete: "restrict" }),
  awayClubId: uuid("away_club_id").notNull().references(() => clubs.id, { onDelete: "restrict" }),
  homeScore: integer("home_score"),
  awayScore: integer("away_score"),
  isDemo: boolean("is_demo").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [index("matches_category_idx").on(t.categoryId, t.round)]);

export const players = pgTable("players", {
  id: uuid("id").primaryKey().defaultRandom(),
  clubId: uuid("club_id").notNull().references(() => clubs.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  position: text("position").notNull(),
  matchesPlayed: integer("matches_played").notNull().default(0),
  tries: integer("tries").notNull().default(0),
  isDemo: boolean("is_demo").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const ATTENDANCE = ["presente", "ausente", "justificado"] as const;
export const attendance = pgTable("attendance", {
  id: uuid("id").primaryKey().defaultRandom(),
  playerId: uuid("player_id").notNull().references(() => players.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  status: text("status", { enum: ATTENDANCE }).notNull(),
}, (t) => [unique().on(t.playerId, t.date)]);

export const INJURY_AREAS = ["Rodilla", "Tobillo", "Hombro", "Muslo", "Otra"] as const;
export const INJURY_STATUSES = ["En recuperación", "Alta deportiva"] as const;
export const injuries = pgTable("injuries", {
  id: uuid("id").primaryKey().defaultRandom(),
  playerId: uuid("player_id").notNull().references(() => players.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  area: text("area", { enum: INJURY_AREAS }).notNull(),
  status: text("status", { enum: INJURY_STATUSES }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const userRelations = relations(user, ({ one }) => ({ club: one(clubs, { fields: [user.clubId], references: [clubs.id] }) }));
