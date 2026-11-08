// ──────────────────────────────────────────────────────────────────────────
// CONFIGURACIÓN DE LA STARTUP — acá se cambia lo que es propio de cada proyecto.
// Los colores y la tipografía se cambian en src/styles/tema.css.
// Si agregás o renombrás roles, hay que cambiarlos TAMBIÉN en firestore.rules.
// ──────────────────────────────────────────────────────────────────────────

export const MARCA = {
  nombre: 'Mi Startup',
  eslogan: 'Una frase corta que explique qué hacés',
  logo: '/logo.svg',
  contacto: 'contacto@mistartup.test',
}

export type Rol = 'usuario' | 'socio' | 'admin'
export type Estado = 'activo' | 'pendiente' | 'suspendido'

export const ESTADOS: Estado[] = ['activo', 'pendiente', 'suspendido']

export type RolRegistrable = Exclude<Rol, 'admin'>

export const ROLES_REGISTRABLES: {
  rol: RolRegistrable
  etiqueta: string
  descripcion: string
  /** Si es true el usuario queda "pendiente" hasta que el admin lo aprueba. */
  requiereAprobacion: boolean
  /** Panel al que va después de ingresar. */
  panel: string
}[] = [
  { rol: 'usuario', etiqueta: 'Usuario', descripcion: 'Usá la app y guardá tus cosas.', requiereAprobacion: false, panel: '/app/usuario' },
  { rol: 'socio', etiqueta: 'Socio', descripcion: 'Publicá contenido. Necesita aprobación del equipo.', requiereAprobacion: true, panel: '/app/socio' },
]

export const ETIQUETA_ROL: Record<Rol, string> = { usuario: 'Usuario', socio: 'Socio', admin: 'Administrador' }

export function panelDe(rol: Rol): string {
  if (rol === 'admin') return '/admin'
  return ROLES_REGISTRABLES.find(r => r.rol === rol)?.panel ?? '/app'
}

/** Landing pública: textos editables. */
export const LANDING = {
  problema: { titulo: 'El problema', texto: 'Describí acá el problema que tiene tu cliente hoy.' },
  solucion: { titulo: 'La solución', texto: 'Explicá cómo tu startup lo resuelve.' },
  beneficios: [
    { titulo: 'Beneficio uno', texto: 'Contá qué gana el cliente.' },
    { titulo: 'Beneficio dos', texto: 'Otro motivo para elegirte.' },
    { titulo: 'Beneficio tres', texto: 'Y un tercero.' },
  ],
  cta: { titulo: 'Empezá hoy', texto: 'Creá tu cuenta gratis en menos de un minuto.' },
}

/** Credenciales DEMO públicas (las crea scripts/seed.ts solo en los emuladores). */
export const CLAVE_DEMO = 'Demo-Clave-2026'
