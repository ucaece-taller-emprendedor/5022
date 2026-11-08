import { describe, expect, it } from 'vitest'
import { calcularPosiciones, fechasCompletas, proximaFecha, ultimaFechaJugada, type PartidoFila } from '../../src/lib/posiciones'

const p = (id: string, round: number, home: string, away: string, h: number | null, a: number | null): PartidoFila => ({ id, round, homeClubId: home, awayClubId: away, home, away, homeScore: h, awayScore: a })

describe('posiciones', () => {
  const partidos = [p('1', 1, 'A', 'B', 20, 10), p('2', 1, 'C', 'D', 15, 15), p('3', 2, 'A', 'C', 10, 12), p('4', 2, 'B', 'D', null, null)]

  it('4 puntos por victoria, 2 por empate, ordena por puntos y diferencia', () => {
    const t = calcularPosiciones(partidos)
    expect(t.map(x => [x.name, x.pts, x.pj])).toEqual([['C', 6, 2], ['A', 4, 2], ['D', 2, 1], ['B', 0, 1]])
    expect(t[0]).toMatchObject({ g: 1, e: 1, p: 0, pf: 27, pc: 25 })
  })
  it('los partidos sin resultado no suman PJ pero el equipo aparece', () => {
    expect(calcularPosiciones([p('x', 1, 'A', 'B', null, null)]).map(x => x.pj)).toEqual([0, 0])
  })
  it('próxima fecha, última jugada y fechas completas', () => {
    expect(proximaFecha(partidos)).toBe(2)
    expect(ultimaFechaJugada(partidos)).toBe(2)
    expect(fechasCompletas(partidos)).toBe(1)
    expect(proximaFecha(partidos.slice(0, 2))).toBeNull()
  })
})
