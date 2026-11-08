import { z } from 'zod'
import { ROLES_REGISTRABLES } from '@/config/app'

const email = z.string().trim().toLowerCase().pipe(z.email('Ingresá un email válido.'))
const clave = z.string().min(8, 'La contraseña debe tener al menos 8 caracteres.').max(100, 'La contraseña es demasiado larga.')
const roles = ROLES_REGISTRABLES.map(r => r.rol) as [string, ...string[]]

export const loginSchema = z.object({ email, clave: z.string().min(1, 'Ingresá tu contraseña.') })

export const registroSchema = z.object({
  nombre: z.string().trim().min(2, 'Ingresá tu nombre.').max(80, 'El nombre es demasiado largo.'),
  email,
  clave,
  rol: z.enum(roles, { error: 'Elegí un tipo de usuario.' }),
})

export const perfilSchema = z.object({
  nombre: z.string().trim().min(2, 'Ingresá tu nombre.').max(80, 'El nombre es demasiado largo.'),
  rol: z.enum(roles, { error: 'Elegí un tipo de usuario.' }),
})
