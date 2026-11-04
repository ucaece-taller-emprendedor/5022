import { z } from "zod";
import { ATTENDANCE, INJURY_AREAS, INJURY_STATUSES } from "@/lib/db/schema";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida");

export const playerSchema = z.object({
  name: z.string().trim().min(2, "Ingresá el nombre del jugador").max(100),
  position: z.string().trim().min(2, "Ingresá la posición").max(60),
  matchesPlayed: z.coerce.number().int().min(0).max(999).default(0),
  tries: z.coerce.number().int().min(0).max(999).default(0),
});

export const attendanceSchema = z.object({
  playerId: z.uuid(),
  date: isoDate,
  status: z.enum([...ATTENDANCE, ""]),
});

export const injurySchema = z.object({
  playerId: z.uuid({ error: "Elegí un jugador" }),
  date: isoDate,
  area: z.enum(INJURY_AREAS),
  status: z.enum(INJURY_STATUSES),
});

export const idSchema = z.uuid();
