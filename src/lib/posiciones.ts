// Cálculo de posiciones y fechas. Portado de lib/standings.ts de la app original.
export type PartidoFila = {
  id: string
  round: number
  homeClubId: string
  awayClubId: string
  home: string
  away: string
  homeScore: number | null
  awayScore: number | null
}

export type Posicion = { id: string; name: string; pj: number; g: number; e: number; p: number; pf: number; pc: number; pts: number }

export const jugado = (m: PartidoFila) => m.homeScore !== null && m.awayScore !== null

/** Sistema simplificado de demo (igual al prototipo original): 4 puntos por victoria, 2 por empate, sin bonus. */
export function calcularPosiciones(partidos: PartidoFila[]): Posicion[] {
  const datos = new Map<string, Posicion>()
  const fila = (id: string, name: string) => {
    let s = datos.get(id)
    if (!s) datos.set(id, (s = { id, name, pj: 0, g: 0, e: 0, p: 0, pf: 0, pc: 0, pts: 0 }))
    return s
  }
  for (const m of partidos) {
    const a = fila(m.homeClubId, m.home)
    const b = fila(m.awayClubId, m.away)
    if (m.homeScore === null || m.awayScore === null) continue
    a.pj++
    b.pj++
    a.pf += m.homeScore
    a.pc += m.awayScore
    b.pf += m.awayScore
    b.pc += m.homeScore
    if (m.homeScore > m.awayScore) { a.g++; b.p++; a.pts += 4 }
    else if (m.homeScore < m.awayScore) { b.g++; a.p++; b.pts += 4 }
    else { a.e++; b.e++; a.pts += 2; b.pts += 2 }
  }
  return [...datos.values()].sort((x, y) => y.pts - x.pts || y.pf - y.pc - (x.pf - x.pc) || x.name.localeCompare(y.name))
}

export const partidosJugados = (ms: PartidoFila[]) => ms.filter(jugado)

/** Próxima fecha: la primera con partidos sin jugar. */
export function proximaFecha(ms: PartidoFila[]): number | null {
  const pend = ms.filter(m => !jugado(m)).map(m => m.round)
  return pend.length ? Math.min(...pend) : null
}

export function ultimaFechaJugada(ms: PartidoFila[]): number | null {
  const r = partidosJugados(ms).map(m => m.round)
  return r.length ? Math.max(...r) : null
}

export function fechasCompletas(ms: PartidoFila[]): number {
  const fechas = new Set(ms.map(m => m.round))
  return [...fechas].filter(r => ms.filter(m => m.round === r).every(jugado)).length
}

export const ordenarPartidos = <T extends PartidoFila>(ms: T[]): T[] => [...ms].sort((a, b) => a.round - b.round || a.home.localeCompare(b.home))
