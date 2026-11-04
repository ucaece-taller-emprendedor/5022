import { z } from "zod";

const schema = z
  .object({
    DATABASE_URL: z.string().min(1, "DATABASE_URL es obligatoria (cadena de conexión de Postgres)"),
    BETTER_AUTH_SECRET: z.string().min(32, "BETTER_AUTH_SECRET debe tener al menos 32 caracteres (openssl rand -base64 32)"),
    BETTER_AUTH_URL: z.url("BETTER_AUTH_URL debe ser una URL completa, por ejemplo http://localhost:3000"),
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    ADMIN_EMAILS: z.string().min(1, "ADMIN_EMAILS es obligatoria (correos de superadmin separados por coma)"),
    ADMIN_SEED_PASSWORD: z.string().optional(),
  })
  .refine((v) => Boolean(v.GOOGLE_CLIENT_ID) === Boolean(v.GOOGLE_CLIENT_SECRET), {
    message: "GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET deben definirse juntas (o ninguna)",
    path: ["GOOGLE_CLIENT_SECRET"],
  });

function load() {
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const detalle = parsed.error.issues.map((i) => `  - ${i.path.join(".") || "env"}: ${i.message}`).join("\n");
    throw new Error(`Variables de entorno inválidas. Revisá tu .env (ver .env.example):\n${detalle}`);
  }
  const v = parsed.data;
  return {
    DATABASE_URL: v.DATABASE_URL,
    BETTER_AUTH_SECRET: v.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: v.BETTER_AUTH_URL,
    GOOGLE_CLIENT_ID: v.GOOGLE_CLIENT_ID || undefined,
    GOOGLE_CLIENT_SECRET: v.GOOGLE_CLIENT_SECRET || undefined,
    ADMIN_SEED_PASSWORD: v.ADMIN_SEED_PASSWORD || undefined,
    ADMIN_EMAILS: v.ADMIN_EMAILS.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean),
    googleEnabled: Boolean(v.GOOGLE_CLIENT_ID && v.GOOGLE_CLIENT_SECRET),
  };
}

export const env = load();

export const isAdminEmail = (email: string) => env.ADMIN_EMAILS.includes(email.trim().toLowerCase());
