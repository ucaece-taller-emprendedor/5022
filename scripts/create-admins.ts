/**
 * Crea (o promueve) los superadmins listados en ADMIN_EMAILS con la contraseña ADMIN_SEED_PASSWORD.
 * Es la vía para entrar a /admin/login con email y contraseña mientras Google no esté configurado.
 * Uso: ADMIN_SEED_PASSWORD='...' npm run db:admins
 */
import { env } from "@/lib/env";
import { upsertUserWithPassword } from "./users";

async function main() {
  const password = env.ADMIN_SEED_PASSWORD;
  if (!password || password.length < 12) {
    throw new Error("Definí ADMIN_SEED_PASSWORD (mínimo 12 caracteres) para crear los admins.");
  }
  for (const email of env.ADMIN_EMAILS) {
    await upsertUserWithPassword({
      name: email.split("@")[0] ?? "Admin", email, emailVerified: true, role: "admin", status: "aprobado", isDemo: false, password,
    });
    console.log(`Admin listo: ${email}`);
  }
  process.exit(0);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
