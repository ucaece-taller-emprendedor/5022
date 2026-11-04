import Link from "next/link";
import type { Metadata } from "next";
import CategoryTabs from "@/components/CategoryTabs";
import DemoNotice from "@/components/DemoNotice";
import { Box, Standings } from "@/components/ui";
import { getMatches, resolveCategory } from "@/lib/queries";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Tabla de posiciones | 5022" };

export default async function PosicionesPublicas({ searchParams }: { searchParams: Promise<{ categoria?: string }> }) {
  const { categoria } = await searchParams;
  const { all, current } = await resolveCategory(categoria);
  const matches = current ? await getMatches(current.id) : [];
  return (
    <main className="container section">
      <div className="section-head">
        <span className="kicker">EXPLORADOR PÚBLICO</span>
        <h2>Tabla de posiciones</h2>
        <p>Competencia ficticia creada para probar 5022.</p>
      </div>
      <CategoryTabs categories={all} currentId={current?.id} basePath="/posiciones" />
      <Box title={current ? `${current.competition} · ${current.name}` : "Sin competencias"}>
        <Standings matches={matches} />
      </Box>
      <div className="actions">
        <Link className="btn primary" href="/app/registro">Registrarme para ver mi panel →</Link>
        <Link className="btn ghost" href="/partidos">Ver partidos</Link>
      </div>
      <DemoNotice />
    </main>
  );
}
