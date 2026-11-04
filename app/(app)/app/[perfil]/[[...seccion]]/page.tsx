import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import Link from "next/link";
import ActionForm, { Field } from "@/components/ActionForm";
import PanelShell, { type NavItem } from "@/components/PanelShell";
import Aficionado from "@/components/panels/Aficionado";
import Club from "@/components/panels/Club";
import Union from "@/components/panels/Union";
import { requestProfileAction } from "@/lib/actions/auth";
import { requireRole } from "@/lib/auth/session";
import { db, schema } from "@/lib/db";
import type { Role } from "@/lib/db/schema";
import { getActiveClubs, getCategories, getMatches, resolveCategory } from "@/lib/queries";
import { Box } from "@/components/ui";
import CategoryTabs from "@/components/CategoryTabs";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Mi panel | 5022" };

const PROFILES = {
  aficionado: {
    title: "Aficionado",
    items: [["resumen", "Resumen"], ["partidos", "Partidos"], ["posiciones", "Posiciones"], ["estadisticas", "Estadísticas"]],
  },
  club: {
    title: "Club",
    items: [["resumen", "Resumen"], ["plantel", "Plantel"], ["asistencias", "Asistencias"], ["lesiones", "Lesiones"], ["partidos", "Mis partidos"], ["rendimiento", "Rendimiento"]],
  },
  union: {
    title: "Unión",
    items: [["resumen", "Resumen"], ["competencias", "Competencias"], ["calendario", "Calendario"], ["clubes", "Clubes"]],
  },
} as const satisfies Record<string, { title: string; items: readonly (readonly [string, string])[] }>;

type Perfil = keyof typeof PROFILES;
const isPerfil = (v: string): v is Perfil => v in PROFILES;
const todayISO = () => new Date().toLocaleDateString("sv-SE", { timeZone: "America/Argentina/Buenos_Aires" });

export default async function Panel({
  params, searchParams,
}: {
  params: Promise<{ perfil: string; seccion?: string[] }>;
  searchParams: Promise<{ categoria?: string; fecha?: string }>;
}) {
  const { perfil, seccion } = await params;
  const sp = await searchParams;
  if (!isPerfil(perfil)) notFound();
  // La autorización se valida en el servidor: rol y estado de aprobación.
  const me = await requireRole(perfil as Role);

  const def = PROFILES[perfil];
  const keys = def.items.map(([k]) => k as string);
  const requested = seccion?.[0] ?? "resumen";
  const active = keys.includes(requested) ? requested : "resumen";
  const items: NavItem[] = def.items.map(([key, label]) => ({
    key, label, href: key === "resumen" ? `/app/${perfil}` : `/app/${perfil}/${key}`,
  }));

  const { all: categories, current } = await resolveCategory(sp.categoria);
  const matches = current ? await getMatches(current.id) : [];
  const subtitle = current ? `${current.competition} · ${current.season}` : "Sin competencias cargadas";
  const showTabs = active === "resumen" || ["partidos", "posiciones", "estadisticas", "competencias", "calendario"].includes(active);

  let body;
  if (perfil === "aficionado") {
    body = (
      <>
        <Aficionado section={active} matches={matches} />
        {active === "resumen" && <RequestProfile />}
      </>
    );
  } else if (perfil === "club") {
    const [club] = await db.select().from(schema.clubs).where(eq(schema.clubs.id, me.clubId!));
    const fecha = sp.fecha && /^\d{4}-\d{2}-\d{2}$/.test(sp.fecha) ? sp.fecha : todayISO();
    body = <Club section={active} clubId={me.clubId!} clubName={club?.name ?? me.organization ?? "Mi club"} matches={matches} date={fecha} />;
  } else {
    const [clubs, allMatches, allCats] = await Promise.all([getActiveClubs(), getMatches(), getCategories()]);
    body = <Union section={active} matches={matches} category={current} categories={allCats} clubs={clubs} allMatches={allMatches} />;
  }

  return (
    <PanelShell
      title={def.title}
      caption={`${def.title} · ${me.name}`}
      subtitle={subtitle}
      items={items}
      active={active}
    >
      {showTabs && <CategoryTabs categories={categories} currentId={current?.id} basePath={items.find((i) => i.key === active)?.href ?? `/app/${perfil}`} />}
      {body}
    </PanelShell>
  );
}

function RequestProfile() {
  return (
    <Box title="¿Sos un club o una Unión?">
      <p className="muted">
        Pedí el perfil de club o Unión. Tu solicitud queda <b>pendiente</b> hasta que un administrador la apruebe.
      </p>
      <ActionForm action={requestProfileAction} submitLabel="Enviar solicitud">
        <Field label="Perfil">
          <select name="role"><option value="club">Club</option><option value="union">Unión</option></select>
        </Field>
        <Field label="Nombre del club o de la Unión"><input name="organization" required /></Field>
      </ActionForm>
      <Link className="textlink" href="/partidos">Seguir explorando partidos →</Link>
    </Box>
  );
}
