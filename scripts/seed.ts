/**
 * Datos de DEMO (todo marcado isDemo: true). Solo para los EMULADORES.
 *   1) npm run emuladores   (en otra terminal)
 *   2) npm run seed
 * Es idempotente: se puede correr varias veces.
 */
import { pathToFileURL } from 'node:url'
import { iniciarAdmin } from './lib/admin-sdk'

export const CLAVE_DEMO = 'Demo-Clave-2026' // pública, solo existe en los emuladores

export const USUARIOS_DEMO = [
  { uid: 'demo-usuario', email: 'usuario.demo@plantilla.test', displayName: 'Usuario Demo', role: 'usuario', status: 'activo' },
  { uid: 'demo-socio', email: 'socio.demo@plantilla.test', displayName: 'Socio Demo', role: 'socio', status: 'activo' },
  { uid: 'demo-socio-pendiente', email: 'pendiente.demo@plantilla.test', displayName: 'Socio Pendiente Demo', role: 'socio', status: 'pendiente' },
  { uid: 'demo-admin', email: 'admin.demo@plantilla.test', displayName: 'Admin Demo', role: 'admin', status: 'activo' },
] as const

export async function sembrar() {
  const { auth, db, esEmulador } = iniciarAdmin()
  if (!esEmulador) throw new Error('El seed solo corre contra emuladores.')

  for (const u of USUARIOS_DEMO) {
    const datos = { email: u.email, displayName: u.displayName, password: CLAVE_DEMO, emailVerified: true }
    await auth.updateUser(u.uid, datos).catch(() => auth.createUser({ uid: u.uid, ...datos }))
    await auth.setCustomUserClaims(u.uid, u.role === 'admin' ? { admin: true } : {})
    await db.doc(`users/${u.uid}`).set({ email: u.email, displayName: u.displayName, role: u.role, status: u.status, isDemo: true, createdAt: new Date() })
  }

  const items = [
    { id: 'demo-item-1', titulo: 'Ítem de ejemplo publicado', descripcion: 'Contenido de demostración cargado por el socio demo.', publicado: true },
    { id: 'demo-item-2', titulo: 'Ítem de ejemplo en borrador', descripcion: 'Este todavía no se ve para los usuarios.', publicado: false },
  ]
  for (const i of items) {
    const { id, ...resto } = i
    await db.doc(`items/${id}`).set({ ...resto, ownerId: 'demo-socio', ownerName: 'Socio Demo', isDemo: true, createdAt: new Date() })
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  sembrar()
    .then(() => {
      console.log('✔ Seed de demo listo (emuladores). Usuarios DEMO (clave pública de demo):')
      for (const u of USUARIOS_DEMO) console.log(`  ${u.role.padEnd(8)} ${u.email}  /  ${CLAVE_DEMO}`)
    })
    .catch((e: unknown) => {
      console.error(`✖ ${e instanceof Error ? e.message : String(e)}`)
      process.exit(1)
    })
}
