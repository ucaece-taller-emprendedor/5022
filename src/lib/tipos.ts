import type { Asistencia, Estado, Rol } from '@/config/app'

export type Usuario = { email: string; displayName: string; role: Rol; status: Estado; organization?: string; isDemo: boolean }
export type Club = { name: string; status: 'activo' | 'pendiente'; ownerId: string; isDemo: boolean }
export type Categoria = { competition: string; name: string; season: string; isDemo: boolean }
export type Partido = {
  categoryId: string
  round: number
  homeClubId: string
  awayClubId: string
  home: string
  away: string
  homeScore: number | null
  awayScore: number | null
  isDemo: boolean
}
export type Jugador = { name: string; position: string; matchesPlayed: number; tries: number; isDemo: boolean }
export type RegistroAsistencia = { playerId: string; date: string; status: Asistencia }
export type Lesion = { playerId: string; playerName: string; date: string; area: string; status: string; isDemo: boolean }
