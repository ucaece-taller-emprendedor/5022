export type MatchRow = {
  id: string;
  categoryId: string;
  round: number;
  homeId: string;
  awayId: string;
  home: string;
  away: string;
  h: number | null;
  a: number | null;
  played: boolean;
};

export type Standing = { id: string; name: string; pj: number; g: number; e: number; p: number; pf: number; pc: number; pts: number };

/** Sistema simplificado de demo (igual al prototipo original): 4 puntos por victoria, 2 por empate, sin bonus. */
export function computeStandings(matches: MatchRow[]): Standing[] {
  const data = new Map<string, Standing>();
  const entry = (id: string, name: string) => {
    let s = data.get(id);
    if (!s) data.set(id, (s = { id, name, pj: 0, g: 0, e: 0, p: 0, pf: 0, pc: 0, pts: 0 }));
    return s;
  };
  for (const m of matches) {
    const a = entry(m.homeId, m.home);
    const b = entry(m.awayId, m.away);
    if (!m.played || m.h === null || m.a === null) continue;
    a.pj++; b.pj++;
    a.pf += m.h; a.pc += m.a; b.pf += m.a; b.pc += m.h;
    if (m.h > m.a) { a.g++; b.p++; a.pts += 4; }
    else if (m.h < m.a) { b.g++; a.p++; b.pts += 4; }
    else { a.e++; b.e++; a.pts += 2; b.pts += 2; }
  }
  return [...data.values()].sort((x, y) => y.pts - x.pts || y.pf - y.pc - (x.pf - x.pc) || x.name.localeCompare(y.name));
}

export const playedMatches = (ms: MatchRow[]) => ms.filter((m) => m.played);

/** Próxima fecha: la primera con partidos sin jugar. */
export function nextRound(ms: MatchRow[]): number | null {
  const pending = ms.filter((m) => !m.played).map((m) => m.round);
  return pending.length ? Math.min(...pending) : null;
}
export const lastPlayedRound = (ms: MatchRow[]): number | null => {
  const r = playedMatches(ms).map((m) => m.round);
  return r.length ? Math.max(...r) : null;
};
export const completedRounds = (ms: MatchRow[]) => {
  const rounds = new Set(ms.map((m) => m.round));
  return [...rounds].filter((r) => ms.filter((m) => m.round === r).every((m) => m.played)).length;
};
