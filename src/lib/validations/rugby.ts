import { z } from 'zod'
import { ASISTENCIAS, ESTADOS_LESION, ZONAS_LESION } from '@/config/app'

const fechaISO = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida.')

/** Puntaje opcional: vacío = todavía no se jugó. */
const puntaje = z.preprocess(
  v => (v === '' || v === null || v === undefined ? null : Number(v)),
  z.number('Ingresá un número.').int('Tiene que ser un número entero.').min(0, 'No puede ser negativo.').max(300, 'Máximo 300.').nullable(),
)

export const clubSchema = z.object({ nombre: z.string().trim().min(2, 'Ingresá el nombre del club.').max(100, 'Máximo 100 caracteres.') })

export const categoriaSchema = z.object({
  competencia: z.string().trim().min(2, 'Ingresá la competencia.').max(100, 'Máximo 100 caracteres.'),
  categoria: z.string().trim().min(1, 'Ingresá la categoría.').max(60, 'Máximo 60 caracteres.'),
  temporada: z.string().trim().min(2, 'Ingresá la temporada.').max(60, 'Máximo 60 caracteres.'),
})

export const partidoSchema = z
  .object({
    fecha: z.coerce.number('Ingresá la fecha.').int('Tiene que ser un entero.').min(1, 'La fecha debe ser 1 o más.').max(60, 'Máximo 60.'),
    local: z.string().min(1, 'Elegí el local.'),
    visitante: z.string().min(1, 'Elegí el visitante.'),
    puntosLocal: puntaje,
    puntosVisitante: puntaje,
  })
  .refine(v => v.local !== v.visitante, { message: 'Local y visitante deben ser distintos.', path: ['visitante'] })
  .refine(v => (v.puntosLocal === null) === (v.puntosVisitante === null), { message: 'Cargá los dos puntajes o ninguno.', path: ['puntosVisitante'] })

export const resultadoSchema = z
  .object({ puntosLocal: puntaje, puntosVisitante: puntaje })
  .refine(v => (v.puntosLocal === null) === (v.puntosVisitante === null), { message: 'Cargá los dos puntajes o ninguno.', path: ['puntosVisitante'] })

const entero = (max: number) => z.coerce.number('Ingresá un número.').int('Tiene que ser un entero.').min(0, 'No puede ser negativo.').max(max, `Máximo ${max}.`)

export const jugadorSchema = z.object({
  nombre: z.string().trim().min(2, 'Ingresá el nombre del jugador.').max(100, 'Máximo 100 caracteres.'),
  posicion: z.string().trim().min(2, 'Ingresá la posición.').max(60, 'Máximo 60 caracteres.'),
  partidos: entero(999),
  tries: entero(999),
})

export const lesionSchema = z.object({
  jugador: z.string().min(1, 'Elegí un jugador.'),
  fecha: fechaISO,
  zona: z.enum(ZONAS_LESION, { error: 'Elegí la zona.' }),
  estado: z.enum(ESTADOS_LESION, { error: 'Elegí el estado.' }),
})

export const asistenciaSchema = z.enum([...ASISTENCIAS, ''])
export const fechaSchema = fechaISO
