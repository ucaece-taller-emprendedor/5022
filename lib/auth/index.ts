import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { db, schema } from "@/lib/db";
import { env, isAdminEmail } from "@/lib/env";

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, { provider: "pg", schema }),
  emailAndPassword: { enabled: true, minPasswordLength: 8, maxPasswordLength: 128 },
  // Google solo se habilita si hay credenciales reales; nunca se simula.
  socialProviders: env.googleEnabled
    ? { google: { clientId: env.GOOGLE_CLIENT_ID!, clientSecret: env.GOOGLE_CLIENT_SECRET! } }
    : {},
  user: {
    // role/status/etc. solo se escriben desde el servidor (input: false): el cliente no puede elegirlos.
    additionalFields: {
      role: { type: "string", required: false, defaultValue: "aficionado", input: false },
      status: { type: "string", required: false, defaultValue: "aprobado", input: false },
      organization: { type: "string", required: false, input: false },
      clubId: { type: "string", required: false, input: false },
      isDemo: { type: "boolean", required: false, defaultValue: false, input: false },
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (u) => {
          if (isAdminEmail(u.email)) {
            // Un admin solo nace con un correo verificado por el proveedor (Google), nunca por registro público.
            if (!u.emailVerified) {
              throw new APIError("FORBIDDEN", { message: "Este correo no puede registrarse públicamente." });
            }
            return { data: { ...u, role: "admin", status: "aprobado" } };
          }
          return { data: { ...u, role: "aficionado", status: "aprobado" } };
        },
      },
    },
  },
  plugins: [nextCookies()],
});
