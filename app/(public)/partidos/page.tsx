import Link from "next/link";
import type { Metadata } from "next";
import CategoryTabs from "@/components/CategoryTabs";
import DemoNotice from "@/components/DemoNotice";
import { Box, Fixture } from "@/components/ui";
import { getMatches, resolveCategory } from "@/lib/queries";
import { lastPlayedRound, nextRound, playedMatches } from "@/lib/standings";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Partidos y resultados | 5022" };

export default async function PartidosPublicos({ searchParams }: { searchParams: Promise<{ categoria?: string }> }) {
  const { categoria } = await searchParams;
  const { all, current } = await resolveCategory(categoria);
  const matches = current ? await getMatches(current.id) : [];
  const last = lastPlayedRound(matches);
  const next = nextRound(matches);
  return (
    <main className="container section">
      <div className="section-head">
        <span className="kicker">EXPLORADOR PÚBLICO</span>
        <h2>Partidos y resultados</h2>
        <p>Competencia ficticia creada para probar 5022.</p>
      </div>
      <CategoryTabs categories={all} currentId={current?.id} basePath="/partidos" />
      <Box title="Últimos resultados">
        <Fixture items={playedMatches(matches).filter((m) => m.round === last)} />
      </Box>
      <Box title="Próxima fecha">
        <Fixture items={matches.filter((m) => !m.played && m.round === next)} empty="No hay partidos programados." />
      </Box>
      <div className="actions">
        <Link className="btn primary" href="/app/registro">Registrarme para ver mi panel →</Link>
        <Link className="btn ghost" href="/posiciones">Ver posiciones</Link>
      </div>
      <DemoNotice />
    </main>
  );
}
