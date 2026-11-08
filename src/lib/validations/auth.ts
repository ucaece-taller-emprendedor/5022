import { z } from 'zod'
import { ROLES_REGISTRABLES } from '@/config/app'

const email = z.string().trim().toLowerCase().pipe(z.email('Ingresá un email válido.'))
const clave = z.string().min(8, 'La contraseña debe tener al menos 8 caracteres.').max(100, 'La contraseña es demasiado larga.')
const roles = ROLES_REGISTRABLES.map(r => r.rol) as [string, ...string[]]
const nombre = z.string().trim().min(2, 'Ingresá tu nombre.').max(80, 'El nombre es demasiado largo.')
const organizacion = z.string().trim().max(120, 'Máximo 120 caracteres.').optional()

const pideOrganizacion = (v: { rol: string; organizacion?: string | undefined }) =>
  !ROLES_REGISTRABLES.find(r => r.rol === v.rol)?.pideOrganizacion || (v.organizacion?.length ?? 0) >= 2
const msgOrganizacion = { message: 'Indicá el nombre de tu club o de la Unión.', path: ['organizacion'] }

export const loginSchema = z.object({ email, clave: z.string().min(1, 'Ingresá tu contraseña.') })

export const registroSchema = z
  .object({ nombre, email, clave, rol: z.enum(roles, { error: 'Elegí un tipo de usuario.' }), organizacion })
  .refine(pideOrganizacion, msgOrganizacion)

export const perfilSchema = z
  .object({ nombre, rol: z.enum(roles, { error: 'Elegí un tipo de usuario.' }), organizacion })
  .refine(pideOrganizacion, msgOrganizacion)

/** Un aficionado que pide el perfil de club o Unión. */
export const solicitudSchema = z
  .object({ rol: z.enum(['club', 'union'], { error: 'Elegí un tipo de cuenta.' }), organizacion })
  .refine(pideOrganizacion, msgOrganizacion)
