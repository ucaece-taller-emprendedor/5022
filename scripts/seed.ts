/**
 * Datos de DEMO (todo marcado isDemo: true). Por defecto corre contra los EMULADORES. Para producción: FIREBASE_PROJECT_ID=... GOOGLE_APPLICATION_CREDENTIALS=... npm run seed -- --produccion --yes
 *   1) npm run emuladores   (en otra terminal)
 *   2) npm run seed
 * Es idempotente: se puede correr varias veces.
 */
import { pathToFileURL } from 'node:url'
import { iniciarAdmin } from './lib/admin-sdk'

export const CLAVE_DEMO = 'Demo-Clave-2026' // pública, solo existe en los emuladores

export const USUARIOS_DEMO = [
  { uid: 'demo-aficionado', email: 'aficionado@demo.5022.test', displayName: 'Aficionado Demo', role: 'aficionado', status: 'activo' },
  { uid: 'demo-club', email: 'club@demo.5022.test', displayName: 'Club Demo', role: 'club', status: 'activo', organization: 'Mar del Plata Club' },
  { uid: 'demo-union', email: 'union@demo.5022.test', displayName: 'Unión Demo', role: 'union', status: 'activo', organization: 'Unión de Rugby de Mar del Plata (demo)' },
  { uid: 'demo-club-pendiente', email: 'club.pendiente@demo.5022.test', displayName: 'Club Pendiente Demo', role: 'club', status: 'pendiente', organization: 'Los Tilos RC (pendiente)' },
  { uid: 'demo-admin', email: 'admin@demo.5022.test', displayName: 'Superadmin Demo', role: 'admin', status: 'activo' },
] as const

const EQUIPOS = ['Mar del Plata Club', 'Sporting', 'San Ignacio', 'Universitario', 'Comercial', 'Los Cardos', 'Biguá', 'Pueyrredón']
const FECHAS: [string, string, number | null, number | null][][] = [
  [['Mar del Plata Club', 'Pueyrredón', 31, 12], ['Sporting', 'Biguá', 26, 17], ['San Ignacio', 'Los Cardos', 19, 22], ['Universitario', 'Comercial', 24, 18]],
  [['Mar del Plata Club', 'Biguá', 28, 15], ['Pueyrredón', 'Los Cardos', 17, 21], ['Sporting', 'Comercial', 30, 14], ['San Ignacio', 'Universitario', 20, 20]],
  [['Mar del Plata Club', 'Los Cardos', 22, 18], ['Biguá', 'Comercial', 12, 25], ['Pueyrredón', 'Universitario', 16, 27], ['Sporting', 'San Ignacio', 24, 19]],
  [['Mar del Plata Club', 'Comercial', null, null], ['Los Cardos', 'Universitario', null, null], ['Biguá', 'San Ignacio', null, null], ['Pueyrredón', 'Sporting', null, null]],
  [['Mar del Plata Club', 'Universitario', null, null], ['Comercial', 'San Ignacio', null, null], ['Los Cardos', 'Sporting', null, null], ['Biguá', 'Pueyrredón', null, null]],
]
const PLANTEL: [string, string, number, number][] = [
  ['Mateo Fernández', 'Pilar', 3, 0], ['Tomás Rodríguez', 'Hooker', 3, 1], ['Lucas Martínez', 'Segunda línea', 3, 0], ['Nicolás Pérez', 'Medio scrum', 3, 1],
  ['Juan García', 'Apertura', 3, 2], ['Franco López', 'Centro', 3, 1], ['Agustín Díaz', 'Wing', 3, 2], ['Pedro Silva', 'Fullback', 2, 1],
]

const slug = (t: string) => t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const hoy = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Argentina/Buenos_Aires' })

/** En producción NO se crean cuentas demo (tendrían contraseña pública): solo datos de ejemplo. */
function usuariosDemoActivos() {
  return process.argv.includes('--produccion') ? [] : USUARIOS_DEMO
}

export async function sembrar() {
  const { auth, db, esEmulador } = iniciarAdmin({ produccion: process.argv.includes('--produccion') })
  if (!esEmulador && !process.argv.includes('--yes')) throw new Error('Para sembrar PRODUCCIÓN agregá --produccion --yes (en producción solo se cargan datos de ejemplo, sin cuentas demo).')
  const ahora = new Date()

  for (const u of usuariosDemoActivos()) {
    const datos = { email: u.email, displayName: u.displayName, password: CLAVE_DEMO, emailVerified: true }
    await auth.updateUser(u.uid, datos).catch(() => auth.createUser({ uid: u.uid, ...datos }))
    await auth.setCustomUserClaims(u.uid, u.role === 'admin' ? { admin: true } : {})
    await db.doc(`users/${u.uid}`).set({
      email: u.email, displayName: u.displayName, role: u.role, status: u.status,
      ...('organization' in u ? { organization: u.organization } : {}),
      isDemo: true, createdAt: ahora,
    })
  }

  // Clubes demo (el de "Club Demo" tiene dueño) + un club pendiente de aprobación (id = uid de su dueño, como en el registro real).
  const idClub = (nombre: string) => `demo-${slug(nombre)}`
  for (const nombre of EQUIPOS) {
    await db.doc(`clubs/${idClub(nombre)}`).set({ name: nombre, status: 'activo', ownerId: nombre === 'Mar del Plata Club' ? 'demo-club' : '', isDemo: true, createdAt: ahora })
  }
  await db.doc('clubs/demo-club-pendiente').set({ name: 'Los Tilos RC (pendiente)', status: 'pendiente', ownerId: 'demo-club-pendiente', isDemo: true, createdAt: ahora })

  await db.doc('categorias/demo-torneo-regional-primera').set({ competition: 'Torneo Regional', name: 'Primera', season: 'Temporada ficticia', isDemo: true, createdAt: ahora })
  for (const [i, fecha] of FECHAS.entries()) {
    for (const [j, [local, visitante, hs, as]] of fecha.entries()) {
      await db.doc(`partidos/demo-f${i + 1}-${j + 1}`).set({
        categoryId: 'demo-torneo-regional-primera', round: i + 1,
        homeClubId: idClub(local), awayClubId: idClub(visitante), home: local, away: visitante,
        homeScore: hs, awayScore: as, isDemo: true, createdAt: ahora,
      })
    }
  }

  const base = `clubs/${idClub('Mar del Plata Club')}`
  for (const [nombre, posicion, partidos, tries] of PLANTEL) {
    await db.doc(`${base}/jugadores/demo-${slug(nombre)}`).set({ name: nombre, position: posicion, matchesPlayed: partidos, tries, isDemo: true, createdAt: ahora })
  }
  const asistencias: Record<string, string> = { 'Mateo Fernández': 'presente', 'Tomás Rodríguez': 'presente', 'Lucas Martínez': 'ausente', 'Nicolás Pérez': 'justificado' }
  for (const [nombre, estado] of Object.entries(asistencias)) {
    const id = `demo-${slug(nombre)}`
    await db.doc(`${base}/asistencias/${id}_${hoy()}`).set({ playerId: id, date: hoy(), status: estado })
  }
  await db.doc(`${base}/lesiones/demo-lesion-1`).set({ playerId: 'demo-pedro-silva', playerName: 'Pedro Silva', date: hoy(), area: 'Tobillo', status: 'En recuperación', isDemo: true, createdAt: ahora })
  await db.doc(`${base}/lesiones/demo-lesion-2`).set({ playerId: 'demo-agustin-diaz', playerName: 'Agustín Díaz', date: '2026-04-20', area: 'Hombro', status: 'Alta deportiva', isDemo: true, createdAt: ahora })
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  sembrar()
    .then(() => {
      console.log('✔ Seed de demo listo (emuladores). Usuarios DEMO (clave pública de demo):')
      for (const u of usuariosDemoActivos()) console.log(`  ${u.role.padEnd(10)} ${u.email}  /  ${CLAVE_DEMO}`)
    })
    .catch((e: unknown) => {
      console.error(`✖ ${e instanceof Error ? e.message : String(e)}`)
      process.exit(1)
    })
}
