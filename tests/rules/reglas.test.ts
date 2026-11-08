import { assertFails, assertSucceeds, type RulesTestEnvironment } from '@firebase/rules-unit-testing'
import { collection, deleteDoc, doc, getDoc, getDocs, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore'
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'
import { crearEntorno } from './ayuda'

let env: RulesTestEnvironment

beforeAll(async () => {
  env = await crearEntorno('demo-rugby5022-reglas')
})
afterAll(async () => env.cleanup())
beforeEach(async () => {
  await env.clearFirestore()
  await env.withSecurityRulesDisabled(async ctx => {
    const db = ctx.firestore()
    const base = { isDemo: true, createdAt: new Date() }
    const usuario = (id: string, role: string, status: string, extra: Record<string, unknown> = {}) =>
      setDoc(doc(db, `users/${id}`), { ...base, email: `${id}@test.com`, displayName: `Usuario ${id}`, role, status, ...extra })
    await usuario('fan1', 'aficionado', 'activo')
    await usuario('fan2', 'aficionado', 'activo')
    await usuario('club1', 'club', 'activo', { organization: 'Club Uno' })
    await usuario('club2', 'club', 'activo', { organization: 'Club Dos' })
    await usuario('clubpend', 'club', 'pendiente', { organization: 'Club Pendiente' })
    await usuario('union1', 'union', 'activo', { organization: 'Unión' })
    await usuario('unionpend', 'union', 'pendiente', { organization: 'Unión Nueva' })
    await setDoc(doc(db, 'clubs/club1'), { ...base, name: 'Club Uno', status: 'activo', ownerId: 'club1' })
    await setDoc(doc(db, 'clubs/club2'), { ...base, name: 'Club Dos', status: 'activo', ownerId: 'club2' })
    await setDoc(doc(db, 'clubs/clubpend'), { ...base, name: 'Club Pendiente', status: 'pendiente', ownerId: 'clubpend' })
    await setDoc(doc(db, 'clubs/sinduenio'), { ...base, name: 'Club Sin Dueño', status: 'activo', ownerId: '' })
    await setDoc(doc(db, 'clubs/club1/jugadores/j1'), { ...base, name: 'Mateo Fernández', position: 'Pilar', matchesPlayed: 3, tries: 0 })
    await setDoc(doc(db, 'clubs/club1/asistencias/j1_2026-05-04'), { playerId: 'j1', date: '2026-05-04', status: 'presente' })
    await setDoc(doc(db, 'clubs/club1/lesiones/l1'), { ...base, playerId: 'j1', playerName: 'Mateo Fernández', date: '2026-05-01', area: 'Rodilla', status: 'En recuperación' })
    await setDoc(doc(db, 'categorias/cat1'), { ...base, competition: 'Torneo Regional', name: 'Primera', season: 'Temporada ficticia' })
    await setDoc(doc(db, 'partidos/p1'), { ...base, categoryId: 'cat1', round: 1, homeClubId: 'club1', awayClubId: 'club2', home: 'Club Uno', away: 'Club Dos', homeScore: 20, awayScore: 10 })
    await setDoc(doc(db, 'partidos/p2'), { ...base, categoryId: 'cat1', round: 2, homeClubId: 'club1', awayClubId: 'club2', home: 'Club Uno', away: 'Club Dos', homeScore: null, awayScore: null })
  })
})

const como = (uid: string, email = `${uid}@test.com`, claims: Record<string, unknown> = {}) => env.authenticatedContext(uid, { email, ...claims }).firestore()
const anonimo = () => env.unauthenticatedContext().firestore()
const admin = () => como('admin1', 'admin@test.com', { admin: true })

describe('users: alta y escalada de privilegios', () => {
  const alta = (extra: Record<string, unknown> = {}) => ({ email: 'nuevo@test.com', displayName: 'Nuevo', role: 'aficionado', status: 'activo', isDemo: false, createdAt: serverTimestamp(), ...extra })

  it('un aficionado nuevo se crea activo', async () => {
    await assertSucceeds(setDoc(doc(como('nuevo'), 'users/nuevo'), alta()))
  })
  it('club y unión solo pueden crearse pendientes y con nombre de organización', async () => {
    const db = como('nuevo')
    await assertFails(setDoc(doc(db, 'users/nuevo'), alta({ role: 'club', status: 'activo', organization: 'Club X' })))
    await assertFails(setDoc(doc(db, 'users/nuevo'), alta({ role: 'club', status: 'pendiente' })))
    await assertFails(setDoc(doc(db, 'users/nuevo'), alta({ role: 'union', status: 'pendiente', organization: 'X' })))
    await assertSucceeds(setDoc(doc(db, 'users/nuevo'), alta({ role: 'club', status: 'pendiente', organization: 'Club X' })))
    await assertSucceeds(setDoc(doc(como('nuevo2', 'nuevo@test.com'), 'users/nuevo2'), alta({ role: 'union', status: 'pendiente', organization: 'Unión X' })))
  })
  it('no se puede crear como admin, con campos de más, ni el perfil de otro uid', async () => {
    const db = como('nuevo')
    await assertFails(setDoc(doc(db, 'users/nuevo'), alta({ role: 'admin' })))
    await assertFails(setDoc(doc(db, 'users/nuevo'), alta({ admin: true })))
    await assertFails(setDoc(doc(db, 'users/nuevo'), alta({ isDemo: true })))
    await assertFails(setDoc(doc(db, 'users/nuevo'), alta({ organization: 'Club X' })))
    await assertFails(setDoc(doc(db, 'users/otro'), alta()))
    await assertFails(setDoc(doc(db, 'users/nuevo'), alta({ email: 'otro@mail.com' })))
  })
  it('un usuario NO puede escalar su rol ni su estado', async () => {
    const db = como('fan1')
    await assertFails(updateDoc(doc(db, 'users/fan1'), { role: 'admin' }))
    await assertFails(updateDoc(doc(db, 'users/fan1'), { role: 'club', status: 'activo', organization: 'Club X' }))
    await assertFails(updateDoc(doc(db, 'users/fan1'), { status: 'suspendido' }))
    await assertSucceeds(updateDoc(doc(db, 'users/fan1'), { displayName: 'Otro Nombre' }))
  })
  it('un club o unión pendiente NO puede aprobarse solo', async () => {
    await assertFails(updateDoc(doc(como('clubpend'), 'users/clubpend'), { status: 'activo' }))
    await assertFails(updateDoc(doc(como('unionpend'), 'users/unionpend'), { status: 'activo' }))
    await assertFails(updateDoc(doc(como('club1'), 'users/club1'), { role: 'union' }))
  })
  it('un aficionado puede PEDIR ser club o unión, pero queda pendiente', async () => {
    const db = como('fan1')
    await assertSucceeds(updateDoc(doc(db, 'users/fan1'), { role: 'club', status: 'pendiente', organization: 'Club Nuevo' }))
  })
  it('el pedido de perfil no admite estado activo, admin ni nombre vacío', async () => {
    const db = como('fan2')
    await assertFails(updateDoc(doc(db, 'users/fan2'), { role: 'union', status: 'activo', organization: 'Unión X' }))
    await assertFails(updateDoc(doc(db, 'users/fan2'), { role: 'admin', status: 'pendiente', organization: 'Unión X' }))
    await assertFails(updateDoc(doc(db, 'users/fan2'), { role: 'club', status: 'pendiente' }))
  })
  it('no se leen perfiles ajenos, ni se lista la colección; anónimo tampoco', async () => {
    await assertFails(getDoc(doc(como('fan1'), 'users/fan2')))
    await assertFails(getDoc(doc(anonimo(), 'users/fan1')))
    await assertFails(getDocs(collection(como('fan1'), 'users')))
    await assertSucceeds(getDoc(doc(como('fan1'), 'users/fan1')))
  })
  it('el admin (claim) lee todos, aprueba, suspende, y no crea otro admin ni borra', async () => {
    const db = admin()
    await assertSucceeds(getDocs(collection(db, 'users')))
    await assertSucceeds(updateDoc(doc(db, 'users/clubpend'), { status: 'activo' }))
    await assertSucceeds(updateDoc(doc(db, 'users/unionpend'), { status: 'rechazado' }))
    await assertSucceeds(updateDoc(doc(db, 'users/fan1'), { status: 'suspendido' }))
    await assertFails(updateDoc(doc(db, 'users/fan1'), { role: 'admin' }))
    await assertFails(updateDoc(doc(db, 'users/fan1'), { status: 'cualquiera' }))
    await assertFails(deleteDoc(doc(db, 'users/fan1')))
  })
  it('un usuario con role "admin" en su doc pero SIN claim no es admin', async () => {
    await env.withSecurityRulesDisabled(async ctx => setDoc(doc(ctx.firestore(), 'users/falso'), { email: 'f@test.com', displayName: 'Falso', role: 'admin', status: 'activo', isDemo: false, createdAt: new Date() }))
    await assertFails(getDocs(collection(como('falso'), 'users')))
    await assertFails(setDoc(doc(como('falso'), 'categorias/x'), { competition: 'Hack', name: 'X', season: 'Y', isDemo: false, createdAt: serverTimestamp() }))
  })
})

describe('clubs', () => {
  const nuevoClub = (uid: string, extra: Record<string, unknown> = {}) => ({ name: 'Club Pendiente', status: 'pendiente', ownerId: uid, isDemo: false, createdAt: serverTimestamp(), ...extra })

  it('lo activo es público; lo pendiente solo lo ven su dueño y el admin', async () => {
    await assertSucceeds(getDocs(query(collection(anonimo(), 'clubs'), where('status', '==', 'activo'))))
    await assertFails(getDocs(collection(anonimo(), 'clubs')))
    await assertFails(getDoc(doc(como('fan1'), 'clubs/clubpend')))
    await assertSucceeds(getDoc(doc(como('clubpend'), 'clubs/clubpend')))
    await assertSucceeds(getDocs(query(collection(como('clubpend'), 'clubs'), where('ownerId', '==', 'clubpend'))))
    await assertSucceeds(getDocs(collection(admin(), 'clubs')))
  })
  it('un usuario de tipo club registra su club (id = uid) y queda pendiente', async () => {
    await env.withSecurityRulesDisabled(async ctx => setDoc(doc(ctx.firestore(), 'users/nuevoclub'), { email: 'n@test.com', displayName: 'Nuevo', role: 'club', status: 'pendiente', organization: 'Club Recién Llegado', isDemo: false, createdAt: new Date() }))
    const db = como('nuevoclub')
    await assertFails(setDoc(doc(db, 'clubs/nuevoclub'), nuevoClub('nuevoclub', { name: 'Otro Nombre' })))
    await assertFails(setDoc(doc(db, 'clubs/nuevoclub'), nuevoClub('nuevoclub', { name: 'Club Recién Llegado', status: 'activo' })))
    await assertFails(setDoc(doc(db, 'clubs/otro'), nuevoClub('nuevoclub', { name: 'Club Recién Llegado' })))
    await assertSucceeds(setDoc(doc(db, 'clubs/nuevoclub'), nuevoClub('nuevoclub', { name: 'Club Recién Llegado' })))
  })
  it('un aficionado no puede crear un club', async () => {
    await assertFails(setDoc(doc(como('fan1'), 'clubs/fan1'), nuevoClub('fan1')))
  })
  it('el dueño no puede activar ni renombrar su club; el admin sí', async () => {
    await assertFails(updateDoc(doc(como('clubpend'), 'clubs/clubpend'), { status: 'activo' }))
    await assertFails(updateDoc(doc(como('club1'), 'clubs/club1'), { name: 'Otro' }))
    await assertSucceeds(updateDoc(doc(admin(), 'clubs/clubpend'), { status: 'activo' }))
    await assertFails(updateDoc(doc(admin(), 'clubs/clubpend'), { ownerId: 'fan1' }))
  })
  it('el admin crea clubes sin dueño; nadie más borra', async () => {
    await assertSucceeds(setDoc(doc(admin(), 'clubs/nuevo'), { name: 'Club Nuevo', status: 'activo', ownerId: '', isDemo: false, createdAt: serverTimestamp() }))
    await assertFails(deleteDoc(doc(como('club1'), 'clubs/club1')))
    await assertSucceeds(deleteDoc(doc(admin(), 'clubs/sinduenio')))
  })
})

describe('plantel, asistencia y lesiones (privados del club)', () => {
  const jugador = (extra: Record<string, unknown> = {}) => ({ name: 'Nuevo Jugador', position: 'Wing', matchesPlayed: 0, tries: 0, isDemo: false, createdAt: serverTimestamp(), ...extra })

  it('solo el club dueño (activo) y el admin leen el plantel', async () => {
    await assertSucceeds(getDocs(collection(como('club1'), 'clubs/club1/jugadores')))
    await assertSucceeds(getDocs(collection(admin(), 'clubs/club1/jugadores')))
    await assertFails(getDocs(collection(como('club2'), 'clubs/club1/jugadores')))
    await assertFails(getDocs(collection(como('fan1'), 'clubs/club1/jugadores')))
    await assertFails(getDocs(collection(como('union1'), 'clubs/club1/jugadores')))
    await assertFails(getDocs(collection(anonimo(), 'clubs/club1/jugadores')))
  })
  it('el club carga, edita y quita jugadores propios', async () => {
    const db = como('club1')
    await assertSucceeds(setDoc(doc(db, 'clubs/club1/jugadores/j2'), jugador()))
    await assertSucceeds(updateDoc(doc(db, 'clubs/club1/jugadores/j2'), { tries: 2 }))
    await assertSucceeds(deleteDoc(doc(db, 'clubs/club1/jugadores/j2')))
  })
  it('no se carga plantel en un club ajeno ni siendo pendiente', async () => {
    await assertFails(setDoc(doc(como('club2'), 'clubs/club1/jugadores/j3'), jugador()))
    await assertFails(setDoc(doc(como('fan1'), 'clubs/club1/jugadores/j3'), jugador()))
    await assertFails(setDoc(doc(como('clubpend'), 'clubs/clubpend/jugadores/j3'), jugador()))
  })
  it('valida tipos y campos del jugador', async () => {
    const db = como('club1')
    await assertFails(setDoc(doc(db, 'clubs/club1/jugadores/x1'), jugador({ name: 'A' })))
    await assertFails(setDoc(doc(db, 'clubs/club1/jugadores/x2'), jugador({ tries: -1 })))
    await assertFails(setDoc(doc(db, 'clubs/club1/jugadores/x3'), jugador({ tries: '2' })))
    await assertFails(setDoc(doc(db, 'clubs/club1/jugadores/x4'), jugador({ extra: 1 })))
  })
  it('asistencia: el id debe ser jugador_fecha y el jugador existir', async () => {
    const db = como('club1')
    await assertSucceeds(setDoc(doc(db, 'clubs/club1/asistencias/j1_2026-05-11'), { playerId: 'j1', date: '2026-05-11', status: 'ausente' }))
    await assertSucceeds(updateDoc(doc(db, 'clubs/club1/asistencias/j1_2026-05-04'), { status: 'justificado' }))
    await assertFails(setDoc(doc(db, 'clubs/club1/asistencias/cualquiera'), { playerId: 'j1', date: '2026-05-12', status: 'presente' }))
    await assertFails(setDoc(doc(db, 'clubs/club1/asistencias/j1_2026-05-13'), { playerId: 'j1', date: '2026-05-13', status: 'tal vez' }))
    await assertFails(setDoc(doc(db, 'clubs/club1/asistencias/zz_2026-05-13'), { playerId: 'zz', date: '2026-05-13', status: 'presente' }))
    await assertFails(setDoc(doc(db, 'clubs/club1/asistencias/j1_13-05-2026'), { playerId: 'j1', date: '13-05-2026', status: 'presente' }))
    await assertFails(setDoc(doc(como('club2'), 'clubs/club1/asistencias/j1_2026-05-14'), { playerId: 'j1', date: '2026-05-14', status: 'presente' }))
  })
  it('lesiones: el nombre del jugador debe coincidir y los enums son válidos', async () => {
    const db = como('club1')
    const les = (extra: Record<string, unknown> = {}) => ({ playerId: 'j1', playerName: 'Mateo Fernández', date: '2026-05-10', area: 'Tobillo', status: 'En recuperación', isDemo: false, createdAt: serverTimestamp(), ...extra })
    await assertSucceeds(setDoc(doc(db, 'clubs/club1/lesiones/n1'), les()))
    await assertFails(setDoc(doc(db, 'clubs/club1/lesiones/n2'), les({ playerName: 'Otro' })))
    await assertFails(setDoc(doc(db, 'clubs/club1/lesiones/n3'), les({ area: 'Cabeza' })))
    await assertFails(setDoc(doc(db, 'clubs/club1/lesiones/n4'), les({ status: 'Grave' })))
    await assertFails(setDoc(doc(como('club2'), 'clubs/club1/lesiones/n5'), les()))
    await assertSucceeds(updateDoc(doc(db, 'clubs/club1/lesiones/l1'), { status: 'Alta deportiva' }))
    await assertFails(updateDoc(doc(db, 'clubs/club1/lesiones/l1'), { area: 'Hombro' }))
    await assertSucceeds(deleteDoc(doc(db, 'clubs/club1/lesiones/l1')))
  })
})

describe('categorias y partidos', () => {
  const cat = (extra: Record<string, unknown> = {}) => ({ competition: 'Copa', name: 'Primera', season: '2026', isDemo: false, createdAt: serverTimestamp(), ...extra })
  const partido = (extra: Record<string, unknown> = {}) => ({ categoryId: 'cat1', round: 3, homeClubId: 'club1', awayClubId: 'club2', home: 'Club Uno', away: 'Club Dos', homeScore: null, awayScore: null, isDemo: false, createdAt: serverTimestamp(), ...extra })

  it('torneos y resultados son públicos (sin login)', async () => {
    await assertSucceeds(getDocs(collection(anonimo(), 'categorias')))
    await assertSucceeds(getDocs(query(collection(anonimo(), 'partidos'), where('categoryId', '==', 'cat1'))))
  })
  it('admin y Unión activa gestionan; aficionado, club y Unión pendiente no', async () => {
    await assertSucceeds(setDoc(doc(admin(), 'categorias/a'), cat()))
    await assertSucceeds(setDoc(doc(como('union1'), 'categorias/b'), cat()))
    await assertFails(setDoc(doc(como('unionpend'), 'categorias/c'), cat()))
    await assertFails(setDoc(doc(como('club1'), 'categorias/d'), cat()))
    await assertFails(setDoc(doc(como('fan1'), 'categorias/e'), cat()))
    await assertFails(setDoc(doc(anonimo(), 'categorias/f'), cat()))
    await assertFails(setDoc(doc(como('union1'), 'categorias/g'), cat({ name: '' })))
    await assertSucceeds(deleteDoc(doc(como('union1'), 'categorias/cat1')))
    await assertFails(deleteDoc(doc(como('club1'), 'categorias/cat1')))
  })
  it('un partido se programa sin resultado y se le carga el resultado después', async () => {
    const db = como('union1')
    await assertSucceeds(setDoc(doc(db, 'partidos/n1'), partido()))
    await assertSucceeds(updateDoc(doc(db, 'partidos/n1'), { homeScore: 25, awayScore: 17 }))
    await assertSucceeds(updateDoc(doc(admin(), 'partidos/p1'), { homeScore: 31, awayScore: 31 }))
  })
  it('valida resultado, local/visitante y nombres de club', async () => {
    const db = como('union1')
    await assertFails(setDoc(doc(db, 'partidos/x1'), partido({ homeScore: 10 })))
    await assertFails(setDoc(doc(db, 'partidos/x2'), partido({ homeScore: -1, awayScore: 3 })))
    await assertFails(setDoc(doc(db, 'partidos/x3'), partido({ homeScore: 400, awayScore: 3 })))
    await assertFails(setDoc(doc(db, 'partidos/x4'), partido({ homeScore: '10', awayScore: '3' })))
    await assertFails(setDoc(doc(db, 'partidos/x5'), partido({ awayClubId: 'club1', away: 'Club Uno' })))
    await assertFails(setDoc(doc(db, 'partidos/x6'), partido({ home: 'Nombre Falso' })))
    await assertFails(setDoc(doc(db, 'partidos/x7'), partido({ awayClubId: 'clubpend', away: 'Club Pendiente' })))
    await assertFails(setDoc(doc(db, 'partidos/x8'), partido({ categoryId: 'no-existe' })))
    await assertFails(setDoc(doc(db, 'partidos/x9'), partido({ round: 0 })))
    await assertFails(setDoc(doc(db, 'partidos/x10'), partido({ extra: 1 })))
    await assertFails(updateDoc(doc(db, 'partidos/p2'), { homeScore: 5 }))
    await assertFails(updateDoc(doc(db, 'partidos/p2'), { home: 'Hack' }))
  })
  it('un club no carga resultados ni siquiera de sus partidos', async () => {
    await assertFails(updateDoc(doc(como('club1'), 'partidos/p2'), { homeScore: 99, awayScore: 0 }))
    await assertFails(setDoc(doc(como('club1'), 'partidos/n2'), partido()))
    await assertFails(deleteDoc(doc(como('fan1'), 'partidos/p1')))
    await assertSucceeds(deleteDoc(doc(como('union1'), 'partidos/p1')))
  })
  it('colecciones no declaradas están denegadas', async () => {
    await assertFails(setDoc(doc(admin(), 'otra/x'), { a: 1 }))
    await assertFails(getDoc(doc(admin(), 'otra/x')))
  })
})
