import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth'
import { doc, getDoc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore'
import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { ROLES_REGISTRABLES, type RolRegistrable } from '@/config/app'
import { auth, db } from '@/lib/firebase'
import type { Perfil } from './tipos'

export type AuthValor = {
  usuario: User | null
  perfil: Perfil | null
  esAdmin: boolean
  /** true mientras se resuelve la sesión o se está registrando. */
  cargando: boolean
  registrar: (d: { nombre: string; email: string; clave: string; rol: RolRegistrable }) => Promise<void>
  ingresar: (email: string, clave: string) => Promise<void>
  ingresarConGoogle: (rolSiEsNuevo?: RolRegistrable) => Promise<void>
  /** Crea el documento de perfil de quien ingresó con Google sin haberlo creado. */
  completarPerfil: (d: { nombre: string; rol: RolRegistrable }) => Promise<void>
  salir: () => Promise<void>
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthValor | null>(null)

/** Crea users/{uid}. Las reglas solo permiten roles registrables y el estado que corresponde. */
async function crearPerfil(u: User, nombre: string, rol: RolRegistrable) {
  const cfg = ROLES_REGISTRABLES.find(r => r.rol === rol)
  await setDoc(doc(db, 'users', u.uid), {
    email: u.email ?? '',
    displayName: nombre,
    role: rol,
    status: cfg?.requiereAprobacion ? 'pendiente' : 'activo',
    isDemo: false,
    createdAt: serverTimestamp(),
  })
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<User | null>(null)
  const [authListo, setAuthListo] = useState(false)
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [perfilListo, setPerfilListo] = useState(false)
  const [esAdmin, setEsAdmin] = useState(false)
  const [claimsListo, setClaimsListo] = useState(false)
  const [ocupado, setOcupado] = useState(0)

  useEffect(
    () =>
      onAuthStateChanged(auth, async u => {
        setUsuario(u)
        setAuthListo(true)
        if (!u) {
          setEsAdmin(false)
          setPerfil(null)
          setPerfilListo(true)
          setClaimsListo(true)
          return
        }
        setPerfilListo(false)
        setClaimsListo(false)
        const t = await u.getIdTokenResult()
        setEsAdmin(t.claims.admin === true)
        setClaimsListo(true)
      }),
    [],
  )

  useEffect(() => {
    if (!usuario) return
    const uid = usuario.uid
    return onSnapshot(
      doc(db, 'users', uid),
      snap => {
        const d = snap.data()
        setPerfil(snap.exists() && d ? ({ uid, email: d.email, displayName: d.displayName, role: d.role, status: d.status, isDemo: d.isDemo === true } as Perfil) : null)
        setPerfilListo(true)
      },
      () => {
        setPerfil(null)
        setPerfilListo(true)
      },
    )
  }, [usuario])

  const conOcupado = useCallback(async <T,>(fn: () => Promise<T>): Promise<T> => {
    setOcupado(n => n + 1)
    try {
      return await fn()
    } finally {
      setOcupado(n => n - 1)
    }
  }, [])

  const valor = useMemo<AuthValor>(
    () => ({
      usuario,
      perfil,
      esAdmin,
      cargando: !authListo || ocupado > 0 || (usuario !== null && (!perfilListo || !claimsListo)),
      registrar: ({ nombre, email, clave, rol }) =>
        conOcupado(async () => {
          const cred = await createUserWithEmailAndPassword(auth, email, clave)
          await updateProfile(cred.user, { displayName: nombre })
          await crearPerfil(cred.user, nombre, rol)
        }),
      ingresar: (email, clave) => conOcupado(async () => void (await signInWithEmailAndPassword(auth, email, clave))),
      ingresarConGoogle: rolSiEsNuevo =>
        conOcupado(async () => {
          const cred = await signInWithPopup(auth, new GoogleAuthProvider())
          const existe = (await getDoc(doc(db, 'users', cred.user.uid))).exists()
          if (!existe && rolSiEsNuevo) await crearPerfil(cred.user, cred.user.displayName ?? 'Sin nombre', rolSiEsNuevo)
          // Si no existe y no se eligió rol, el guard lleva a /app/completar-perfil.
        }),
      completarPerfil: ({ nombre, rol }) =>
        conOcupado(async () => {
          if (!auth.currentUser) throw new Error('Sin sesión')
          await crearPerfil(auth.currentUser, nombre, rol)
        }),
      salir: () => signOut(auth),
    }),
    [usuario, perfil, esAdmin, authListo, perfilListo, claimsListo, ocupado, conOcupado],
  )

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}
