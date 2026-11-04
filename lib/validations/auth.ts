import { z } from "zod";

export const emailSchema = z.string().trim().toLowerCase().pipe(z.email("Ingresá un correo válido"));
export const passwordSchema = z
  .string()
  .min(8, "La contraseña debe tener al menos 8 caracteres")
  .max(128, "La contraseña es demasiado larga");

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Ingresá tu contraseña"),
});

export const PUBLIC_ROLES = ["aficionado", "club", "union"] as const;

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Ingresá tu nombre y apellido").max(100),
    email: emailSchema,
    password: passwordSchema,
    role: z.enum(PUBLIC_ROLES, { error: "Elegí un tipo de cuenta" }),
    organization: z.string().trim().max(120).optional(),
  })
  .refine((v) => v.role === "aficionado" || (v.organization && v.organization.length >= 2), {
    message: "Indicá el nombre de tu club o de la Unión",
    path: ["organization"],
  });
export type RegisterInput = z.infer<typeof registerSchema>;

export const requestProfileSchema = z.object({
  role: z.enum(["club", "union"], { error: "Elegí un tipo de cuenta" }),
  organization: z.string().trim().min(2, "Indicá el nombre de tu club o de la Unión").max(120),
});
