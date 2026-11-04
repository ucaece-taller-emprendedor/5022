import type { ReactNode } from "react";
import { requireRole } from "@/lib/auth/session";
import PanelShell, { type NavItem } from "./PanelShell";

const ITEMS: NavItem[] = [
  { key: "resumen", label: "Resumen", href: "/admin" },
  { key: "usuarios", label: "Usuarios y aprobaciones", href: "/admin/usuarios" },
  { key: "clubes", label: "Clubes", href: "/admin/clubes" },
  { key: "categorias", label: "Categorías", href: "/admin/categorias" },
  { key: "partidos", label: "Partidos y resultados", href: "/admin/partidos" },
];

/** Cada página admin valida el rol en el servidor (los layouts no se re-ejecutan en cada navegación). */
export default async function AdminShell({ active, children }: { active: string; children: ReactNode }) {
  const me = await requireRole("admin");
  return (
    <PanelShell title="Superadministrador" caption={`Superadmin · ${me.name}`} subtitle="Gestión de la plataforma" items={ITEMS} active={active}>
      {children}
    </PanelShell>
  );
}
