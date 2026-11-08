import type { Estado, Rol } from '@/config/app'

export type Perfil = {
  uid: string
  email: string
  displayName: string
  role: Rol
  status: Estado
  /** Nombre del club o de la Unión (solo club/unión). */
  organization?: string
  isDemo: boolean
}
