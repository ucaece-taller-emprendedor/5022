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
import { doc, getDoc, onSnapshot, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'
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
  registrar: (d: { nombre: string; email: string; clave: string; rol: RolRegistrable; organizacion?: string | undefined }) => Promise<void>
  ingresar: (email: string, clave: string) => Promise<void>
  ingresarConGoogle: (rolSiEsNuevo?: RolRegistrable) => Promise<void>
  /** Crea el documento de perfil de quien ingresó con Google sin haberlo creado. */
  completarPerfil: (d: { nombre: string; rol: RolRegistrable; organizacion?: string | undefined }) => Promise<void>
  /** Un aficionado pide el perfil de club o Unión: queda pendiente hasta que el admin lo apruebe. */
  solicitarPerfil: (d: { rol: 'club' | 'union'; organizacion: string }) => Promise<void>
  /** Un club sin documento de club (registro cortado a la mitad) lo crea de nuevo, pendiente. */
  registrarClub: () => Promise<void>
  salir: () => Promise<void>
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthValor | null>(null)

/** Crea el club pendiente del usuario (id = uid). Las reglas exigen que el nombre sea el de su perfil. */
async function crearClubPendiente(uid: string, nombre: string) {
  await setDoc(doc(db, 'clubs', uid), { name: nombre, status: 'pendiente', ownerId: uid, isDemo: false, createdAt: serverTimestamp() })
}

/** Crea users/{uid}. Las reglas solo permiten roles registrables y el estado que corresponde. */
async function crearPerfil(u: User, nombre: string, rol: RolRegistrable, organizacion?: string) {
  const cfg = ROLES_REGISTRABLES.find(r => r.rol === rol)
  const org = cfg?.pideOrganizacion ? organizacion?.trim() : undefined
  await setDoc(doc(db, 'users', u.uid), {
    email: u.email ?? '',
    displayName: nombre,
    role: rol,
    status: cfg?.requiereAprobacion ? 'pendiente' : 'activo',
    ...(org ? { organization: org } : {}),
    isDemo: false,
    createdAt: serverTimestamp(),
  })
  if (rol === 'club' && org) await crearClubPendiente(u.uid, org)
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
        setPerfil(snap.exists() && d ? ({ uid, email: d.email, displayName: d.displayName, role: d.role, status: d.status, organization: d.organization, isDemo: d.isDemo === true } as Perfil) : null)
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
      // Admin por claim (cátedra) o por rol en su perfil (lo da otro admin desde /admin/administradores).
      esAdmin: esAdmin || (perfil?.role === 'admin' && perfil.status === 'activo'),
      cargando: !authListo || ocupado > 0 || (usuario !== null && (!perfilListo || !claimsListo)),
      registrar: ({ nombre, email, clave, rol, organizacion }) =>
        conOcupado(async () => {
          const cred = await createUserWithEmailAndPassword(auth, email, clave)
          await updateProfile(cred.user, { displayName: nombre })
          await crearPerfil(cred.user, nombre, rol, organizacion)
        }),
      ingresar: (email, clave) => conOcupado(async () => void (await signInWithEmailAndPassword(auth, email, clave))),
      ingresarConGoogle: rolSiEsNuevo =>
        conOcupado(async () => {
          const cred = await signInWithPopup(auth, new GoogleAuthProvider())
          const existe = (await getDoc(doc(db, 'users', cred.user.uid))).exists()
          if (!existe && rolSiEsNuevo) await crearPerfil(cred.user, cred.user.displayName ?? 'Sin nombre', rolSiEsNuevo)
          // Si no existe y no se eligió rol, el guard lleva a /app/completar-perfil.
        }),
      completarPerfil: ({ nombre, rol, organizacion }) =>
        conOcupado(async () => {
          if (!auth.currentUser) throw new Error('Sin sesión')
          await crearPerfil(auth.currentUser, nombre, rol, organizacion)
        }),
      solicitarPerfil: ({ rol, organizacion }) =>
        conOcupado(async () => {
          if (!auth.currentUser) throw new Error('Sin sesión')
          const uid = auth.currentUser.uid
          await updateDoc(doc(db, 'users', uid), { role: rol, status: 'pendiente', organization: organizacion.trim() })
          if (rol === 'club') await crearClubPendiente(uid, organizacion.trim())
        }),
      registrarClub: () =>
        conOcupado(async () => {
          if (!auth.currentUser || !perfil?.organization) throw new Error('Sin organización')
          await crearClubPendiente(auth.currentUser.uid, perfil.organization)
        }),
      salir: () => signOut(auth),
    }),
    [usuario, perfil, esAdmin, authListo, perfilListo, claimsListo, ocupado, conOcupado],
  )

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}
