import { z } from "zod";
import { USER_STATUSES } from "@/lib/db/schema";

export const userStatusSchema = z.object({ userId: z.string().min(1), status: z.enum(USER_STATUSES) });

export const clubSchema = z.object({ name: z.string().trim().min(2, "Ingresá el nombre del club").max(100) });

export const categorySchema = z.object({
  competition: z.string().trim().min(2, "Ingresá la competencia").max(100),
  name: z.string().trim().min(1, "Ingresá la categoría").max(60),
  season: z.string().trim().min(2, "Ingresá la temporada").max(60),
});

const score = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? null : Number(v)),
  z.number().int().min(0).max(300).nullable(),
);

export const matchSchema = z
  .object({
    categoryId: z.uuid({ error: "Elegí una categoría" }),
    round: z.coerce.number().int().min(1, "La fecha debe ser 1 o más").max(60),
    homeClubId: z.uuid({ error: "Elegí el local" }),
    awayClubId: z.uuid({ error: "Elegí el visitante" }),
    homeScore: score,
    awayScore: score,
  })
  .refine((v) => v.homeClubId !== v.awayClubId, { message: "Local y visitante deben ser distintos", path: ["awayClubId"] })
  .refine((v) => (v.homeScore === null) === (v.awayScore === null), {
    message: "Cargá los dos puntajes o ninguno",
    path: ["awayScore"],
  });

export const resultSchema = z
  .object({ matchId: z.uuid(), homeScore: score, awayScore: score })
  .refine((v) => (v.homeScore === null) === (v.awayScore === null), { message: "Cargá los dos puntajes o ninguno" });
