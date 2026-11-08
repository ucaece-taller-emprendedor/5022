// ──────────────────────────────────────────────────────────────────────────
// CONFIGURACIÓN DE 5022 — marca, roles y textos.
// Los colores se cambian en src/styles/tema.css.
// Si agregás o renombrás roles/enums, hay que cambiarlos TAMBIÉN en firestore.rules.
// ──────────────────────────────────────────────────────────────────────────

export const MARCA = {
  nombre: '5022',
  eslogan: 'El rugby tiene historia. Ahora tiene datos.',
  logo: '/logo.svg',
  contacto: 'contacto@5022.test',
}

export type Rol = 'aficionado' | 'club' | 'union' | 'admin'
export type Estado = 'activo' | 'pendiente' | 'rechazado' | 'suspendido'

export const ESTADOS: Estado[] = ['activo', 'pendiente', 'rechazado', 'suspendido']

export type RolRegistrable = Exclude<Rol, 'admin'>

export const ROLES_REGISTRABLES: {
  rol: RolRegistrable
  etiqueta: string
  descripcion: string
  /** Si es true el usuario queda "pendiente" hasta que el admin lo aprueba. */
  requiereAprobacion: boolean
  /** Panel al que va después de ingresar. */
  panel: string
  /** Si es true hay que indicar el nombre del club / de la Unión al registrarse. */
  pideOrganizacion: boolean
}[] = [
  { rol: 'aficionado', etiqueta: 'Aficionado', descripcion: 'Resultados, posiciones y estadísticas del torneo.', requiereAprobacion: false, panel: '/app/aficionado', pideOrganizacion: false },
  { rol: 'club', etiqueta: 'Club', descripcion: 'Plantel, asistencia y lesiones. Lo aprueba un administrador.', requiereAprobacion: true, panel: '/app/club', pideOrganizacion: true },
  { rol: 'union', etiqueta: 'Unión', descripcion: 'Competencias, calendario y clubes. Lo aprueba un administrador.', requiereAprobacion: true, panel: '/app/union', pideOrganizacion: true },
]

export const ETIQUETA_ROL: Record<Rol, string> = { aficionado: 'Aficionado', club: 'Club', union: 'Unión', admin: 'Superadmin' }
export const ETIQUETA_ESTADO: Record<Estado, string> = { activo: 'Activo', pendiente: 'Pendiente', rechazado: 'Rechazado', suspendido: 'Suspendido' }

export function panelDe(rol: Rol): string {
  if (rol === 'admin') return '/admin'
  return ROLES_REGISTRABLES.find(r => r.rol === rol)?.panel ?? '/app'
}

// ── Dominio del rugby ─────────────────────────────────────────────────────
export const ASISTENCIAS = ['presente', 'ausente', 'justificado'] as const
export type Asistencia = (typeof ASISTENCIAS)[number]
export const ZONAS_LESION = ['Rodilla', 'Tobillo', 'Hombro', 'Muslo', 'Otra'] as const
export const ESTADOS_LESION = ['En recuperación', 'Alta deportiva'] as const

/** Secciones de cada panel (la primera es el resumen). */
export const SECCIONES = {
  aficionado: { titulo: 'Aficionado', items: [['resumen', 'Resumen'], ['partidos', 'Partidos'], ['posiciones', 'Posiciones'], ['estadisticas', 'Estadísticas']] },
  club: { titulo: 'Club', items: [['resumen', 'Resumen'], ['plantel', 'Plantel'], ['asistencias', 'Asistencias'], ['lesiones', 'Lesiones'], ['partidos', 'Mis partidos'], ['rendimiento', 'Rendimiento']] },
  union: { titulo: 'Unión', items: [['resumen', 'Resumen'], ['competencias', 'Competencias'], ['calendario', 'Calendario'], ['clubes', 'Clubes'], ['gestion', 'Gestión de torneos']] },
} as const satisfies Record<string, { titulo: string; items: readonly (readonly [string, string])[] }>

/** Landing pública: textos del prototipo original. */
export const LANDING = {
  hero: {
    etiqueta: 'PLATAFORMA DE RUGBY · DEMO',
    titulo: 'El rugby tiene historia.',
    destacado: 'Ahora tiene datos.',
    texto: 'Partidos, posiciones y estadísticas para los aficionados. Gestión deportiva para clubes y uniones. Una sola plataforma, experiencias distintas.',
  },
  problema: {
    titulo: 'La información del rugby marplatense está dispersa.',
    texto: 'Resultados, tablas y fixtures viven en grupos de mensajería, planillas y redes sociales. No hay un lugar único para aficionados, clubes y la Unión, y cada club lleva a mano su plantel, sus asistencias y sus lesiones.',
  },
  solucion: {
    titulo: 'Información deportiva y gestión, sin dispersión.',
    texto: 'Una sola plataforma. Cada perfil accede únicamente a las herramientas que necesita.',
  },
  perfiles: [
    { simbolo: '◫', titulo: 'Para aficionados', texto: 'Calendario, resultados, posiciones y estadísticas del torneo en un mismo lugar.', enlace: '/partidos', cta: 'Explorar partidos →' },
    { simbolo: '♜', titulo: 'Para clubes', texto: 'Plantel, asistencia a entrenamientos, lesiones y rendimiento del equipo en un panel específico.', enlace: '/app/registro?tipo=club', cta: 'Acceder como club →' },
    { simbolo: '▦', titulo: 'Para uniones', texto: 'Visualización de competencias, calendario y clubes participantes.', enlace: '/app/registro?tipo=union', cta: 'Acceder como unión →' },
  ],
  beneficios: [
    { titulo: 'Datos únicos', texto: 'Las posiciones se calculan solas a partir de los resultados cargados.' },
    { titulo: 'Cada perfil, lo suyo', texto: 'Aficionados, clubes y Unión ven solo las herramientas que aprobó su rol.' },
    { titulo: 'Gestión del club', texto: 'Asistencia y lesiones guardadas en la nube, no en una planilla suelta.' },
    { titulo: 'Cuentas verificadas', texto: 'Clubes y Unión las aprueba un administrador antes de operar.' },
  ],
  cta: { titulo: 'Conocé 5022 desde adentro.', texto: 'Registrate y elegí el perfil que querés explorar.' },
}

export const AVISO_DEMO =
  'DEMO ACADÉMICA: clubes y competencias utilizados como ejemplo; resultados, planteles, cuentas y estadísticas son ficticios. No representa información oficial de la Unión.'

/** Credenciales DEMO públicas (las crea scripts/seed.ts solo en los emuladores). */
export const CLAVE_DEMO = 'Demo-Clave-2026'
