import { collection, query, where } from 'firebase/firestore'
import { useMemo } from 'react'
import { useSearchParams } from 'react-router'
import { useColeccion, type Con } from '@/hooks/useColeccion'
import { db } from '@/lib/firebase'
import type { PartidoFila } from '@/lib/posiciones'
import { ordenarPartidos } from '@/lib/posiciones'
import type { Categoria, Partido } from '@/lib/tipos'

export type CategoriaCon = Con<Categoria>
export type PartidoCon = Con<Partido> & PartidoFila

/** Categorías (torneos) públicas, ordenadas por competencia y nombre. */
export function useCategorias() {
  const r = useColeccion<Categoria>(useMemo(() => query(collection(db, 'categorias')), []))
  const datos = useMemo(() => [...r.datos].sort((a, b) => a.competition.localeCompare(b.competition) || a.name.localeCompare(b.name)), [r.datos])
  return { ...r, datos }
}

/** Partidos de una categoría, ordenados por fecha. */
export function usePartidos(categoriaId: string | undefined) {
  const consulta = useMemo(() => (categoriaId ? query(collection(db, 'partidos'), where('categoryId', '==', categoriaId)) : null), [categoriaId])
  const r = useColeccion<Partido>(consulta)
  const datos = useMemo(() => ordenarPartidos(r.datos as PartidoCon[]), [r.datos])
  return { ...r, datos }
}

/** Categoría elegida en la URL (?categoria=) o la primera. Con sus partidos. */
export function useTorneo() {
  const [params, setParams] = useSearchParams()
  const cats = useCategorias()
  const actual = cats.datos.find(c => c.id === params.get('categoria')) ?? cats.datos[0]
  const partidos = usePartidos(actual?.id)
  return {
    categorias: cats.datos,
    actual,
    partidos: partidos.datos,
    cargando: cats.cargando || (actual !== undefined && partidos.cargando),
    error: cats.error ?? partidos.error,
    elegir: (id: string) => setParams({ categoria: id }, { replace: true }),
  }
}
