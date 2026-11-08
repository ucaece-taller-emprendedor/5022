import { collection, query, where } from 'firebase/firestore'
import { useMemo } from 'react'
import { useColeccion } from '@/hooks/useColeccion'
import { db } from '@/lib/firebase'
import type { Club, Usuario } from '@/lib/tipos'

/** Clubes activos (públicos; los únicos que pueden jugar un partido), ordenados por nombre. */
export function useClubesActivos() {
  const r = useColeccion<Club>(useMemo(() => query(collection(db, 'clubs'), where('status', '==', 'activo')), []))
  const datos = useMemo(() => [...r.datos].sort((a, b) => a.name.localeCompare(b.name)), [r.datos])
  return { ...r, datos }
}

/** Todos los clubes (solo el admin puede listar también los pendientes). */
export function useTodosLosClubes() {
  return useColeccion<Club>(useMemo(() => query(collection(db, 'clubs')), []))
}

/** Todos los usuarios (solo el admin). */
export function useUsuarios() {
  return useColeccion<Usuario>(useMemo(() => query(collection(db, 'users')), []))
}
