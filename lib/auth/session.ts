import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import type { Role, UserStatus } from "@/lib/db/schema";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: UserStatus;
  organization: string | null;
  clubId: string | null;
  isDemo: boolean;
};

export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const s = await auth.api.getSession({ headers: await headers() });
  if (!s) return null;
  const u = s.user as typeof s.user & Partial<SessionUser>;
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: (u.role ?? "aficionado") as Role,
    status: (u.status ?? "aprobado") as UserStatus,
    organization: u.organization ?? null,
    clubId: u.clubId ?? null,
    isDemo: Boolean(u.isDemo),
  };
});

export const panelPath = (role: Role) => (role === "admin" ? "/admin" : `/app/${role}`);

/** Para páginas y layouts: redirige si no hay sesión o el rol no corresponde. */
export async function requireRole(role: Role): Promise<SessionUser> {
  const loginPath = role === "admin" ? "/admin/login" : "/app/login";
  const user = await getSessionUser();
  if (!user) redirect(loginPath);
  if (user.role !== role) {
    redirect(role === "admin" ? "/admin/login?error=forbidden" : panelPath(user.role));
  }
  if (user.status !== "aprobado") redirect(role === "admin" ? "/admin/login?error=forbidden" : "/app/pendiente");
  return user;
}

export class AuthorizationError extends Error {
  constructor(message = "No tenés permiso para realizar esta acción.") {
    super(message);
  }
}

/** Para server actions y endpoints: lanza en vez de redirigir. El rol se valida siempre en el servidor. */
export async function assertRole(role: Role): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user || user.role !== role || user.status !== "aprobado") throw new AuthorizationError();
  if (role === "club" && !user.clubId) throw new AuthorizationError("Tu cuenta de club no tiene un club asociado.");
  return user;
}
